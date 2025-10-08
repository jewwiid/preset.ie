-- Credit & Payment Notifications
-- Triggers notifications when:
-- 1. User's credit balance falls below threshold (low credit warning)
-- 2. Payment is successfully processed (payment received confirmation)

-- ============================================
-- 1. LOW CREDIT WARNING NOTIFICATION
-- ============================================

CREATE OR REPLACE FUNCTION notify_low_credit()
RETURNS TRIGGER AS $$
DECLARE
  v_user_prefs RECORD;
  v_threshold INTEGER := 10; -- Warn when credits fall below 10
  v_critical_threshold INTEGER := 3; -- Critical warning below 3
  v_warning_level TEXT;
  v_warning_title TEXT;
  v_warning_message TEXT;
BEGIN
  -- Only notify when crossing thresholds (not on every credit change)
  -- This prevents notification spam

  -- Check if crossing critical threshold (3 credits)
  IF NEW.current_balance < v_critical_threshold AND OLD.current_balance >= v_critical_threshold THEN
    v_warning_level := 'critical';
    v_warning_title := '🚨 Critical: Almost out of credits';
    v_warning_message := 'You have only ' || NEW.current_balance || ' credits left. Top up now to avoid service interruption.';

  -- Check if crossing low threshold (10 credits)
  ELSIF NEW.current_balance < v_threshold AND OLD.current_balance >= v_threshold THEN
    v_warning_level := 'low';
    v_warning_title := '⚠️ Low credit balance';
    v_warning_message := 'You have ' || NEW.current_balance || ' credits remaining. Consider topping up to continue posting gigs.';

  ELSE
    -- Not crossing a threshold, don't send notification
    RETURN NEW;
  END IF;

  -- Check user preferences
  SELECT
    COALESCE(system_notifications, true) as system_notifications,
    COALESCE(in_app_enabled, true) as in_app_enabled
  INTO v_user_prefs
  FROM notification_preferences
  WHERE user_id = NEW.user_id;

  -- Send notification if preferences allow
  IF COALESCE(v_user_prefs.system_notifications, true)
     AND COALESCE(v_user_prefs.in_app_enabled, true) THEN

    INSERT INTO notifications (
      recipient_id,
      user_id,
      type,
      category,
      title,
      message,
      action_url,
      data
    ) VALUES (
      NEW.user_id,
      NEW.user_id,
      'low_credit_warning',
      'system',
      v_warning_title,
      v_warning_message,
      '/credits/purchase',
      jsonb_build_object(
        'current_credits', NEW.current_balance,
        'previous_credits', OLD.current_balance,
        'threshold', v_threshold,
        'warning_level', v_warning_level,
        'recommended_purchase', CASE
          WHEN NEW.current_balance < v_critical_threshold THEN 50
          ELSE 20
        END
      )
    );

    RAISE NOTICE 'Low credit notification sent: user=%, credits=%, level=%',
      NEW.user_id, NEW.current_balance, v_warning_level;
  ELSE
    RAISE NOTICE 'Low credit notification skipped (preferences disabled): user=%',
      NEW.user_id;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error sending low credit notification: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for credit updates
DROP TRIGGER IF EXISTS trigger_notify_low_credit ON user_credits;
CREATE TRIGGER trigger_notify_low_credit
  AFTER UPDATE OF current_balance ON user_credits
  FOR EACH ROW
  WHEN (pg_trigger_depth() = 0) -- Prevent recursive triggers
  EXECUTE FUNCTION notify_low_credit();


-- ============================================
-- 2. PAYMENT RECEIVED NOTIFICATION
-- ============================================

-- Helper function to check if payments table exists
CREATE OR REPLACE FUNCTION check_payments_table_exists()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'payments'
  );
END;
$$ LANGUAGE plpgsql;

-- Only create payment notification trigger if payments table exists
DO $$
BEGIN
  IF check_payments_table_exists() THEN

    -- Create payment notification function
    CREATE OR REPLACE FUNCTION notify_payment_received()
    RETURNS TRIGGER AS $func$
    DECLARE
      v_user_prefs RECORD;
      v_user_profile RECORD;
    BEGIN
      -- Only notify when payment status changes to COMPLETED
      IF NEW.status = 'COMPLETED' AND (OLD.status IS NULL OR OLD.status != 'COMPLETED') THEN

        -- Get user profile info
        SELECT
          up.user_id,
          up.display_name
        INTO v_user_profile
        FROM users_profile up
        WHERE up.user_id = NEW.user_id;

        -- Check user preferences
        SELECT
          COALESCE(system_notifications, true) as system_notifications,
          COALESCE(in_app_enabled, true) as in_app_enabled
        INTO v_user_prefs
        FROM notification_preferences
        WHERE user_id = NEW.user_id;

        -- Send notification if preferences allow
        IF COALESCE(v_user_prefs.system_notifications, true)
           AND COALESCE(v_user_prefs.in_app_enabled, true) THEN

          INSERT INTO notifications (
            recipient_id,
            user_id,
            type,
            category,
            title,
            message,
            action_url,
            data
          ) VALUES (
            NEW.user_id,
            NEW.user_id,
            'payment_received',
            'system',
            '✅ Payment successful',
            'Your payment of €' || NEW.amount::DECIMAL(10,2) || ' has been processed. Credits added to your account.',
            '/credits/history',
            jsonb_build_object(
              'payment_id', NEW.id,
              'amount', NEW.amount,
              'credits_added', COALESCE(NEW.credits_amount, 0),
              'payment_method', NEW.payment_method,
              'processed_at', NEW.updated_at
            )
          );

          RAISE NOTICE 'Payment notification sent: user=%, amount=%',
            NEW.user_id, NEW.amount;
        ELSE
          RAISE NOTICE 'Payment notification skipped (preferences disabled): user=%',
            NEW.user_id;
        END IF;
      END IF;

      RETURN NEW;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING 'Error sending payment notification: %', SQLERRM;
        RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql;

    -- Create trigger for payment status updates
    DROP TRIGGER IF EXISTS trigger_notify_payment_received ON payments;
    CREATE TRIGGER trigger_notify_payment_received
      AFTER UPDATE OF status ON payments
      FOR EACH ROW
      EXECUTE FUNCTION notify_payment_received();

    RAISE NOTICE 'Payment notification trigger created successfully';

  ELSE
    RAISE NOTICE 'Payments table does not exist - skipping payment notification trigger';
  END IF;
END $$;


-- ============================================
-- 3. CREDIT ADDED NOTIFICATION (Alternative)
-- ============================================
-- If payments table doesn't exist, notify when credits increase significantly

CREATE OR REPLACE FUNCTION notify_credits_added()
RETURNS TRIGGER AS $$
DECLARE
  v_user_prefs RECORD;
  v_credits_added INTEGER;
BEGIN
  -- Only notify on significant credit increases (5+ credits)
  v_credits_added := NEW.current_balance - OLD.current_balance;

  IF v_credits_added >= 5 THEN

    -- Check user preferences
    SELECT
      COALESCE(system_notifications, true) as system_notifications,
      COALESCE(in_app_enabled, true) as in_app_enabled
    INTO v_user_prefs
    FROM notification_preferences
    WHERE user_id = NEW.user_id;

    -- Send notification if preferences allow
    IF COALESCE(v_user_prefs.system_notifications, true)
       AND COALESCE(v_user_prefs.in_app_enabled, true) THEN

      INSERT INTO notifications (
        recipient_id,
        user_id,
        type,
        category,
        title,
        message,
        action_url,
        data
      ) VALUES (
        NEW.user_id,
        NEW.user_id,
        'credits_added',
        'system',
        '✅ Credits added',
        v_credits_added || ' credits added to your account. New balance: ' || NEW.current_balance,
        '/credits/history',
        jsonb_build_object(
          'credits_added', v_credits_added,
          'new_balance', NEW.current_balance,
          'previous_balance', OLD.current_balance,
          'added_at', NOW()
        )
      );

      RAISE NOTICE 'Credits added notification sent: user=%, amount=%',
        NEW.user_id, v_credits_added;
    END IF;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error sending credits added notification: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for credit increases
DROP TRIGGER IF EXISTS trigger_notify_credits_added ON user_credits;
CREATE TRIGGER trigger_notify_credits_added
  AFTER UPDATE OF current_balance ON user_credits
  FOR EACH ROW
  WHEN (pg_trigger_depth() = 0) -- Prevent recursive triggers
  EXECUTE FUNCTION notify_credits_added();


-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Ensure we have indexes on user_credits
CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON user_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_user_credits_current_balance ON user_credits(current_balance);


-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON FUNCTION notify_low_credit() IS
  'Sends notification when user credits fall below threshold (10 credits = warning, 3 credits = critical). Only notifies on threshold crossings to avoid spam.';

COMMENT ON FUNCTION notify_credits_added() IS
  'Sends notification when credits are added to user account (5+ credits). Fallback for when payments table does not exist.';

COMMENT ON FUNCTION check_payments_table_exists() IS
  'Helper function to check if payments table exists before creating related triggers';

COMMENT ON TRIGGER trigger_notify_low_credit ON user_credits IS
  'Triggers notification when credit balance falls below thresholds';

COMMENT ON TRIGGER trigger_notify_credits_added ON user_credits IS
  'Triggers notification when credits are added to account';


-- ============================================
-- VERIFICATION QUERY
-- ============================================

-- Run this to verify triggers are installed:
-- SELECT trigger_name, event_manipulation, event_object_table, action_timing
-- FROM information_schema.triggers
-- WHERE event_object_table = 'user_credits'
-- AND trigger_schema = 'public'
-- ORDER BY trigger_name;

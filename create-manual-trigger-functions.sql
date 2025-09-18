-- Create manual trigger functions for testing
-- These allow us to test each trigger function individually

-- Manual handle_new_user function
CREATE OR REPLACE FUNCTION handle_new_user_manual(
  p_user_id UUID,
  p_email TEXT,
  p_role TEXT
)
RETURNS VOID AS $$
BEGIN
  -- Insert into public.users table
  INSERT INTO public.users (id, email, role, created_at, updated_at)
  VALUES (
    p_user_id,
    p_email,
    p_role::user_role,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Manual create_default_user_settings function
CREATE OR REPLACE FUNCTION create_default_user_settings_manual(
  p_user_id UUID
)
RETURNS VOID AS $$
BEGIN
  -- Insert into user_settings table
  INSERT INTO user_settings (
    user_id,
    email_notifications,
    push_notifications,
    sms_notifications,
    marketing_emails,
    profile_visibility,
    show_contact_info,
    allow_messages,
    created_at,
    updated_at
  )
  VALUES (
    p_user_id,
    true,
    true,
    false,
    false,
    'public',
    true,
    true,
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Manual initialize_user_credits function
CREATE OR REPLACE FUNCTION initialize_user_credits_manual(
  p_user_id UUID,
  p_subscription_tier TEXT
)
RETURNS VOID AS $$
DECLARE
  monthly_allowance INTEGER;
BEGIN
  -- Determine monthly allowance based on subscription tier
  monthly_allowance := CASE 
    WHEN p_subscription_tier = 'FREE' THEN 10
    WHEN p_subscription_tier = 'PREMIUM' THEN 50
    WHEN p_subscription_tier = 'PRO' THEN 100
    ELSE 10
  END;

  -- Insert into user_credits table
  INSERT INTO user_credits (
    user_id,
    subscription_tier,
    monthly_allowance,
    current_balance,
    consumed_this_month,
    last_reset_at,
    created_at,
    updated_at
  )
  VALUES (
    p_user_id,
    p_subscription_tier::subscription_tier,
    monthly_allowance,
    monthly_allowance,
    0,
    DATE_TRUNC('month', NOW()),
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Manual create_default_notification_preferences function
CREATE OR REPLACE FUNCTION create_default_notification_preferences_manual(
  p_user_id UUID
)
RETURNS VOID AS $$
BEGIN
  -- Insert into notification_preferences table
  INSERT INTO notification_preferences (
    user_id,
    email_enabled,
    push_enabled,
    in_app_enabled,
    gig_notifications,
    application_notifications,
    message_notifications,
    booking_notifications,
    system_notifications,
    marketing_notifications,
    digest_frequency,
    timezone,
    badge_count_enabled,
    sound_enabled,
    vibration_enabled,
    marketplace_notifications,
    listing_notifications,
    offer_notifications,
    order_notifications,
    payment_notifications,
    review_notifications,
    dispute_notifications
  )
  VALUES (
    p_user_id,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    false,
    'real-time',
    'UTC',
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    true
  )
  ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION handle_new_user_manual TO service_role;
GRANT EXECUTE ON FUNCTION create_default_user_settings_manual TO service_role;
GRANT EXECUTE ON FUNCTION initialize_user_credits_manual TO service_role;
GRANT EXECUTE ON FUNCTION create_default_notification_preferences_manual TO service_role;

SELECT 'Manual trigger functions created successfully!' as status;


-- =====================================================
-- ALL EMAIL TRIGGERS - CONSOLIDATED
-- Complete email automation in one file
-- Run this if individual migrations had issues
-- =====================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS http;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- =====================================================
-- INFRASTRUCTURE
-- =====================================================

-- Email logs table
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT DEFAULT 'pending',
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON email_logs(created_at);

-- Helper function to call email API
CREATE OR REPLACE FUNCTION call_email_api(
  endpoint TEXT,
  payload JSONB
) RETURNS void AS $$
DECLARE
  api_url TEXT;
BEGIN
  api_url := current_setting('app.base_url', true);
  IF api_url IS NULL THEN
    api_url := 'http://localhost:3000';
  END IF;

  PERFORM net.http_post(
    url := api_url || endpoint,
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := payload
  );
  
  INSERT INTO email_logs (endpoint, payload, created_at)
  VALUES (endpoint, payload, NOW());
  
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Email API call failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 1. WELCOME EMAIL
-- =====================================================

CREATE OR REPLACE FUNCTION trigger_welcome_email()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM call_email_api(
    '/api/emails/welcome',
    jsonb_build_object(
      'authUserId', NEW.user_id,
      'name', NEW.display_name,
      'role', (
        CASE 
          WHEN 'CONTRIBUTOR' = ANY(NEW.role_flags) AND 'TALENT' = ANY(NEW.role_flags) THEN 'BOTH'
          WHEN 'CONTRIBUTOR' = ANY(NEW.role_flags) THEN 'CONTRIBUTOR'
          ELSE 'TALENT'
        END
      )
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS welcome_email_trigger ON users_profile;
CREATE TRIGGER welcome_email_trigger
  AFTER INSERT ON users_profile
  FOR EACH ROW
  EXECUTE FUNCTION trigger_welcome_email();

-- =====================================================
-- 2. GIG PUBLISHED
-- =====================================================

CREATE OR REPLACE FUNCTION trigger_gig_published_email()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'PUBLISHED' AND (OLD IS NULL OR OLD.status != 'PUBLISHED') THEN
    PERFORM call_email_api(
      '/api/emails/gig-published',
      jsonb_build_object('gigId', NEW.id, 'ownerId', NEW.owner_user_id)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS gig_published_trigger ON gigs;
CREATE TRIGGER gig_published_trigger
  AFTER INSERT OR UPDATE ON gigs
  FOR EACH ROW
  EXECUTE FUNCTION trigger_gig_published_email();

-- =====================================================
-- 3. NEW APPLICATION
-- =====================================================

CREATE OR REPLACE FUNCTION trigger_new_application_email()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM call_email_api(
    '/api/emails/new-application',
    jsonb_build_object(
      'applicationId', NEW.id,
      'gigId', NEW.gig_id,
      'applicantId', NEW.applicant_user_id
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS new_application_trigger ON applications;
CREATE TRIGGER new_application_trigger
  AFTER INSERT ON applications
  FOR EACH ROW
  EXECUTE FUNCTION trigger_new_application_email();

-- =====================================================
-- 4. APPLICATION STATUS CHANGE
-- =====================================================

CREATE OR REPLACE FUNCTION trigger_application_status_email()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status != OLD.status THEN
    PERFORM call_email_api(
      '/api/emails/application-status',
      jsonb_build_object(
        'applicationId', NEW.id,
        'gigId', NEW.gig_id,
        'applicantId', NEW.applicant_user_id,
        'oldStatus', OLD.status,
        'newStatus', NEW.status
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS application_status_trigger ON applications;
CREATE TRIGGER application_status_trigger
  AFTER UPDATE ON applications
  FOR EACH ROW
  EXECUTE FUNCTION trigger_application_status_email();

-- =====================================================
-- 5. APPLICATION WITHDRAWN
-- =====================================================

CREATE OR REPLACE FUNCTION trigger_application_withdrawn_email()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'WITHDRAWN' AND (OLD.status IS NULL OR OLD.status != 'WITHDRAWN') THEN
    PERFORM call_email_api(
      '/api/emails/application-withdrawn',
      jsonb_build_object(
        'applicationId', NEW.id,
        'gigId', NEW.gig_id,
        'applicantId', NEW.applicant_user_id
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS application_withdrawn_trigger ON applications;
CREATE TRIGGER application_withdrawn_trigger
  AFTER UPDATE ON applications
  FOR EACH ROW
  EXECUTE FUNCTION trigger_application_withdrawn_email();

-- =====================================================
-- 6. GIG COMPLETED
-- =====================================================

CREATE OR REPLACE FUNCTION trigger_gig_completed_email()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'COMPLETED' AND (OLD IS NULL OR OLD.status != 'COMPLETED') THEN
    PERFORM call_email_api(
      '/api/emails/gig-completed',
      jsonb_build_object(
        'gigId', NEW.id,
        'ownerId', NEW.owner_user_id,
        'gigTitle', NEW.title
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS gig_completed_trigger ON gigs;
CREATE TRIGGER gig_completed_trigger
  AFTER UPDATE ON gigs
  FOR EACH ROW
  EXECUTE FUNCTION trigger_gig_completed_email();

-- =====================================================
-- 7. GIG CANCELLED
-- =====================================================

CREATE OR REPLACE FUNCTION trigger_gig_cancelled_email()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'CANCELLED' AND (OLD IS NULL OR OLD.status != 'CANCELLED') THEN
    PERFORM call_email_api(
      '/api/emails/gig-cancelled',
      jsonb_build_object(
        'gigId', NEW.id,
        'ownerId', NEW.owner_user_id,
        'gigTitle', NEW.title
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS gig_cancelled_trigger ON gigs;
CREATE TRIGGER gig_cancelled_trigger
  AFTER UPDATE ON gigs
  FOR EACH ROW
  EXECUTE FUNCTION trigger_gig_cancelled_email();

-- =====================================================
-- 8. SUBSCRIPTION CHANGE
-- =====================================================

CREATE OR REPLACE FUNCTION trigger_subscription_change_email()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.subscription_tier != OLD.subscription_tier THEN
    PERFORM call_email_api(
      '/api/emails/subscription-changed',
      jsonb_build_object(
        'authUserId', NEW.user_id,
        'name', NEW.display_name,
        'oldTier', OLD.subscription_tier,
        'newTier', NEW.subscription_tier
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS subscription_change_trigger ON users_profile;
CREATE TRIGGER subscription_change_trigger
  AFTER UPDATE ON users_profile
  FOR EACH ROW
  EXECUTE FUNCTION trigger_subscription_change_email();

-- =====================================================
-- 9. PRESET SOLD (already exists but ensuring it's correct)
-- =====================================================

CREATE OR REPLACE FUNCTION trigger_preset_sold_email()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_status = 'completed' AND (OLD IS NULL OR OLD.payment_status != 'completed') THEN
    PERFORM call_email_api(
      '/api/emails/marketplace/preset-sold',
      jsonb_build_object(
        'purchaseId', NEW.id,
        'presetId', NEW.preset_id,
        'buyerUserId', NEW.buyer_user_id,
        'sellerUserId', NEW.seller_user_id,
        'purchasePrice', NEW.purchase_price,
        'sellerPayout', NEW.seller_payout
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS preset_sold_email_trigger ON preset_purchases;
CREATE TRIGGER preset_sold_email_trigger
  AFTER INSERT OR UPDATE ON preset_purchases
  FOR EACH ROW
  EXECUTE FUNCTION trigger_preset_sold_email();

-- =====================================================
-- 10. MESSAGE RECEIVED (already exists but ensuring it's correct)
-- =====================================================

CREATE OR REPLACE FUNCTION trigger_message_received_email()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM call_email_api(
    '/api/emails/messaging/new-message',
    jsonb_build_object(
      'messageId', NEW.id,
      'gigId', NEW.gig_id,
      'fromUserId', NEW.from_user_id,
      'toUserId', NEW.to_user_id,
      'messagePreview', substring(NEW.body, 1, 100)
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS message_received_email_trigger ON messages;
CREATE TRIGGER message_received_email_trigger
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION trigger_message_received_email();

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Count triggers
SELECT 
  '✅ Total email triggers: ' || COUNT(*)::text as result
FROM information_schema.triggers 
WHERE trigger_name LIKE '%email%';


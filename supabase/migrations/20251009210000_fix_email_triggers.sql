-- =====================================================
-- FIX EMAIL TRIGGERS - Clean Installation
-- Drops and recreates all triggers properly
-- =====================================================

-- Drop all existing email triggers first (clean slate)
DROP TRIGGER IF EXISTS welcome_email_trigger ON users_profile CASCADE;
DROP TRIGGER IF EXISTS gig_published_trigger ON gigs CASCADE;
DROP TRIGGER IF EXISTS new_application_trigger ON applications CASCADE;
DROP TRIGGER IF EXISTS application_status_trigger ON applications CASCADE;
DROP TRIGGER IF EXISTS application_withdrawn_trigger ON applications CASCADE;
DROP TRIGGER IF EXISTS gig_completed_trigger ON gigs CASCADE;
DROP TRIGGER IF EXISTS gig_cancelled_trigger ON gigs CASCADE;
DROP TRIGGER IF EXISTS subscription_change_trigger ON users_profile CASCADE;
DROP TRIGGER IF EXISTS preset_sold_email_trigger ON preset_purchases CASCADE;
DROP TRIGGER IF EXISTS message_received_email_trigger ON messages CASCADE;
DROP TRIGGER IF EXISTS application_milestone_trigger ON applications CASCADE;

-- Drop and recreate functions (ensure latest version)

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
  IF NEW.status = 'PUBLISHED' AND (OLD IS NULL OR OLD.status IS NULL OR OLD.status != 'PUBLISHED') THEN
    PERFORM call_email_api(
      '/api/emails/gig-published',
      jsonb_build_object('gigId', NEW.id, 'ownerId', NEW.owner_user_id)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

CREATE TRIGGER application_status_trigger
  AFTER UPDATE ON applications
  FOR EACH ROW
  EXECUTE FUNCTION trigger_application_status_email();

-- =====================================================
-- 5. GIG COMPLETED
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

CREATE TRIGGER gig_completed_trigger
  AFTER UPDATE ON gigs
  FOR EACH ROW
  EXECUTE FUNCTION trigger_gig_completed_email();

-- =====================================================
-- 6. GIG CANCELLED  
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

CREATE TRIGGER gig_cancelled_trigger
  AFTER UPDATE ON gigs
  FOR EACH ROW
  EXECUTE FUNCTION trigger_gig_cancelled_email();

-- =====================================================
-- 7. SUBSCRIPTION CHANGE
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

CREATE TRIGGER subscription_change_trigger
  AFTER UPDATE ON users_profile
  FOR EACH ROW
  EXECUTE FUNCTION trigger_subscription_change_email();

-- =====================================================
-- 8. PRESET SOLD
-- =====================================================

CREATE OR REPLACE FUNCTION trigger_preset_sold_email()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_status = 'completed' AND (OLD IS NULL OR OLD.payment_status IS NULL OR OLD.payment_status != 'completed') THEN
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

CREATE TRIGGER preset_sold_email_trigger
  AFTER INSERT OR UPDATE ON preset_purchases
  FOR EACH ROW
  EXECUTE FUNCTION trigger_preset_sold_email();

-- =====================================================
-- 9. MESSAGE RECEIVED
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

CREATE TRIGGER message_received_email_trigger
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION trigger_message_received_email();

-- =====================================================
-- 10. APPLICATION MILESTONE
-- =====================================================

CREATE OR REPLACE FUNCTION trigger_application_milestone()
RETURNS TRIGGER AS $$
DECLARE
  gig_record RECORD;
  application_count INTEGER;
  milestone_percentage INTEGER;
BEGIN
  SELECT * INTO gig_record FROM gigs WHERE id = NEW.gig_id;
  SELECT COUNT(*) INTO application_count FROM applications WHERE gig_id = NEW.gig_id;
  
  milestone_percentage := (application_count * 100) / gig_record.max_applicants;
  
  IF milestone_percentage >= 50 AND milestone_percentage < 55 THEN
    PERFORM call_email_api(
      '/api/emails/application-milestone',
      jsonb_build_object(
        'gigId', NEW.gig_id,
        'ownerId', gig_record.owner_user_id,
        'applicationCount', application_count,
        'maxApplicants', gig_record.max_applicants,
        'milestone', 50
      )
    );
  ELSIF milestone_percentage >= 80 AND milestone_percentage < 85 THEN
    PERFORM call_email_api(
      '/api/emails/application-milestone',
      jsonb_build_object(
        'gigId', NEW.gig_id,
        'ownerId', gig_record.owner_user_id,
        'applicationCount', application_count,
        'maxApplicants', gig_record.max_applicants,
        'milestone', 80
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER application_milestone_trigger
  AFTER INSERT ON applications
  FOR EACH ROW
  EXECUTE FUNCTION trigger_application_milestone();

-- =====================================================
-- VERIFICATION
-- =====================================================

DO $$
DECLARE
  trigger_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO trigger_count
  FROM information_schema.triggers 
  WHERE trigger_name LIKE '%email%';
  
  RAISE NOTICE '✅ Total email triggers installed: %', trigger_count;
END $$;


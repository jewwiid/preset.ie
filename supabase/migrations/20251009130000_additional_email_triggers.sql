-- =====================================================
-- Additional Email Triggers - Missing Events
-- Based on notification_types analysis
-- =====================================================

-- =====================================================
-- 1. APPLICATION WITHDRAWN
-- =====================================================

CREATE OR REPLACE FUNCTION trigger_application_withdrawn_email()
RETURNS TRIGGER AS $$
DECLARE
  gig_record RECORD;
BEGIN
  -- Only trigger when status changes to WITHDRAWN
  IF NEW.status = 'WITHDRAWN' AND (OLD.status IS NULL OR OLD.status != 'WITHDRAWN') THEN
    -- Get gig and owner info
    SELECT g.*, up.user_id as owner_auth_id, up.display_name as owner_name
    INTO gig_record
    FROM gigs g
    JOIN users_profile up ON g.owner_user_id = up.id
    WHERE g.id = NEW.gig_id;
    
    -- Notify gig owner
    PERFORM call_email_api(
      '/api/emails/application-withdrawn',
      jsonb_build_object(
        'gigId', NEW.gig_id,
        'gigTitle', gig_record.title,
        'ownerId', gig_record.owner_auth_id,
        'applicantId', NEW.applicant_user_id,
        'withdrawnAt', NEW.updated_at
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
-- 2. APPLICATIONS CLOSED (Gig Status)
-- =====================================================

CREATE OR REPLACE FUNCTION trigger_applications_closed_email()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'APPLICATIONS_CLOSED' AND OLD.status = 'PUBLISHED' THEN
    PERFORM call_email_api(
      '/api/emails/applications-closed',
      jsonb_build_object(
        'gigId', NEW.id,
        'ownerId', NEW.owner_user_id,
        'gigTitle', NEW.title,
        'applicationCount', (SELECT COUNT(*) FROM applications WHERE gig_id = NEW.id)
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS applications_closed_trigger ON gigs;
CREATE TRIGGER applications_closed_trigger
  AFTER UPDATE ON gigs
  FOR EACH ROW
  EXECUTE FUNCTION trigger_applications_closed_email();

-- =====================================================
-- 3. GIG COMPLETED
-- =====================================================

CREATE OR REPLACE FUNCTION trigger_gig_completed_email()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'COMPLETED' AND OLD.status != 'COMPLETED' THEN
    -- Email to gig owner
    PERFORM call_email_api(
      '/api/emails/gig-completed',
      jsonb_build_object(
        'gigId', NEW.id,
        'ownerId', NEW.owner_user_id,
        'gigTitle', NEW.title,
        'completedAt', NEW.updated_at
      )
    );
    
    -- Also email to booked talent (find accepted application)
    PERFORM call_email_api(
      '/api/emails/gig-completed-talent',
      jsonb_build_object(
        'gigId', NEW.id,
        'gigTitle', NEW.title,
        'applicationIds', (
          SELECT json_agg(id) 
          FROM applications 
          WHERE gig_id = NEW.id AND status = 'ACCEPTED'
        )
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
-- 4. GIG CANCELLED
-- =====================================================

CREATE OR REPLACE FUNCTION trigger_gig_cancelled_email()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'CANCELLED' AND OLD.status != 'CANCELLED' THEN
    -- Email to all applicants
    PERFORM call_email_api(
      '/api/emails/gig-cancelled',
      jsonb_build_object(
        'gigId', NEW.id,
        'ownerId', NEW.owner_user_id,
        'gigTitle', NEW.title,
        'applicationIds', (
          SELECT json_agg(id) 
          FROM applications 
          WHERE gig_id = NEW.id AND status IN ('PENDING', 'SHORTLISTED')
        )
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
-- 5. SHOWCASE SUBMITTED (if you have showcases table)
-- =====================================================

-- CREATE OR REPLACE FUNCTION trigger_showcase_submitted_email()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   IF NEW.status = 'PENDING_APPROVAL' AND (OLD.status IS NULL OR OLD.status = 'DRAFT') THEN
--     PERFORM call_email_api(
--       '/api/emails/showcase-submitted',
--       jsonb_build_object(
--         'showcaseId', NEW.id,
--         'submitterId', NEW.submitter_id,
--         'collaboratorId', NEW.collaborator_id
--       )
--     );
--   END IF;
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. SHOWCASE APPROVED
-- =====================================================

-- CREATE OR REPLACE FUNCTION trigger_showcase_approved_email()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   IF NEW.visibility = 'PUBLIC' AND OLD.visibility != 'PUBLIC' THEN
--     PERFORM call_email_api(
--       '/api/emails/showcase-approved',
--       jsonb_build_object(
--         'showcaseId', NEW.id,
--         'contributorId', NEW.contributor_id,
--         'talentId', NEW.talent_id
--       )
--     );
--   END IF;
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. SUBSCRIPTION EXPIRING (Scheduled Job)
-- =====================================================

CREATE OR REPLACE FUNCTION send_subscription_expiring_reminders()
RETURNS void AS $$
DECLARE
  user_record RECORD;
BEGIN
  -- Find subscriptions expiring in 7 days
  FOR user_record IN
    SELECT 
      user_id,
      display_name,
      subscription_tier,
      subscription_expires_at
    FROM users_profile
    WHERE subscription_status = 'ACTIVE'
    AND subscription_expires_at IS NOT NULL
    AND subscription_expires_at >= NOW() + INTERVAL '6 days'
    AND subscription_expires_at <= NOW() + INTERVAL '8 days'
  LOOP
    PERFORM call_email_api(
      '/api/emails/subscription-expiring',
      jsonb_build_object(
        'authUserId', user_record.user_id,
        'name', user_record.display_name,
        'tier', user_record.subscription_tier,
        'expiresAt', user_record.subscription_expires_at
      )
    );
  END LOOP;
  
  -- Also find subscriptions expiring in 1 day (final reminder)
  FOR user_record IN
    SELECT 
      user_id,
      display_name,
      subscription_tier,
      subscription_expires_at
    FROM users_profile
    WHERE subscription_status = 'ACTIVE'
    AND subscription_expires_at IS NOT NULL
    AND subscription_expires_at >= NOW() + INTERVAL '23 hours'
    AND subscription_expires_at <= NOW() + INTERVAL '25 hours'
  LOOP
    PERFORM call_email_api(
      '/api/emails/subscription-expiring-urgent',
      jsonb_build_object(
        'authUserId', user_record.user_id,
        'name', user_record.display_name,
        'tier', user_record.subscription_tier,
        'expiresAt', user_record.subscription_expires_at,
        'urgent', true
      )
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule: Daily at 9 AM
-- SELECT cron.schedule('subscription-expiring', '0 9 * * *', 'SELECT send_subscription_expiring_reminders()');

-- =====================================================
-- 8. SUBSCRIPTION RENEWED/UPGRADED
-- =====================================================

CREATE OR REPLACE FUNCTION trigger_subscription_change_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Subscription tier upgraded
  IF NEW.subscription_tier != OLD.subscription_tier THEN
    PERFORM call_email_api(
      '/api/emails/subscription-changed',
      jsonb_build_object(
        'authUserId', NEW.user_id,
        'name', NEW.display_name,
        'oldTier', OLD.subscription_tier,
        'newTier', NEW.subscription_tier,
        'changeType', CASE 
          WHEN NEW.subscription_tier > OLD.subscription_tier THEN 'upgrade'
          ELSE 'downgrade'
        END
      )
    );
  END IF;
  
  -- Subscription renewed (expiry date extended)
  IF NEW.subscription_expires_at > OLD.subscription_expires_at THEN
    PERFORM call_email_api(
      '/api/emails/subscription-renewed',
      jsonb_build_object(
        'authUserId', NEW.user_id,
        'name', NEW.display_name,
        'tier', NEW.subscription_tier,
        'expiresAt', NEW.subscription_expires_at
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
-- 9. MESSAGE RECEIVED (if you have messages table)
-- =====================================================

-- CREATE OR REPLACE FUNCTION trigger_message_received_email()
-- RETURNS TRIGGER AS $$
-- DECLARE
--   recipient_record RECORD;
-- BEGIN
--   -- Get recipient info
--   SELECT user_id, display_name INTO recipient_record
--   FROM users_profile
--   WHERE id = NEW.recipient_id;
--   
--   PERFORM call_email_api(
--     '/api/emails/message-received',
--     jsonb_build_object(
--       'messageId', NEW.id,
--       'senderId', NEW.sender_id,
--       'recipientId', recipient_record.user_id,
--       'preview', LEFT(NEW.content, 100)
--     )
--   );
--   
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER;
--
-- DROP TRIGGER IF EXISTS message_received_trigger ON messages;
-- CREATE TRIGGER message_received_trigger
--   AFTER INSERT ON messages
--   FOR EACH ROW
--   EXECUTE FUNCTION trigger_message_received_email();

-- =====================================================
-- 10. REVIEW RECEIVED (if you have reviews table)
-- =====================================================

-- CREATE OR REPLACE FUNCTION trigger_review_received_email()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   PERFORM call_email_api(
--     '/api/emails/review-received',
--     jsonb_build_object(
--       'reviewId', NEW.id,
--       'reviewerId', NEW.reviewer_id,
--       'revieweeId', NEW.reviewee_id,
--       'rating', NEW.rating,
--       'gigId', NEW.gig_id
--     )
--   );
--   
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 11. GIG MATCH NOTIFICATIONS (Scheduled Job)
-- =====================================================

CREATE OR REPLACE FUNCTION send_gig_match_notifications()
RETURNS void AS $$
DECLARE
  talent_record RECORD;
  matched_gigs JSONB;
BEGIN
  -- Find talent users
  FOR talent_record IN
    SELECT 
      user_id,
      id as profile_id,
      display_name,
      city,
      style_tags
    FROM users_profile
    WHERE 'TALENT' = ANY(role_flags)
  LOOP
    -- Find gigs matching talent's location and style tags (simplified)
    -- This is a basic version - you'd want more sophisticated matching
    SELECT json_agg(json_build_object('id', id, 'title', title, 'location', location_text))
    INTO matched_gigs
    FROM gigs
    WHERE status = 'PUBLISHED'
    AND created_at >= NOW() - INTERVAL '24 hours' -- Only new gigs
    AND (
      city IS NULL OR 
      city = talent_record.city OR
      style_tags && talent_record.style_tags -- Array overlap
    )
    LIMIT 5;
    
    -- Send email if there are matches
    IF matched_gigs IS NOT NULL AND json_array_length(matched_gigs) > 0 THEN
      PERFORM call_email_api(
        '/api/emails/gig-matches',
        jsonb_build_object(
          'authUserId', talent_record.user_id,
          'name', talent_record.display_name,
          'matches', matched_gigs
        )
      );
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule: Daily at 10 AM
-- SELECT cron.schedule('gig-matches', '0 10 * * *', 'SELECT send_gig_match_notifications()');

-- =====================================================
-- 12. WEEKLY DIGEST (Scheduled Job)
-- =====================================================

CREATE OR REPLACE FUNCTION send_weekly_digest()
RETURNS void AS $$
DECLARE
  user_record RECORD;
  user_stats JSONB;
BEGIN
  FOR user_record IN
    SELECT user_id, id, display_name, role_flags
    FROM users_profile
  LOOP
    -- Gather user stats for the week
    SELECT jsonb_build_object(
      'newGigs', (
        SELECT COUNT(*) FROM gigs 
        WHERE owner_user_id = user_record.id 
        AND created_at >= NOW() - INTERVAL '7 days'
      ),
      'newApplications', (
        SELECT COUNT(*) FROM applications a
        JOIN gigs g ON a.gig_id = g.id
        WHERE g.owner_user_id = user_record.id 
        AND a.applied_at >= NOW() - INTERVAL '7 days'
      ),
      'profileViews', 0, -- Placeholder
      'newFollowers', 0  -- Placeholder
    ) INTO user_stats;
    
    -- Only send if there's activity
    IF (user_stats->>'newGigs')::int > 0 OR (user_stats->>'newApplications')::int > 0 THEN
      PERFORM call_email_api(
        '/api/emails/weekly-digest',
        jsonb_build_object(
          'authUserId', user_record.user_id,
          'name', user_record.display_name,
          'stats', user_stats
        )
      );
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule: Monday mornings at 9 AM
-- SELECT cron.schedule('weekly-digest', '0 9 * * 1', 'SELECT send_weekly_digest()');

-- =====================================================
-- Comments
-- =====================================================

COMMENT ON FUNCTION trigger_application_withdrawn_email IS 'Notifies gig owner when applicant withdraws';
COMMENT ON FUNCTION trigger_applications_closed_email IS 'Notifies owner when application period ends';
COMMENT ON FUNCTION trigger_gig_completed_email IS 'Notifies both parties when gig is completed';
COMMENT ON FUNCTION trigger_gig_cancelled_email IS 'Notifies applicants when gig is cancelled';
COMMENT ON FUNCTION send_subscription_expiring_reminders IS 'Sends reminders 7 days and 1 day before expiry';
COMMENT ON FUNCTION trigger_subscription_change_email IS 'Notifies user of subscription changes';
COMMENT ON FUNCTION send_gig_match_notifications IS 'Daily digest of matching gigs for talent';
COMMENT ON FUNCTION send_weekly_digest IS 'Weekly activity summary';


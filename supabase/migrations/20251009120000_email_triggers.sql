-- =====================================================
-- Email Automation Triggers
-- Automatically send emails on database events
-- =====================================================

-- Enable HTTP extension for making API calls
CREATE EXTENSION IF NOT EXISTS http;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- =====================================================
-- Helper Function: Call Email API
-- =====================================================

CREATE OR REPLACE FUNCTION call_email_api(
  endpoint TEXT,
  payload JSONB
) RETURNS void AS $$
DECLARE
  api_url TEXT;
  response INTEGER;
BEGIN
  -- Get base URL from environment or use default
  api_url := current_setting('app.base_url', true);
  IF api_url IS NULL THEN
    api_url := 'http://localhost:3000';
  END IF;

  -- Make async HTTP request to email API
  PERFORM net.http_post(
    url := api_url || endpoint,
    headers := jsonb_build_object(
      'Content-Type', 'application/json'
    ),
    body := payload
  );
  
  -- Log the email request
  INSERT INTO email_logs (endpoint, payload, created_at)
  VALUES (endpoint, payload, NOW());
  
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail the transaction
  RAISE WARNING 'Email API call failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Email Logs Table
-- Track all email trigger attempts
-- =====================================================

CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  endpoint TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT DEFAULT 'pending',
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_email_logs_created_at ON email_logs(created_at);

-- =====================================================
-- 1. WELCOME EMAIL - On User Profile Created
-- =====================================================

CREATE OR REPLACE FUNCTION trigger_welcome_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Get user email from auth
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
-- 2. GIG PUBLISHED EMAIL - On Gig Status Change
-- =====================================================

CREATE OR REPLACE FUNCTION trigger_gig_published_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Only send when status changes to PUBLISHED
  IF NEW.status = 'PUBLISHED' AND (OLD.status IS NULL OR OLD.status != 'PUBLISHED') THEN
    PERFORM call_email_api(
      '/api/emails/gig-published',
      jsonb_build_object(
        'gigId', NEW.id,
        'ownerId', NEW.owner_user_id
      )
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
-- 3. NEW APPLICATION EMAIL - On Application Created
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
-- 4. APPLICATION STATUS CHANGE EMAILS
-- =====================================================

CREATE OR REPLACE FUNCTION trigger_application_status_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger if status actually changed
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
-- 5. SHOOT REMINDER - Scheduled Job
-- =====================================================

CREATE OR REPLACE FUNCTION send_shoot_reminders()
RETURNS void AS $$
DECLARE
  gig_record RECORD;
BEGIN
  -- Find gigs starting in 24 hours
  FOR gig_record IN
    SELECT 
      g.id,
      g.title,
      g.owner_user_id,
      g.start_time,
      g.location_text,
      g.comp_type
    FROM gigs g
    WHERE g.status = 'BOOKED'
    AND g.start_time >= NOW() + INTERVAL '23 hours'
    AND g.start_time <= NOW() + INTERVAL '25 hours'
  LOOP
    PERFORM call_email_api(
      '/api/emails/shoot-reminder',
      jsonb_build_object(
        'gigId', gig_record.id,
        'ownerId', gig_record.owner_user_id
      )
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule this to run hourly via pg_cron
-- SELECT cron.schedule('shoot-reminders', '0 * * * *', 'SELECT send_shoot_reminders()');

-- =====================================================
-- 6. DEADLINE APPROACHING - Scheduled Job
-- =====================================================

CREATE OR REPLACE FUNCTION send_deadline_reminders()
RETURNS void AS $$
DECLARE
  gig_record RECORD;
BEGIN
  -- Find gigs with deadlines in 24 hours
  FOR gig_record IN
    SELECT 
      g.id,
      g.title,
      g.owner_user_id,
      g.application_deadline,
      (SELECT COUNT(*) FROM applications WHERE gig_id = g.id) as application_count
    FROM gigs g
    WHERE g.status = 'PUBLISHED'
    AND g.application_deadline >= NOW() + INTERVAL '23 hours'
    AND g.application_deadline <= NOW() + INTERVAL '25 hours'
  LOOP
    PERFORM call_email_api(
      '/api/emails/deadline-approaching',
      jsonb_build_object(
        'gigId', gig_record.id,
        'ownerId', gig_record.owner_user_id,
        'applicationCount', gig_record.application_count
      )
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. PROFILE COMPLETION REMINDER - Scheduled Job
-- =====================================================

CREATE OR REPLACE FUNCTION send_profile_completion_reminders()
RETURNS void AS $$
DECLARE
  user_record RECORD;
  completion_percentage INTEGER;
BEGIN
  -- Find incomplete profiles created 3+ days ago
  FOR user_record IN
    SELECT 
      user_id,
      display_name,
      avatar_url,
      bio,
      city,
      created_at
    FROM users_profile
    WHERE created_at <= NOW() - INTERVAL '3 days'
    AND created_at >= NOW() - INTERVAL '7 days'
  LOOP
    -- Calculate completion (simple version)
    completion_percentage := 0;
    IF user_record.avatar_url IS NOT NULL THEN completion_percentage := completion_percentage + 25; END IF;
    IF user_record.bio IS NOT NULL THEN completion_percentage := completion_percentage + 25; END IF;
    IF user_record.city IS NOT NULL THEN completion_percentage := completion_percentage + 25; END IF;
    completion_percentage := completion_percentage + 25; -- Display name always exists
    
    -- Send reminder if less than 75% complete
    IF completion_percentage < 75 THEN
      PERFORM call_email_api(
        '/api/emails/profile-completion',
        jsonb_build_object(
          'authUserId', user_record.user_id,
          'name', user_record.display_name,
          'completionPercentage', completion_percentage
        )
      );
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 8. APPLICATION MILESTONE - On Application Count
-- =====================================================

CREATE OR REPLACE FUNCTION trigger_application_milestone()
RETURNS TRIGGER AS $$
DECLARE
  gig_record RECORD;
  application_count INTEGER;
  milestone_percentage INTEGER;
BEGIN
  -- Get gig details
  SELECT * INTO gig_record FROM gigs WHERE id = NEW.gig_id;
  
  -- Count total applications
  SELECT COUNT(*) INTO application_count FROM applications WHERE gig_id = NEW.gig_id;
  
  -- Calculate percentage
  milestone_percentage := (application_count * 100) / gig_record.max_applicants;
  
  -- Send email at 50% and 80% milestones
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

DROP TRIGGER IF EXISTS application_milestone_trigger ON applications;
CREATE TRIGGER application_milestone_trigger
  AFTER INSERT ON applications
  FOR EACH ROW
  EXECUTE FUNCTION trigger_application_milestone();

-- =====================================================
-- 9. CREDITS LOW WARNING
-- =====================================================

CREATE OR REPLACE FUNCTION trigger_credits_low_warning()
RETURNS TRIGGER AS $$
BEGIN
  -- Warn when credits drop below 5
  IF NEW.credits < 5 AND (OLD.credits IS NULL OR OLD.credits >= 5) THEN
    PERFORM call_email_api(
      '/api/emails/credits-low',
      jsonb_build_object(
        'authUserId', NEW.user_id,
        'remainingCredits', NEW.credits
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- This assumes you have a credits column on users_profile
-- DROP TRIGGER IF EXISTS credits_low_trigger ON users_profile;
-- CREATE TRIGGER credits_low_trigger
--   AFTER UPDATE ON users_profile
--   FOR EACH ROW
--   EXECUTE FUNCTION trigger_credits_low_warning();

-- =====================================================
-- RLS Policies for email_logs
-- =====================================================

ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Admin users can see all logs
CREATE POLICY email_logs_admin_access ON email_logs
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE user_id = auth.uid()
      AND 'ADMIN' = ANY(role_flags)
    )
  );

-- =====================================================
-- Grant Permissions
-- =====================================================

GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON email_logs TO postgres, service_role;
GRANT SELECT ON email_logs TO authenticated;

-- =====================================================
-- Comments
-- =====================================================

COMMENT ON TABLE email_logs IS 'Logs all email trigger attempts for debugging and monitoring';
COMMENT ON FUNCTION call_email_api IS 'Makes async HTTP requests to email API endpoints';
COMMENT ON FUNCTION trigger_welcome_email IS 'Sends welcome email when user profile is created';
COMMENT ON FUNCTION trigger_gig_published_email IS 'Sends notification when gig is published';
COMMENT ON FUNCTION trigger_new_application_email IS 'Notifies contributor of new application';
COMMENT ON FUNCTION trigger_application_status_email IS 'Sends status update emails to applicants';
COMMENT ON FUNCTION send_shoot_reminders IS 'Scheduled job to send 24h shoot reminders';
COMMENT ON FUNCTION send_deadline_reminders IS 'Scheduled job to send deadline approaching emails';
COMMENT ON FUNCTION send_profile_completion_reminders IS 'Scheduled job to remind users to complete profile';


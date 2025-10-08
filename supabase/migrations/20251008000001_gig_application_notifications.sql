-- Gig Application Notifications
-- Triggers notifications when:
-- 1. A talent applies to a gig (notify gig owner)
-- 2. Application status changes (notify applicant)

-- ============================================
-- 1. APPLICATION RECEIVED NOTIFICATION
-- ============================================

CREATE OR REPLACE FUNCTION notify_gig_application_received()
RETURNS TRIGGER AS $$
DECLARE
  v_gig RECORD;
  v_applicant RECORD;
  v_owner_prefs RECORD;
BEGIN
  -- Get gig details and owner info
  SELECT
    g.id,
    g.title,
    g.location_text,
    g.start_time,
    g.purpose,
    up.user_id as owner_user_id,
    up.display_name as owner_name
  INTO v_gig
  FROM gigs g
  JOIN users_profile up ON g.owner_user_id = up.user_id
  WHERE g.id = NEW.gig_id;

  -- Get applicant details
  SELECT
    up.user_id,
    up.display_name,
    up.avatar_url,
    up.handle
  INTO v_applicant
  FROM users_profile up
  WHERE up.id = NEW.applicant_user_id;

  -- Check owner's notification preferences
  SELECT
    COALESCE(application_notifications, true) as application_notifications,
    COALESCE(in_app_enabled, true) as in_app_enabled
  INTO v_owner_prefs
  FROM notification_preferences
  WHERE user_id = v_gig.owner_user_id;

  -- Only send if preferences allow (default to true if no preferences set)
  IF COALESCE(v_owner_prefs.application_notifications, true)
     AND COALESCE(v_owner_prefs.in_app_enabled, true) THEN

    INSERT INTO notifications (
      recipient_id,
      user_id,
      type,
      category,
      title,
      message,
      avatar_url,
      action_url,
      data
    ) VALUES (
      v_gig.owner_user_id,
      v_applicant.user_id,
      'new_application',
      'gig',
      'New application for "' || v_gig.title || '"',
      v_applicant.display_name || ' applied for your ' || COALESCE(v_gig.purpose, 'gig') || ' gig',
      v_applicant.avatar_url,
      '/gigs/' || v_gig.id || '/applications',
      jsonb_build_object(
        'gig_id', v_gig.id,
        'gig_title', v_gig.title,
        'applicant_id', NEW.applicant_user_id,
        'applicant_name', v_applicant.display_name,
        'applicant_handle', v_applicant.handle,
        'application_id', NEW.id,
        'applied_at', NEW.applied_at,
        'location', v_gig.location_text
      )
    );

    -- Log for debugging
    RAISE NOTICE 'Application notification sent: gig_id=%, applicant=%',
      v_gig.id, v_applicant.display_name;
  ELSE
    RAISE NOTICE 'Application notification skipped (preferences disabled): user=%',
      v_gig.owner_user_id;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't block the application from being created
    RAISE WARNING 'Error sending application notification: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new applications
DROP TRIGGER IF EXISTS trigger_notify_gig_application_received ON applications;
CREATE TRIGGER trigger_notify_gig_application_received
  AFTER INSERT ON applications
  FOR EACH ROW
  EXECUTE FUNCTION notify_gig_application_received();


-- ============================================
-- 2. APPLICATION STATUS CHANGED NOTIFICATION
-- ============================================

CREATE OR REPLACE FUNCTION notify_application_status_changed()
RETURNS TRIGGER AS $$
DECLARE
  v_gig RECORD;
  v_applicant RECORD;
  v_applicant_prefs RECORD;
  v_status_message TEXT;
  v_notification_title TEXT;
  v_notification_type TEXT;
BEGIN
  -- Only trigger on actual status change
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Get gig details
  SELECT
    id,
    title,
    purpose,
    location_text,
    start_time
  INTO v_gig
  FROM gigs
  WHERE id = NEW.gig_id;

  -- Get applicant details and preferences
  SELECT
    up.user_id,
    up.display_name,
    up.handle,
    COALESCE(np.application_notifications, true) as application_notifications,
    COALESCE(np.in_app_enabled, true) as in_app_enabled
  INTO v_applicant
  FROM users_profile up
  LEFT JOIN notification_preferences np ON up.user_id = np.user_id
  WHERE up.id = NEW.applicant_user_id;

  -- Only send if preferences allow
  IF COALESCE(v_applicant.application_notifications, true)
     AND COALESCE(v_applicant.in_app_enabled, true) THEN

    -- Customize message based on status
    CASE NEW.status
      WHEN 'ACCEPTED' THEN
        v_notification_type := 'application_accepted';
        v_notification_title := '🎉 Application accepted!';
        v_status_message := 'Your application for "' || v_gig.title || '" was accepted! Check your messages for next steps.';

      WHEN 'REJECTED' THEN
        v_notification_type := 'application_rejected';
        v_notification_title := 'Application update';
        v_status_message := 'Your application for "' || v_gig.title || '" was not selected this time. Keep applying!';

      WHEN 'SHORTLISTED' THEN
        v_notification_type := 'application_shortlisted';
        v_notification_title := '⭐ You''re shortlisted!';
        v_status_message := 'You''re on the shortlist for "' || v_gig.title || '"! The client will contact you soon.';

      WHEN 'WITHDRAWN' THEN
        -- Don't notify on user-initiated withdrawal
        RETURN NEW;

      ELSE
        -- Don't notify for other status changes
        RETURN NEW;
    END CASE;

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
      v_applicant.user_id,
      v_applicant.user_id, -- Self-notification
      v_notification_type,
      'gig',
      v_notification_title,
      v_status_message,
      '/gigs/' || v_gig.id,
      jsonb_build_object(
        'gig_id', v_gig.id,
        'gig_title', v_gig.title,
        'application_id', NEW.id,
        'new_status', NEW.status,
        'old_status', OLD.status,
        'updated_at', NEW.updated_at,
        'location', v_gig.location_text,
        'start_time', v_gig.start_time
      )
    );

    -- Log for debugging
    RAISE NOTICE 'Status change notification sent: application_id=%, status=% -> %',
      NEW.id, OLD.status, NEW.status;
  ELSE
    RAISE NOTICE 'Status change notification skipped (preferences disabled): user=%',
      v_applicant.user_id;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't block the status update
    RAISE WARNING 'Error sending status change notification: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for status changes
DROP TRIGGER IF EXISTS trigger_notify_application_status_changed ON applications;
CREATE TRIGGER trigger_notify_application_status_changed
  AFTER UPDATE ON applications
  FOR EACH ROW
  EXECUTE FUNCTION notify_application_status_changed();


-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Ensure we have indexes on frequently queried columns
CREATE INDEX IF NOT EXISTS idx_applications_gig_id ON applications(gig_id);
CREATE INDEX IF NOT EXISTS idx_applications_applicant_user_id ON applications(applicant_user_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_applied_at ON applications(applied_at DESC);


-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON FUNCTION notify_gig_application_received() IS
  'Sends notification to gig owner when a new application is received. Respects notification_preferences.application_notifications.';

COMMENT ON FUNCTION notify_application_status_changed() IS
  'Sends notification to applicant when their application status changes (ACCEPTED, REJECTED, SHORTLISTED). Respects notification_preferences.application_notifications.';

COMMENT ON TRIGGER trigger_notify_gig_application_received ON applications IS
  'Triggers notification when new gig application is created';

COMMENT ON TRIGGER trigger_notify_application_status_changed ON applications IS
  'Triggers notification when application status is updated';


-- ============================================
-- VERIFICATION QUERY
-- ============================================

-- Run this to verify triggers are installed:
-- SELECT trigger_name, event_manipulation, event_object_table
-- FROM information_schema.triggers
-- WHERE event_object_table = 'applications'
-- AND trigger_schema = 'public';

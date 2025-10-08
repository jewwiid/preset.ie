-- System Notifications
-- Triggers notifications for:
-- 1. Verification status changes (ID verification approved/rejected)
-- 2. Account warnings/moderation actions (already handled via API)
-- 3. Platform announcements (manual creation via admin panel)

-- ============================================
-- 1. VERIFICATION STATUS UPDATE NOTIFICATION
-- ============================================

CREATE OR REPLACE FUNCTION notify_verification_status()
RETURNS TRIGGER AS $$
DECLARE
  v_status_message TEXT;
  v_notification_title TEXT;
  v_notification_type TEXT;
BEGIN
  -- Only trigger when verified_id status actually changes
  IF OLD.verified_id = NEW.verified_id THEN
    RETURN NEW;
  END IF;

  -- Check user notification preferences (default to true)
  IF EXISTS (
    SELECT 1
    FROM notification_preferences
    WHERE user_id = NEW.user_id
    AND (system_notifications = false OR in_app_enabled = false)
  ) THEN
    RAISE NOTICE 'Verification notification skipped (preferences disabled): user=%', NEW.user_id;
    RETURN NEW;
  END IF;

  -- Customize notification based on verification status
  IF NEW.verified_id = true THEN
    v_notification_type := 'verification_approved';
    v_notification_title := '✅ Verification approved!';
    v_status_message := 'Your ID verification has been approved. You now have a verified badge on your profile!';
  ELSIF NEW.verified_id = false AND OLD.verified_id = true THEN
    -- Verification was revoked
    v_notification_type := 'verification_revoked';
    v_notification_title := 'Verification status updated';
    v_status_message := 'Your verification status has been updated. Please contact support if you have questions.';
  ELSE
    -- Verification rejected (was null or pending, now explicitly false)
    v_notification_type := 'verification_rejected';
    v_notification_title := 'Verification update';
    v_status_message := 'Your verification request could not be completed. Please ensure your ID is clear and valid, then try again.';
  END IF;

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
    v_notification_type,
    'system',
    v_notification_title,
    v_status_message,
    '/profile/settings',
    jsonb_build_object(
      'verified', NEW.verified_id,
      'previous_status', OLD.verified_id,
      'updated_at', NEW.updated_at
    )
  );

  RAISE NOTICE 'Verification status notification sent: user=%, status=%',
    NEW.user_id, NEW.verified_id;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error sending verification notification: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for verification status changes
DROP TRIGGER IF EXISTS trigger_notify_verification_status ON users_profile;
CREATE TRIGGER trigger_notify_verification_status
  AFTER UPDATE OF verified_id ON users_profile
  FOR EACH ROW
  EXECUTE FUNCTION notify_verification_status();


-- ============================================
-- 2. PROFILE COMPLETION REMINDER
-- ============================================
-- Optional: Notify users when their profile is incomplete
-- This can be triggered via a cron job or when they log in

CREATE OR REPLACE FUNCTION notify_profile_incomplete()
RETURNS TRIGGER AS $$
DECLARE
  v_completion_percentage INTEGER;
  v_missing_fields TEXT[];
BEGIN
  -- Only check for new user accounts (within 7 days of creation)
  IF NEW.created_at < NOW() - INTERVAL '7 days' THEN
    RETURN NEW;
  END IF;

  -- Don't spam - only notify once
  IF EXISTS (
    SELECT 1
    FROM notifications
    WHERE recipient_id = NEW.user_id
    AND type = 'profile_completion_reminder'
    AND created_at > NOW() - INTERVAL '7 days'
  ) THEN
    RETURN NEW;
  END IF;

  -- Check profile completion (basic check)
  v_missing_fields := ARRAY[]::TEXT[];

  IF NEW.display_name IS NULL OR NEW.display_name = '' THEN
    v_missing_fields := array_append(v_missing_fields, 'display name');
  END IF;

  IF NEW.avatar_url IS NULL OR NEW.avatar_url = '' THEN
    v_missing_fields := array_append(v_missing_fields, 'profile photo');
  END IF;

  IF NEW.bio IS NULL OR NEW.bio = '' THEN
    v_missing_fields := array_append(v_missing_fields, 'bio');
  END IF;

  IF NEW.city IS NULL OR NEW.city = '' THEN
    v_missing_fields := array_append(v_missing_fields, 'location');
  END IF;

  -- If profile is mostly complete, don't notify
  IF array_length(v_missing_fields, 1) IS NULL OR array_length(v_missing_fields, 1) < 2 THEN
    RETURN NEW;
  END IF;

  -- Check preferences
  IF EXISTS (
    SELECT 1
    FROM notification_preferences
    WHERE user_id = NEW.user_id
    AND (system_notifications = false OR in_app_enabled = false)
  ) THEN
    RETURN NEW;
  END IF;

  -- Send completion reminder
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
    'profile_completion_reminder',
    'system',
    '👋 Complete your profile',
    'Complete your profile to get more gig opportunities and connect with other creatives!',
    '/profile/edit',
    jsonb_build_object(
      'missing_fields', v_missing_fields,
      'profile_age_days', EXTRACT(DAY FROM NOW() - NEW.created_at)
    )
  );

  RAISE NOTICE 'Profile completion reminder sent: user=%', NEW.user_id;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error sending profile completion reminder: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Optional trigger - commented out by default to avoid spam
-- Uncomment if you want automatic profile completion reminders
-- DROP TRIGGER IF EXISTS trigger_notify_profile_incomplete ON users_profile;
-- CREATE TRIGGER trigger_notify_profile_incomplete
--   AFTER UPDATE ON users_profile
--   FOR EACH ROW
--   EXECUTE FUNCTION notify_profile_incomplete();


-- ============================================
-- 3. PLATFORM ANNOUNCEMENT HELPER FUNCTION
-- ============================================
-- Helper function for admins to send platform-wide announcements
-- Usage: SELECT send_platform_announcement('New Feature!', 'Check out our new matchmaking system', '/features/matchmaking');

CREATE OR REPLACE FUNCTION send_platform_announcement(
  p_title TEXT,
  p_message TEXT,
  p_action_url TEXT DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_user_count INTEGER;
  v_notifications_created INTEGER;
BEGIN
  -- Get count of users with system notifications enabled
  SELECT COUNT(*)
  INTO v_user_count
  FROM users_profile up
  LEFT JOIN notification_preferences np ON up.user_id = np.user_id
  WHERE COALESCE(np.system_notifications, true) = true
    AND COALESCE(np.in_app_enabled, true) = true;

  -- Insert notification for all eligible users
  INSERT INTO notifications (
    recipient_id,
    user_id,
    type,
    category,
    title,
    message,
    action_url,
    data
  )
  SELECT
    up.user_id,
    up.user_id,
    'platform_announcement',
    'system',
    p_title,
    p_message,
    p_action_url,
    jsonb_build_object(
      'announcement_type', 'platform_wide',
      'sent_at', NOW()
    )
  FROM users_profile up
  LEFT JOIN notification_preferences np ON up.user_id = np.user_id
  WHERE COALESCE(np.system_notifications, true) = true
    AND COALESCE(np.in_app_enabled, true) = true;

  GET DIAGNOSTICS v_notifications_created = ROW_COUNT;

  RAISE NOTICE 'Platform announcement sent: % notifications created for % eligible users',
    v_notifications_created, v_user_count;

  RETURN v_notifications_created;
END;
$$ LANGUAGE plpgsql;


-- ============================================
-- 4. TARGETED ANNOUNCEMENT HELPER
-- ============================================
-- Send announcements to specific user segments
-- Example: Send to all TALENT users, or users in specific city

CREATE OR REPLACE FUNCTION send_targeted_announcement(
  p_title TEXT,
  p_message TEXT,
  p_role_filter TEXT[] DEFAULT NULL,
  p_city_filter TEXT DEFAULT NULL,
  p_action_url TEXT DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_notifications_created INTEGER;
  v_query TEXT;
BEGIN
  -- Build dynamic notification insert based on filters
  INSERT INTO notifications (
    recipient_id,
    user_id,
    type,
    category,
    title,
    message,
    action_url,
    data
  )
  SELECT
    up.user_id,
    up.user_id,
    'targeted_announcement',
    'system',
    p_title,
    p_message,
    p_action_url,
    jsonb_build_object(
      'announcement_type', 'targeted',
      'filters', jsonb_build_object(
        'roles', p_role_filter,
        'city', p_city_filter
      ),
      'sent_at', NOW()
    )
  FROM users_profile up
  LEFT JOIN notification_preferences np ON up.user_id = np.user_id
  WHERE COALESCE(np.system_notifications, true) = true
    AND COALESCE(np.in_app_enabled, true) = true
    AND (p_role_filter IS NULL OR up.role_flags && p_role_filter)
    AND (p_city_filter IS NULL OR up.city = p_city_filter);

  GET DIAGNOSTICS v_notifications_created = ROW_COUNT;

  RAISE NOTICE 'Targeted announcement sent: % notifications created (roles: %, city: %)',
    v_notifications_created, p_role_filter, p_city_filter;

  RETURN v_notifications_created;
END;
$$ LANGUAGE plpgsql;


-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON FUNCTION notify_verification_status() IS
  'Sends notification when user ID verification status changes (approved, rejected, or revoked)';

COMMENT ON FUNCTION notify_profile_incomplete() IS
  'Sends reminder notification to new users with incomplete profiles (within 7 days of signup)';

COMMENT ON FUNCTION send_platform_announcement(TEXT, TEXT, TEXT) IS
  'Admin helper function to send announcement to all users with system notifications enabled. Returns count of notifications created.';

COMMENT ON FUNCTION send_targeted_announcement(TEXT, TEXT, TEXT[], TEXT, TEXT) IS
  'Admin helper function to send targeted announcements to specific user segments (by role or city). Returns count of notifications created.';

COMMENT ON TRIGGER trigger_notify_verification_status ON users_profile IS
  'Triggers notification when user verification status changes';


-- ============================================
-- EXAMPLE USAGE
-- ============================================

-- Send platform-wide announcement:
-- SELECT send_platform_announcement(
--   '🎉 New Feature: Enhanced Matchmaking',
--   'Our new role-based matchmaking algorithm helps you find the perfect collaborators!',
--   '/features/matchmaking'
-- );

-- Send targeted announcement to all talent in Dublin:
-- SELECT send_targeted_announcement(
--   '📸 Dublin Photo Walk This Weekend',
--   'Join us for a photographer meetup this Saturday!',
--   ARRAY['TALENT'],
--   'Dublin',
--   '/events/dublin-photo-walk'
-- );

-- Send to all creators:
-- SELECT send_targeted_announcement(
--   '💡 Creator Showcase Contest',
--   'Submit your best work for a chance to be featured!',
--   ARRAY['CREATOR', 'PHOTOGRAPHER', 'VIDEOGRAPHER'],
--   NULL,
--   '/contests/creator-showcase'
-- );


-- ============================================
-- VERIFICATION QUERY
-- ============================================

-- Check installed triggers:
-- SELECT trigger_name, event_manipulation, event_object_table
-- FROM information_schema.triggers
-- WHERE trigger_name LIKE '%verification%'
-- AND trigger_schema = 'public';

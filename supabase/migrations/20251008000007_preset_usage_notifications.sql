-- Preset Usage Notifications
-- Triggers notifications when:
-- 1. Someone uses your preset
-- 2. Your preset reaches usage milestones (10, 50, 100, 500, 1000 uses)

-- ============================================
-- 1. PRESET USAGE NOTIFICATION
-- ============================================

CREATE OR REPLACE FUNCTION notify_preset_usage()
RETURNS TRIGGER AS $$
DECLARE
  v_user RECORD;
  v_preset RECORD;
  v_owner RECORD;
  v_usage_count INTEGER;
BEGIN
  -- Get user who used the preset
  SELECT
    user_id,
    display_name,
    avatar_url,
    handle
  INTO v_user
  FROM users_profile
  WHERE id = NEW.user_id;

  -- Get preset and owner details
  SELECT
    p.id,
    p.name,
    p.usage_count,
    p.user_id as owner_user_id,
    up.display_name as owner_name,
    up.user_id as owner_auth_user_id
  INTO v_preset
  FROM presets p
  JOIN users_profile up ON p.user_id = up.user_id
  WHERE p.id = NEW.preset_id;

  -- Don't notify if user uses their own preset
  IF v_user.user_id = v_preset.owner_auth_user_id THEN
    RETURN NEW;
  END IF;

  -- Get current usage count (after this use)
  v_usage_count := COALESCE(v_preset.usage_count, 0) + 1;

  -- Check notification preferences (default to true)
  IF EXISTS (
    SELECT 1
    FROM notification_preferences
    WHERE user_id = v_preset.owner_auth_user_id
    AND (system_notifications = false OR in_app_enabled = false)
  ) THEN
    RAISE NOTICE 'Preset usage notification skipped (preferences disabled): user=%', v_preset.owner_auth_user_id;
    RETURN NEW;
  END IF;

  -- Send notification for every use (can be adjusted to milestone-based)
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
    v_preset.owner_auth_user_id,
    v_user.user_id,
    'preset_used',
    'social',
    '🎨 Someone used your preset',
    v_user.display_name || ' used your preset "' || v_preset.name || '"',
    v_user.avatar_url,
    '/presets/' || v_preset.id,
    jsonb_build_object(
      'preset_id', v_preset.id,
      'preset_name', v_preset.name,
      'user_id', v_user.user_id,
      'user_name', v_user.display_name,
      'user_handle', v_user.handle,
      'usage_count', v_usage_count,
      'used_at', NEW.used_at
    )
  );

  RAISE NOTICE 'Preset usage notification sent: % used preset % (total uses: %)',
    v_user.display_name, v_preset.name, v_usage_count;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error sending preset usage notification: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for preset usage
DROP TRIGGER IF EXISTS trigger_notify_preset_usage ON preset_usage;
CREATE TRIGGER trigger_notify_preset_usage
  AFTER INSERT ON preset_usage
  FOR EACH ROW
  EXECUTE FUNCTION notify_preset_usage();


-- ============================================
-- 2. PRESET MILESTONE NOTIFICATION
-- ============================================

CREATE OR REPLACE FUNCTION notify_preset_milestone()
RETURNS TRIGGER AS $$
DECLARE
  v_owner RECORD;
  v_milestone INTEGER;
  v_milestone_reached BOOLEAN := false;
BEGIN
  -- Only check on usage count increase
  IF NEW.usage_count <= OLD.usage_count THEN
    RETURN NEW;
  END IF;

  -- Get preset owner details
  SELECT
    up.user_id,
    up.display_name
  INTO v_owner
  FROM users_profile up
  WHERE up.user_id = NEW.user_id;

  -- Check notification preferences
  IF EXISTS (
    SELECT 1
    FROM notification_preferences
    WHERE user_id = v_owner.user_id
    AND (system_notifications = false OR in_app_enabled = false)
  ) THEN
    RETURN NEW;
  END IF;

  -- Check if milestone reached (10, 50, 100, 500, 1000, 5000)
  IF NEW.usage_count >= 5000 AND OLD.usage_count < 5000 THEN
    v_milestone := 5000;
    v_milestone_reached := true;
  ELSIF NEW.usage_count >= 1000 AND OLD.usage_count < 1000 THEN
    v_milestone := 1000;
    v_milestone_reached := true;
  ELSIF NEW.usage_count >= 500 AND OLD.usage_count < 500 THEN
    v_milestone := 500;
    v_milestone_reached := true;
  ELSIF NEW.usage_count >= 100 AND OLD.usage_count < 100 THEN
    v_milestone := 100;
    v_milestone_reached := true;
  ELSIF NEW.usage_count >= 50 AND OLD.usage_count < 50 THEN
    v_milestone := 50;
    v_milestone_reached := true;
  ELSIF NEW.usage_count >= 10 AND OLD.usage_count < 10 THEN
    v_milestone := 10;
    v_milestone_reached := true;
  END IF;

  -- Send milestone notification
  IF v_milestone_reached THEN
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
      v_owner.user_id,
      v_owner.user_id,
      'preset_milestone',
      'system',
      '🎉 Preset milestone reached!',
      'Your preset "' || NEW.name || '" has reached ' || v_milestone || ' uses!',
      '/presets/' || NEW.id || '/analytics',
      jsonb_build_object(
        'preset_id', NEW.id,
        'preset_name', NEW.name,
        'milestone', v_milestone,
        'total_usage', NEW.usage_count,
        'achieved_at', NOW()
      )
    );

    RAISE NOTICE 'Preset milestone notification sent: preset % reached % uses',
      NEW.name, v_milestone;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error sending preset milestone notification: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for preset milestones
DROP TRIGGER IF EXISTS trigger_notify_preset_milestone ON presets;
CREATE TRIGGER trigger_notify_preset_milestone
  AFTER UPDATE OF usage_count ON presets
  FOR EACH ROW
  EXECUTE FUNCTION notify_preset_milestone();


-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON FUNCTION notify_preset_usage() IS
  'Sends notification to preset owner when someone uses their preset';

COMMENT ON FUNCTION notify_preset_milestone() IS
  'Sends notification when preset reaches usage milestones (10, 50, 100, 500, 1000, 5000 uses)';

COMMENT ON TRIGGER trigger_notify_preset_usage ON preset_usage IS
  'Triggers notification when a preset is used';

COMMENT ON TRIGGER trigger_notify_preset_milestone ON presets IS
  'Triggers milestone notification when usage count increases';


-- ============================================
-- VERIFICATION QUERY
-- ============================================

-- Check installed triggers:
-- SELECT trigger_name, event_manipulation, event_object_table
-- FROM information_schema.triggers
-- WHERE trigger_name LIKE '%preset%'
-- AND trigger_schema = 'public';

-- Fix: Create notify_preset_liked function
-- This was missing from the database

CREATE OR REPLACE FUNCTION notify_preset_liked()
RETURNS TRIGGER AS $$
DECLARE
  v_liker RECORD;
  v_preset RECORD;
BEGIN
  -- Get liker details
  SELECT
    user_id,
    display_name,
    avatar_url,
    handle
  INTO v_liker
  FROM users_profile
  WHERE user_id = NEW.user_id;

  -- Get preset and owner details
  SELECT
    p.id,
    p.name,
    p.title,
    p.user_id as owner_user_id,
    up.display_name as owner_name
  INTO v_preset
  FROM presets p
  JOIN users_profile up ON p.user_id = up.user_id
  WHERE p.id = NEW.preset_id;

  -- Don't notify if user likes their own preset
  IF v_liker.user_id = v_preset.owner_user_id THEN
    RETURN NEW;
  END IF;

  -- Check notification preferences
  IF EXISTS (
    SELECT 1
    FROM notification_preferences
    WHERE user_id = v_preset.owner_user_id
    AND (system_notifications = false OR in_app_enabled = false)
  ) THEN
    RAISE NOTICE 'Preset like notification skipped (preferences disabled): user=%',
      v_preset.owner_user_id;
    RETURN NEW;
  END IF;

  -- Create notification
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
    v_preset.owner_user_id,
    v_liker.user_id,
    'preset_like',
    'social',
    '❤️ Someone liked your preset',
    v_liker.display_name || ' liked "' || COALESCE(v_preset.title, v_preset.name) || '"',
    v_liker.avatar_url,
    '/presets/' || v_preset.id,
    jsonb_build_object(
      'preset_id', v_preset.id,
      'preset_name', COALESCE(v_preset.title, v_preset.name),
      'liker_id', v_liker.user_id,
      'liker_name', v_liker.display_name,
      'liker_handle', v_liker.handle,
      'liked_at', NEW.created_at
    )
  );

  RAISE NOTICE 'Preset like notification sent: % liked %',
    v_liker.display_name, COALESCE(v_preset.title, v_preset.name);

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error sending preset like notification: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION notify_preset_liked() IS
  'Sends notification when someone likes a preset';

-- Now create the trigger
DROP TRIGGER IF EXISTS trigger_notify_preset_liked ON preset_likes;
CREATE TRIGGER trigger_notify_preset_liked
  AFTER INSERT ON preset_likes
  FOR EACH ROW
  EXECUTE FUNCTION notify_preset_liked();

COMMENT ON TRIGGER trigger_notify_preset_liked ON preset_likes IS
  'Triggers notification when a preset is liked';

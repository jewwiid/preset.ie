-- Message Notifications
-- Triggers notifications when:
-- 1. User receives a new direct message

-- ============================================
-- NEW MESSAGE NOTIFICATION
-- ============================================

CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
DECLARE
  v_sender RECORD;
  v_recipient RECORD;
  v_gig_title TEXT;
  v_message_preview TEXT;
BEGIN
  -- Get sender details
  SELECT
    user_id,
    display_name,
    avatar_url,
    handle
  INTO v_sender
  FROM users_profile
  WHERE id = NEW.from_user_id;

  -- Get recipient details
  SELECT
    user_id,
    display_name
  INTO v_recipient
  FROM users_profile
  WHERE id = NEW.to_user_id;

  -- Get gig title for context
  SELECT title INTO v_gig_title
  FROM gigs
  WHERE id = NEW.gig_id;

  -- Check notification preferences (default to true)
  IF EXISTS (
    SELECT 1
    FROM notification_preferences
    WHERE user_id = v_recipient.user_id
    AND (application_notifications = false OR in_app_enabled = false)
  ) THEN
    RAISE NOTICE 'Message notification skipped (preferences disabled): user=%', v_recipient.user_id;
    RETURN NEW;
  END IF;

  -- Create message preview (first 100 characters)
  v_message_preview := substring(NEW.body, 1, 100);
  IF length(NEW.body) > 100 THEN
    v_message_preview := v_message_preview || '...';
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
    v_recipient.user_id,
    v_sender.user_id,
    'new_message',
    'gig',
    '💬 New message',
    v_sender.display_name || ' sent you a message about "' || v_gig_title || '"',
    v_sender.avatar_url,
    '/gigs/' || NEW.gig_id || '/messages',
    jsonb_build_object(
      'message_id', NEW.id,
      'gig_id', NEW.gig_id,
      'gig_title', v_gig_title,
      'sender_id', v_sender.user_id,
      'sender_name', v_sender.display_name,
      'sender_handle', v_sender.handle,
      'message_preview', v_message_preview,
      'has_attachments', (NEW.attachments IS NOT NULL AND jsonb_array_length(NEW.attachments) > 0),
      'sent_at', NEW.created_at
    )
  );

  RAISE NOTICE 'Message notification sent: % messaged % about gig %',
    v_sender.display_name, v_recipient.display_name, v_gig_title;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error sending message notification: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new messages
DROP TRIGGER IF EXISTS trigger_notify_new_message ON messages;
CREATE TRIGGER trigger_notify_new_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_message();


-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON FUNCTION notify_new_message() IS
  'Sends notification when a user receives a new direct message about a gig';

COMMENT ON TRIGGER trigger_notify_new_message ON messages IS
  'Triggers notification when a new message is sent';


-- ============================================
-- VERIFICATION QUERY
-- ============================================

-- Check installed trigger:
-- SELECT trigger_name, event_manipulation, event_object_table
-- FROM information_schema.triggers
-- WHERE trigger_name = 'trigger_notify_new_message'
-- AND trigger_schema = 'public';

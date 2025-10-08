-- Create Showcase Notification Functions
-- These functions were missing from the database

-- ============================================
-- 1. SHOWCASE LIKED NOTIFICATION
-- ============================================

CREATE OR REPLACE FUNCTION notify_showcase_liked()
RETURNS TRIGGER AS $$
DECLARE
  v_liker RECORD;
  v_showcase RECORD;
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

  -- Get showcase and owner details
  SELECT
    s.id,
    s.title,
    s.creator_user_id,
    up.display_name as owner_name,
    up.user_id as owner_user_id
  INTO v_showcase
  FROM showcases s
  JOIN users_profile up ON s.creator_user_id = up.id
  WHERE s.id = NEW.showcase_id;

  -- Don't notify if user likes their own showcase
  IF v_liker.user_id = v_showcase.owner_user_id THEN
    RETURN NEW;
  END IF;

  -- Check notification preferences
  IF EXISTS (
    SELECT 1
    FROM notification_preferences
    WHERE user_id = v_showcase.owner_user_id
    AND (system_notifications = false OR in_app_enabled = false)
  ) THEN
    RAISE NOTICE 'Showcase like notification skipped (preferences disabled): user=%',
      v_showcase.owner_user_id;
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
    v_showcase.owner_user_id,
    v_liker.user_id,
    'showcase_like',
    'social',
    '❤️ Someone liked your showcase',
    v_liker.display_name || ' liked "' || v_showcase.title || '"',
    v_liker.avatar_url,
    '/showcases/' || v_showcase.id,
    jsonb_build_object(
      'showcase_id', v_showcase.id,
      'showcase_title', v_showcase.title,
      'liker_id', v_liker.user_id,
      'liker_name', v_liker.display_name,
      'liker_handle', v_liker.handle,
      'liked_at', NEW.created_at
    )
  );

  RAISE NOTICE 'Showcase like notification sent: % liked %',
    v_liker.display_name, v_showcase.title;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error sending showcase like notification: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ============================================
-- 2. SHOWCASE COMMENT NOTIFICATION
-- ============================================

CREATE OR REPLACE FUNCTION notify_showcase_comment()
RETURNS TRIGGER AS $$
DECLARE
  v_commenter RECORD;
  v_showcase RECORD;
  v_parent_comment RECORD;
  v_comment_preview TEXT;
BEGIN
  -- Get commenter details
  SELECT
    user_id,
    display_name,
    avatar_url,
    handle
  INTO v_commenter
  FROM users_profile
  WHERE user_id = NEW.user_id;

  -- Get showcase and owner details
  SELECT
    s.id,
    s.title,
    s.creator_user_id,
    up.display_name as owner_name,
    up.user_id as owner_user_id
  INTO v_showcase
  FROM showcases s
  JOIN users_profile up ON s.creator_user_id = up.id
  WHERE s.id = NEW.showcase_id;

  -- Create comment preview (first 100 chars)
  v_comment_preview := SUBSTRING(NEW.comment FROM 1 FOR 100);
  IF LENGTH(NEW.comment) > 100 THEN
    v_comment_preview := v_comment_preview || '...';
  END IF;

  -- If this is a reply, notify the parent comment author
  IF NEW.parent_id IS NOT NULL THEN
    SELECT
      sc.user_id as parent_user_id,
      up.display_name as parent_author_name,
      up.user_id as parent_author_user_id
    INTO v_parent_comment
    FROM showcase_comments sc
    JOIN users_profile up ON sc.user_id = up.user_id
    WHERE sc.id = NEW.parent_id;

    -- Notify parent comment author (if not commenting on their own comment)
    IF v_commenter.user_id != v_parent_comment.parent_author_user_id THEN
      IF NOT EXISTS (
        SELECT 1
        FROM notification_preferences
        WHERE user_id = v_parent_comment.parent_author_user_id
        AND (system_notifications = false OR in_app_enabled = false)
      ) THEN
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
          v_parent_comment.parent_author_user_id,
          v_commenter.user_id,
          'showcase_comment_reply',
          'social',
          '💬 Someone replied to your comment',
          v_commenter.display_name || ' replied: "' || v_comment_preview || '"',
          v_commenter.avatar_url,
          '/showcases/' || v_showcase.id || '#comment-' || NEW.id,
          jsonb_build_object(
            'showcase_id', v_showcase.id,
            'showcase_title', v_showcase.title,
            'comment_id', NEW.id,
            'parent_comment_id', NEW.parent_id,
            'commenter_id', v_commenter.user_id,
            'commenter_name', v_commenter.display_name,
            'commenter_handle', v_commenter.handle,
            'comment_preview', v_comment_preview,
            'commented_at', NEW.created_at
          )
        );
      END IF;
    END IF;
  END IF;

  -- Notify showcase owner (unless they commented themselves)
  IF v_commenter.user_id != v_showcase.owner_user_id THEN
    IF NOT EXISTS (
      SELECT 1
      FROM notification_preferences
      WHERE user_id = v_showcase.owner_user_id
      AND (system_notifications = false OR in_app_enabled = false)
    ) THEN
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
        v_showcase.owner_user_id,
        v_commenter.user_id,
        'showcase_comment',
        'social',
        '💬 Someone commented on your showcase',
        v_commenter.display_name || ' commented: "' || v_comment_preview || '"',
        v_commenter.avatar_url,
        '/showcases/' || v_showcase.id || '#comment-' || NEW.id,
        jsonb_build_object(
          'showcase_id', v_showcase.id,
          'showcase_title', v_showcase.title,
          'comment_id', NEW.id,
          'commenter_id', v_commenter.user_id,
          'commenter_name', v_commenter.display_name,
          'commenter_handle', v_commenter.handle,
          'comment_preview', v_comment_preview,
          'commented_at', NEW.created_at
        )
      );
    END IF;
  END IF;

  RAISE NOTICE 'Showcase comment notification sent: % commented on %',
    v_commenter.display_name, v_showcase.title;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error sending showcase comment notification: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ============================================
-- 3. CREATE TRIGGERS
-- ============================================

-- Showcase like trigger
DROP TRIGGER IF EXISTS trigger_notify_showcase_liked ON showcase_likes;
CREATE TRIGGER trigger_notify_showcase_liked
  AFTER INSERT ON showcase_likes
  FOR EACH ROW
  EXECUTE FUNCTION notify_showcase_liked();

-- Showcase comment trigger
DROP TRIGGER IF EXISTS trigger_notify_showcase_comment ON showcase_comments;
CREATE TRIGGER trigger_notify_showcase_comment
  AFTER INSERT ON showcase_comments
  FOR EACH ROW
  EXECUTE FUNCTION notify_showcase_comment();


-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON FUNCTION notify_showcase_liked() IS
  'Sends notification when someone likes a showcase';

COMMENT ON FUNCTION notify_showcase_comment() IS
  'Sends notification when someone comments on a showcase or replies to a comment';


-- ============================================
-- VERIFICATION
-- ============================================

DO $$
DECLARE
  function_count INTEGER;
  trigger_count INTEGER;
BEGIN
  -- Count showcase notification functions
  SELECT COUNT(*) INTO function_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
  AND p.proname IN ('notify_showcase_liked', 'notify_showcase_comment');

  -- Count showcase notification triggers
  SELECT COUNT(*) INTO trigger_count
  FROM information_schema.triggers
  WHERE trigger_schema = 'public'
  AND event_object_table IN ('showcase_likes', 'showcase_comments')
  AND trigger_name LIKE 'trigger_notify_%';

  RAISE NOTICE '✅ Showcase notification functions created: %', function_count;
  RAISE NOTICE '✅ Showcase notification triggers activated: %', trigger_count;
END $$;

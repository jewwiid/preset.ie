-- Install Missing Notification Triggers
-- This migration installs triggers that were skipped due to conditional table checks
-- Run this after confirming the required tables exist

-- ============================================
-- 1. PRESET LIKED TRIGGER
-- ============================================

DO $$
BEGIN
  -- Check if preset_likes table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'preset_likes'
  ) THEN
    -- Drop if exists and recreate
    DROP TRIGGER IF EXISTS trigger_notify_preset_liked ON preset_likes;
    CREATE TRIGGER trigger_notify_preset_liked
      AFTER INSERT ON preset_likes
      FOR EACH ROW
      EXECUTE FUNCTION notify_preset_liked();

    RAISE NOTICE '✅ Preset like notification trigger created successfully';
  ELSE
    RAISE NOTICE '⚠️  preset_likes table does not exist - skipping';
  END IF;
END $$;


-- ============================================
-- 2. MARKETPLACE TRIGGERS (if tables exist)
-- ============================================

-- Preset Purchases Trigger
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'preset_purchases'
  ) THEN
    DROP TRIGGER IF EXISTS trigger_notify_preset_purchased ON preset_purchases;
    CREATE TRIGGER trigger_notify_preset_purchased
      AFTER INSERT ON preset_purchases
      FOR EACH ROW
      EXECUTE FUNCTION notify_preset_purchased();

    RAISE NOTICE '✅ Preset purchase notification trigger created successfully';
  ELSE
    RAISE NOTICE '⚠️  preset_purchases table does not exist - skipping';
  END IF;
END $$;

-- Listing Status Trigger
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'preset_marketplace_listings'
  ) THEN
    DROP TRIGGER IF EXISTS trigger_notify_listing_status ON preset_marketplace_listings;
    CREATE TRIGGER trigger_notify_listing_status
      AFTER UPDATE OF status ON preset_marketplace_listings
      FOR EACH ROW
      EXECUTE FUNCTION notify_listing_status();

    RAISE NOTICE '✅ Listing status notification trigger created successfully';
  ELSE
    RAISE NOTICE '⚠️  preset_marketplace_listings table does not exist - skipping';
  END IF;
END $$;

-- Preset Review Trigger
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'preset_reviews'
  ) THEN
    DROP TRIGGER IF EXISTS trigger_notify_preset_review ON preset_reviews;
    CREATE TRIGGER trigger_notify_preset_review
      AFTER INSERT ON preset_reviews
      FOR EACH ROW
      EXECUTE FUNCTION notify_preset_review();

    RAISE NOTICE '✅ Preset review notification trigger created successfully';
  ELSE
    RAISE NOTICE '⚠️  preset_reviews table does not exist - skipping';
  END IF;
END $$;


-- ============================================
-- 3. SOCIAL TRIGGERS (if tables exist)
-- ============================================

-- New Follower Trigger
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'user_follows'
  ) THEN
    DROP TRIGGER IF EXISTS trigger_notify_new_follower ON user_follows;
    CREATE TRIGGER trigger_notify_new_follower
      AFTER INSERT ON user_follows
      FOR EACH ROW
      EXECUTE FUNCTION notify_new_follower();

    RAISE NOTICE '✅ New follower notification trigger created successfully';
  ELSE
    RAISE NOTICE '⚠️  user_follows table does not exist - skipping';
  END IF;
END $$;

-- Showcase Liked Trigger
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'showcase_likes'
  ) THEN
    DROP TRIGGER IF EXISTS trigger_notify_showcase_liked ON showcase_likes;
    CREATE TRIGGER trigger_notify_showcase_liked
      AFTER INSERT ON showcase_likes
      FOR EACH ROW
      EXECUTE FUNCTION notify_showcase_liked();

    RAISE NOTICE '✅ Showcase like notification trigger created successfully';
  ELSE
    RAISE NOTICE '⚠️  showcase_likes table does not exist - skipping';
  END IF;
END $$;

-- Showcase Comment Trigger
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'showcase_comments'
  ) THEN
    DROP TRIGGER IF EXISTS trigger_notify_showcase_comment ON showcase_comments;
    CREATE TRIGGER trigger_notify_showcase_comment
      AFTER INSERT ON showcase_comments
      FOR EACH ROW
      EXECUTE FUNCTION notify_showcase_comment();

    RAISE NOTICE '✅ Showcase comment notification trigger created successfully';
  ELSE
    RAISE NOTICE '⚠️  showcase_comments table does not exist - skipping';
  END IF;
END $$;


-- ============================================
-- VERIFICATION QUERY
-- ============================================

-- Show all installed notification triggers
DO $$
DECLARE
  trigger_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO trigger_count
  FROM information_schema.triggers
  WHERE trigger_schema = 'public'
  AND trigger_name LIKE 'trigger_notify_%';

  RAISE NOTICE '📊 Total notification triggers installed: %', trigger_count;

  RAISE NOTICE '📋 Installed triggers:';
  FOR trigger_record IN (
    SELECT trigger_name, event_object_table
    FROM information_schema.triggers
    WHERE trigger_schema = 'public'
    AND trigger_name LIKE 'trigger_notify_%'
    ORDER BY event_object_table, trigger_name
  ) LOOP
    RAISE NOTICE '   ✓ % on %', trigger_record.trigger_name, trigger_record.event_object_table;
  END LOOP;
END $$;

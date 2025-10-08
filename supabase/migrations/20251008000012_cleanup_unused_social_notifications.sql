-- Remove Unused Social Notification Functions
-- Only removes follower-related functions (we don't have followers)
-- KEEPS showcase notification functions (showcases DO support likes/comments via API)

-- ============================================
-- DROP UNUSED NOTIFICATION FUNCTIONS
-- ============================================

-- Drop follower notification function (we don't have followers)
DROP FUNCTION IF EXISTS notify_new_follower() CASCADE;
COMMENT ON FUNCTION table_exists(text) IS NULL; -- Clean up comment if exists

-- NOTE: We are KEEPING notify_showcase_liked() and notify_showcase_comment()
-- because the showcase like API at /api/showcases/[id]/like/route.ts expects
-- the showcase_likes table, and comments are planned. These functions will be
-- activated when migration 20251008000013_create_showcase_interactions.sql runs.

-- Drop profile incomplete reminder (optional feature we're not using)
DROP FUNCTION IF EXISTS notify_profile_incomplete() CASCADE;


-- ============================================
-- VERIFICATION
-- ============================================

DO $$
DECLARE
  remaining_notify_functions INTEGER;
  func_record RECORD;
BEGIN
  -- Count remaining notification functions
  SELECT COUNT(*) INTO remaining_notify_functions
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
  AND p.proname LIKE 'notify_%';

  RAISE NOTICE '✅ Cleaned up unused social notification functions';
  RAISE NOTICE '📊 Remaining notification functions: %', remaining_notify_functions;

  -- Show what's left
  RAISE NOTICE '📋 Active notification functions:';
  FOR func_record IN (
    SELECT p.proname
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname LIKE 'notify_%'
    ORDER BY p.proname
  ) LOOP
    RAISE NOTICE '   ✓ %', func_record.proname;
  END LOOP;
END $$;


-- ============================================
-- EXPECTED REMAINING FUNCTIONS (14):
-- ============================================
-- ✓ notify_application_status_changed
-- ✓ notify_credits_added
-- ✓ notify_gig_application_received
-- ✓ notify_listing_status
-- ✓ notify_low_credit
-- ✓ notify_new_message
-- ✓ notify_preset_liked
-- ✓ notify_preset_milestone
-- ✓ notify_preset_purchased
-- ✓ notify_preset_review
-- ✓ notify_preset_usage
-- ✓ notify_showcase_comment (KEPT - activated by migration 20251008000013)
-- ✓ notify_showcase_liked (KEPT - activated by migration 20251008000013)
-- ✓ notify_verification_status

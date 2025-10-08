-- Marketplace Notifications
-- Triggers notifications for:
-- 1. Preset purchased (seller notification)
-- 2. Preset listing approved/rejected (seller notification)
-- 3. Preset review received (seller notification)
-- 4. Purchase confirmation (buyer notification)

-- ============================================
-- HELPER: Check if table exists
-- ============================================

CREATE OR REPLACE FUNCTION table_exists_marketplace(table_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND tables.table_name = table_exists_marketplace.table_name
  );
END;
$$ LANGUAGE plpgsql;


-- ============================================
-- 1. PRESET PURCHASE NOTIFICATION (SELLER)
-- ============================================

CREATE OR REPLACE FUNCTION notify_preset_purchased()
RETURNS TRIGGER AS $$
DECLARE
  v_buyer RECORD;
  v_seller RECORD;
  v_preset RECORD;
BEGIN
  -- Only notify on completed purchases
  IF NEW.payment_status != 'completed' THEN
    RETURN NEW;
  END IF;

  -- Get buyer details
  SELECT
    user_id,
    display_name,
    avatar_url,
    handle
  INTO v_buyer
  FROM users_profile
  WHERE user_id = NEW.buyer_user_id;

  -- Get seller details
  SELECT
    user_id,
    display_name
  INTO v_seller
  FROM users_profile
  WHERE user_id = NEW.seller_user_id;

  -- Get preset details
  SELECT
    id,
    name,
    title
  INTO v_preset
  FROM presets
  WHERE id = NEW.preset_id;

  -- Check seller notification preferences
  IF EXISTS (
    SELECT 1
    FROM notification_preferences
    WHERE user_id = v_seller.user_id
    AND (system_notifications = false OR in_app_enabled = false)
  ) THEN
    RAISE NOTICE 'Purchase notification skipped (seller preferences disabled): user=%', v_seller.user_id;
    RETURN NEW;
  END IF;

  -- Notify seller
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
    v_seller.user_id,
    v_buyer.user_id,
    'preset_purchased',
    'marketplace',
    '💰 Preset sold!',
    v_buyer.display_name || ' purchased your preset "' || COALESCE(v_preset.title, v_preset.name) || '" for ' || NEW.purchase_price || ' credits',
    v_buyer.avatar_url,
    '/marketplace/sales',
    jsonb_build_object(
      'purchase_id', NEW.id,
      'preset_id', v_preset.id,
      'preset_name', COALESCE(v_preset.title, v_preset.name),
      'buyer_id', v_buyer.user_id,
      'buyer_name', v_buyer.display_name,
      'buyer_handle', v_buyer.handle,
      'purchase_price', NEW.purchase_price,
      'seller_payout', NEW.seller_payout,
      'platform_fee', NEW.platform_fee,
      'purchased_at', NEW.purchased_at
    )
  );

  -- Notify buyer (purchase confirmation)
  IF EXISTS (
    SELECT 1
    FROM notification_preferences
    WHERE user_id = v_buyer.user_id
    AND COALESCE(system_notifications, true) = true
    AND COALESCE(in_app_enabled, true) = true
  ) THEN
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
      v_buyer.user_id,
      v_buyer.user_id,
      'preset_purchase_confirmation',
      'marketplace',
      '✅ Purchase complete',
      'You purchased "' || COALESCE(v_preset.title, v_preset.name) || '" for ' || NEW.purchase_price || ' credits',
      '/marketplace/purchases',
      jsonb_build_object(
        'purchase_id', NEW.id,
        'preset_id', v_preset.id,
        'preset_name', COALESCE(v_preset.title, v_preset.name),
        'seller_id', v_seller.user_id,
        'seller_name', v_seller.display_name,
        'purchase_price', NEW.purchase_price,
        'purchased_at', NEW.purchased_at
      )
    );
  END IF;

  RAISE NOTICE 'Purchase notifications sent: % bought % from %',
    v_buyer.display_name, v_preset.name, v_seller.display_name;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error sending purchase notification: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Conditionally create trigger
DO $$
BEGIN
  IF table_exists_marketplace('preset_purchases') THEN
    DROP TRIGGER IF EXISTS trigger_notify_preset_purchased ON preset_purchases;
    CREATE TRIGGER trigger_notify_preset_purchased
      AFTER INSERT ON preset_purchases
      FOR EACH ROW
      EXECUTE FUNCTION notify_preset_purchased();
    RAISE NOTICE 'Preset purchase notification trigger created successfully';
  ELSE
    RAISE NOTICE 'preset_purchases table does not exist - skipping purchase notification trigger';
  END IF;
END $$;


-- ============================================
-- 2. LISTING APPROVAL/REJECTION NOTIFICATION
-- ============================================

CREATE OR REPLACE FUNCTION notify_listing_status()
RETURNS TRIGGER AS $$
DECLARE
  v_seller RECORD;
  v_preset RECORD;
  v_notification_title TEXT;
  v_notification_message TEXT;
  v_notification_type TEXT;
BEGIN
  -- Only trigger on status change
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Only notify on approved/rejected status
  IF NEW.status NOT IN ('approved', 'rejected') THEN
    RETURN NEW;
  END IF;

  -- Get seller details
  SELECT
    user_id,
    display_name
  INTO v_seller
  FROM users_profile
  WHERE user_id = NEW.seller_user_id;

  -- Get preset details
  SELECT
    id,
    name,
    title
  INTO v_preset
  FROM presets
  WHERE id = NEW.preset_id;

  -- Check notification preferences
  IF EXISTS (
    SELECT 1
    FROM notification_preferences
    WHERE user_id = v_seller.user_id
    AND (system_notifications = false OR in_app_enabled = false)
  ) THEN
    RAISE NOTICE 'Listing status notification skipped (preferences disabled): user=%', v_seller.user_id;
    RETURN NEW;
  END IF;

  -- Customize message based on status
  IF NEW.status = 'approved' THEN
    v_notification_type := 'listing_approved';
    v_notification_title := '✅ Listing approved';
    v_notification_message := 'Your preset "' || COALESCE(v_preset.title, v_preset.name) || '" is now live in the marketplace!';
  ELSE
    v_notification_type := 'listing_rejected';
    v_notification_title := 'Listing needs attention';
    v_notification_message := 'Your preset "' || COALESCE(v_preset.title, v_preset.name) || '" needs some updates before it can be listed.';
  END IF;

  -- Create notification
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
    v_seller.user_id,
    v_seller.user_id,
    v_notification_type,
    'marketplace',
    v_notification_title,
    v_notification_message,
    '/marketplace/listings/' || NEW.id,
    jsonb_build_object(
      'listing_id', NEW.id,
      'preset_id', v_preset.id,
      'preset_name', COALESCE(v_preset.title, v_preset.name),
      'status', NEW.status,
      'rejection_reason', NEW.rejection_reason,
      'approved_at', NEW.approved_at,
      'approved_by', NEW.approved_by
    )
  );

  RAISE NOTICE 'Listing status notification sent: listing % status %',
    NEW.id, NEW.status;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error sending listing status notification: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Conditionally create trigger
DO $$
BEGIN
  IF table_exists_marketplace('preset_marketplace_listings') THEN
    DROP TRIGGER IF EXISTS trigger_notify_listing_status ON preset_marketplace_listings;
    CREATE TRIGGER trigger_notify_listing_status
      AFTER UPDATE OF status ON preset_marketplace_listings
      FOR EACH ROW
      EXECUTE FUNCTION notify_listing_status();
    RAISE NOTICE 'Listing status notification trigger created successfully';
  ELSE
    RAISE NOTICE 'preset_marketplace_listings table does not exist - skipping listing status notification trigger';
  END IF;
END $$;


-- ============================================
-- 3. PRESET REVIEW NOTIFICATION
-- ============================================

CREATE OR REPLACE FUNCTION notify_preset_review()
RETURNS TRIGGER AS $$
DECLARE
  v_reviewer RECORD;
  v_seller RECORD;
  v_preset RECORD;
  v_rating_emoji TEXT;
BEGIN
  -- Get reviewer details
  SELECT
    user_id,
    display_name,
    avatar_url,
    handle
  INTO v_reviewer
  FROM users_profile
  WHERE user_id = NEW.reviewer_user_id;

  -- Get preset and seller details
  SELECT
    p.id,
    p.name,
    p.title,
    p.user_id as seller_user_id,
    up.user_id as seller_auth_user_id,
    up.display_name as seller_name
  INTO v_preset
  FROM presets p
  JOIN users_profile up ON p.user_id = up.user_id
  WHERE p.id = NEW.preset_id;

  -- Don't notify if reviewer is the seller
  IF v_reviewer.user_id = v_preset.seller_auth_user_id THEN
    RETURN NEW;
  END IF;

  -- Check notification preferences
  IF EXISTS (
    SELECT 1
    FROM notification_preferences
    WHERE user_id = v_preset.seller_auth_user_id
    AND (system_notifications = false OR in_app_enabled = false)
  ) THEN
    RAISE NOTICE 'Review notification skipped (preferences disabled): user=%', v_preset.seller_auth_user_id;
    RETURN NEW;
  END IF;

  -- Get rating emoji
  v_rating_emoji := CASE
    WHEN NEW.rating >= 5 THEN '⭐⭐⭐⭐⭐'
    WHEN NEW.rating >= 4 THEN '⭐⭐⭐⭐'
    WHEN NEW.rating >= 3 THEN '⭐⭐⭐'
    WHEN NEW.rating >= 2 THEN '⭐⭐'
    ELSE '⭐'
  END;

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
    v_preset.seller_auth_user_id,
    v_reviewer.user_id,
    'preset_review',
    'marketplace',
    '⭐ New review',
    v_reviewer.display_name || ' rated your preset "' || COALESCE(v_preset.title, v_preset.name) || '" ' || v_rating_emoji,
    v_reviewer.avatar_url,
    '/marketplace/presets/' || v_preset.id || '/reviews',
    jsonb_build_object(
      'review_id', NEW.id,
      'preset_id', v_preset.id,
      'preset_name', COALESCE(v_preset.title, v_preset.name),
      'reviewer_id', v_reviewer.user_id,
      'reviewer_name', v_reviewer.display_name,
      'reviewer_handle', v_reviewer.handle,
      'rating', NEW.rating,
      'review_title', NEW.title,
      'review_comment', NEW.comment,
      'reviewed_at', NEW.created_at
    )
  );

  RAISE NOTICE 'Review notification sent: % reviewed preset %',
    v_reviewer.display_name, v_preset.name;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error sending review notification: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Conditionally create trigger
DO $$
BEGIN
  IF table_exists_marketplace('preset_reviews') THEN
    DROP TRIGGER IF EXISTS trigger_notify_preset_review ON preset_reviews;
    CREATE TRIGGER trigger_notify_preset_review
      AFTER INSERT ON preset_reviews
      FOR EACH ROW
      EXECUTE FUNCTION notify_preset_review();
    RAISE NOTICE 'Preset review notification trigger created successfully';
  ELSE
    RAISE NOTICE 'preset_reviews table does not exist - skipping review notification trigger';
  END IF;
END $$;


-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON FUNCTION table_exists_marketplace(TEXT) IS
  'Helper function to check if marketplace table exists';

COMMENT ON FUNCTION notify_preset_purchased() IS
  'Sends notifications to both seller (sale confirmation) and buyer (purchase confirmation) when preset is purchased';

COMMENT ON FUNCTION notify_listing_status() IS
  'Sends notification to seller when marketplace listing is approved or rejected';

COMMENT ON FUNCTION notify_preset_review() IS
  'Sends notification to preset seller when someone leaves a review';


-- ============================================
-- VERIFICATION QUERY
-- ============================================

-- Check installed triggers:
-- SELECT
--   trigger_name,
--   event_object_table,
--   action_statement
-- FROM information_schema.triggers
-- WHERE trigger_name IN (
--   'trigger_notify_preset_purchased',
--   'trigger_notify_listing_status',
--   'trigger_notify_preset_review'
-- )
-- AND trigger_schema = 'public';

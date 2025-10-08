-- Create Preset Purchase with Credits Function
-- Handles credit-based preset purchases with automatic notifications

-- ============================================
-- PURCHASE PRESET WITH CREDITS
-- ============================================

CREATE OR REPLACE FUNCTION purchase_preset_with_credits(
  p_preset_id UUID,
  p_buyer_user_id UUID
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  purchase_id UUID
) AS $$
DECLARE
  v_listing_id UUID;
  v_seller_user_id UUID;
  v_sale_price INTEGER;
  v_platform_fee INTEGER;
  v_seller_payout INTEGER;
  v_buyer_credits INTEGER;
  v_purchase_id UUID;
  v_buyer_profile_id UUID;
  v_seller_profile_id UUID;
BEGIN
  -- Get active listing for this preset
  SELECT id, seller_user_id, sale_price
  INTO v_listing_id, v_seller_user_id, v_sale_price
  FROM preset_marketplace_listings
  WHERE preset_id = p_preset_id
  AND status = 'approved'
  LIMIT 1;

  IF v_listing_id IS NULL THEN
    RETURN QUERY SELECT false, 'Preset is not available for purchase'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  -- Check if buyer is trying to buy their own preset
  IF v_seller_user_id = p_buyer_user_id THEN
    RETURN QUERY SELECT false, 'You cannot purchase your own preset'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  -- Check if user already owns this preset
  IF EXISTS (
    SELECT 1 FROM preset_purchases
    WHERE preset_id = p_preset_id
    AND buyer_user_id = p_buyer_user_id
  ) THEN
    RETURN QUERY SELECT false, 'You already own this preset'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  -- Get buyer profile ID
  SELECT id INTO v_buyer_profile_id
  FROM users_profile WHERE user_id = p_buyer_user_id;

  IF v_buyer_profile_id IS NULL THEN
    RETURN QUERY SELECT false, 'Buyer profile not found'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  -- Get seller profile ID
  SELECT id INTO v_seller_profile_id
  FROM users_profile WHERE user_id = v_seller_user_id;

  IF v_seller_profile_id IS NULL THEN
    RETURN QUERY SELECT false, 'Seller profile not found'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  -- Get buyer's current credits
  SELECT current_balance INTO v_buyer_credits
  FROM user_credits
  WHERE user_id = v_buyer_profile_id;

  IF v_buyer_credits IS NULL OR v_buyer_credits < v_sale_price THEN
    RETURN QUERY SELECT false,
      'Insufficient credits. You have ' || COALESCE(v_buyer_credits::TEXT, '0') || ' credits but need ' || v_sale_price::TEXT,
      NULL::UUID;
    RETURN;
  END IF;

  -- Calculate platform fee (10% of sale price)
  v_platform_fee := FLOOR(v_sale_price * 0.10);
  v_seller_payout := v_sale_price - v_platform_fee;

  -- Deduct credits from buyer
  UPDATE user_credits
  SET current_balance = current_balance - v_sale_price,
      updated_at = NOW()
  WHERE user_id = v_buyer_profile_id;

  -- Add credits to seller (payout after platform fee)
  UPDATE user_credits
  SET current_balance = current_balance + v_seller_payout,
      updated_at = NOW()
  WHERE user_id = v_seller_profile_id;

  -- Create purchase record (this triggers notify_preset_purchased)
  INSERT INTO preset_purchases (
    preset_id,
    listing_id,
    buyer_user_id,
    seller_user_id,
    purchase_price,
    platform_fee,
    seller_payout,
    payment_status
  ) VALUES (
    p_preset_id,
    v_listing_id,
    p_buyer_user_id,
    v_seller_user_id,
    v_sale_price,
    v_platform_fee,
    v_seller_payout,
    'completed'
  )
  RETURNING id INTO v_purchase_id;

  -- Update listing stats
  UPDATE preset_marketplace_listings
  SET total_sales = total_sales + 1,
      revenue_earned = revenue_earned + v_sale_price,
      updated_at = NOW()
  WHERE id = v_listing_id;

  RAISE NOTICE 'Preset purchased successfully: purchase_id=%, buyer=%, seller=%, price=%',
    v_purchase_id, p_buyer_user_id, v_seller_user_id, v_sale_price;

  RETURN QUERY SELECT true, 'Purchase successful'::TEXT, v_purchase_id;

EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in purchase_preset_with_credits: %', SQLERRM;
    RETURN QUERY SELECT false, 'Purchase failed: ' || SQLERRM, NULL::UUID;
END;
$$ LANGUAGE plpgsql;


-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON FUNCTION purchase_preset_with_credits(UUID, UUID) IS
  'Purchases a preset using credits. Deducts from buyer, adds to seller (minus 10% platform fee), creates purchase record which triggers notification to both parties.';


-- ============================================
-- VERIFICATION
-- ============================================

DO $$
DECLARE
  function_exists BOOLEAN;
BEGIN
  -- Check if function was created
  SELECT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname = 'purchase_preset_with_credits'
  ) INTO function_exists;

  IF function_exists THEN
    RAISE NOTICE '✅ Function purchase_preset_with_credits() created successfully';
    RAISE NOTICE '💡 This function will trigger notify_preset_purchased() on successful purchase';
    RAISE NOTICE '📊 Platform fee: 10%% of sale price';
  ELSE
    RAISE WARNING '❌ Failed to create purchase_preset_with_credits() function';
  END IF;
END $$;

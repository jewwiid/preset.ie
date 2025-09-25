-- Functions for preset marketplace operations
-- This file contains all the database functions needed for marketplace functionality

-- Function to purchase a preset with credits
CREATE OR REPLACE FUNCTION purchase_preset_with_credits(
  p_preset_id UUID,
  p_buyer_user_id UUID
) RETURNS TABLE(success BOOLEAN, message TEXT, purchase_id UUID) AS $$
DECLARE
  v_listing preset_marketplace_listings%ROWTYPE;
  v_buyer_credits INTEGER;
  v_seller_user_id UUID;
  v_purchase_id UUID;
  v_platform_fee INTEGER := 0; -- Could be configurable
  v_seller_payout INTEGER;
BEGIN
  -- Get the marketplace listing
  SELECT * INTO v_listing
  FROM preset_marketplace_listings
  WHERE preset_id = p_preset_id AND status = 'approved';
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Preset not available for purchase', NULL::UUID;
    RETURN;
  END IF;
  
  -- Check if buyer already owns this preset
  IF EXISTS (
    SELECT 1 FROM preset_purchases 
    WHERE preset_id = p_preset_id 
    AND buyer_user_id = p_buyer_user_id
    AND payment_status = 'completed'
  ) THEN
    RETURN QUERY SELECT false, 'You already own this preset', NULL::UUID;
    RETURN;
  END IF;
  
  -- Check if buyer has enough credits
  SELECT current_balance INTO v_buyer_credits
  FROM user_credits
  WHERE user_id = p_buyer_user_id;
  
  IF v_buyer_credits IS NULL THEN
    RETURN QUERY SELECT false, 'User credits not found', NULL::UUID;
    RETURN;
  END IF;
  
  IF v_buyer_credits < v_listing.sale_price THEN
    RETURN QUERY SELECT false, 'Insufficient credits', NULL::UUID;
    RETURN;
  END IF;
  
  -- Calculate seller payout (minus platform fee if any)
  v_seller_payout := v_listing.sale_price - v_platform_fee;
  v_seller_user_id := v_listing.seller_user_id;
  
  -- Start transaction
  BEGIN
    -- Deduct credits from buyer
    UPDATE user_credits
    SET 
      current_balance = current_balance - v_listing.sale_price,
      consumed_this_month = consumed_this_month + v_listing.sale_price,
      lifetime_consumed = lifetime_consumed + v_listing.sale_price,
      updated_at = NOW()
    WHERE user_id = p_buyer_user_id;
    
    -- Add credits to seller
    INSERT INTO user_credits (user_id, subscription_tier, current_balance, monthly_allowance)
    VALUES (v_seller_user_id, 'FREE', v_seller_payout, 0)
    ON CONFLICT (user_id) DO UPDATE SET
      current_balance = user_credits.current_balance + v_seller_payout,
      updated_at = NOW();
    
    -- Create purchase record
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
      v_listing.id,
      p_buyer_user_id,
      v_seller_user_id,
      v_listing.sale_price,
      v_platform_fee,
      v_seller_payout,
      'completed'
    ) RETURNING id INTO v_purchase_id;
    
    -- Log credit transaction for buyer
    INSERT INTO credit_transactions (
      user_id,
      transaction_type,
      credits_used,
      enhancement_type,
      status
    ) VALUES (
      p_buyer_user_id,
      'deduction',
      v_listing.sale_price,
      'preset_purchase',
      'completed'
    );
    
    -- Log credit transaction for seller
    INSERT INTO credit_transactions (
      user_id,
      transaction_type,
      credits_used,
      enhancement_type,
      status
    ) VALUES (
      v_seller_user_id,
      'credit',
      v_seller_payout,
      'preset_sale',
      'completed'
    );
    
    -- Update listing sales count
    UPDATE preset_marketplace_listings
    SET 
      total_sales = total_sales + 1,
      revenue_earned = revenue_earned + v_seller_payout,
      updated_at = NOW()
    WHERE id = v_listing.id;
    
    -- Update preset sales count
    UPDATE presets
    SET 
      total_sales = total_sales + 1,
      revenue_earned = revenue_earned + v_seller_payout,
      updated_at = NOW()
    WHERE id = p_preset_id;
    
    -- Grant access to the preset (copy to buyer's presets)
    INSERT INTO presets (
      user_id,
      name,
      description,
      category,
      prompt_template,
      negative_prompt,
      style_settings,
      technical_settings,
      ai_metadata,
      seedream_config,
      generation_mode,
      is_public,
      is_featured,
      created_at,
      updated_at
    )
    SELECT 
      p_buyer_user_id,
      p.name || ' (Purchased)',
      p.description,
      p.category,
      p.prompt_template,
      p.negative_prompt,
      p.style_settings,
      p.technical_settings,
      p.ai_metadata,
      p.seedream_config,
      p.generation_mode,
      false, -- Make it private for the buyer
      false,
      NOW(),
      NOW()
    FROM presets p
    WHERE p.id = p_preset_id;
    
    RETURN QUERY SELECT true, 'Purchase successful', v_purchase_id;
    
  EXCEPTION WHEN OTHERS THEN
    -- Rollback will happen automatically
    RETURN QUERY SELECT false, 'Purchase failed: ' || SQLERRM, NULL::UUID;
  END;
END;
$$ LANGUAGE plpgsql;

-- Function to create a marketplace listing
CREATE OR REPLACE FUNCTION create_marketplace_listing(
  p_preset_id UUID,
  p_seller_user_id UUID,
  p_sale_price INTEGER,
  p_marketplace_title VARCHAR(150),
  p_marketplace_description TEXT DEFAULT NULL,
  p_tags TEXT[] DEFAULT '{}'
) RETURNS TABLE(success BOOLEAN, message TEXT, listing_id UUID) AS $$
DECLARE
  v_listing_id UUID;
  v_preset_exists BOOLEAN;
BEGIN
  -- Check if preset exists and belongs to seller
  SELECT EXISTS(
    SELECT 1 FROM presets 
    WHERE id = p_preset_id 
    AND user_id = p_seller_user_id
  ) INTO v_preset_exists;
  
  IF NOT v_preset_exists THEN
    RETURN QUERY SELECT false, 'Preset not found or not owned by user', NULL::UUID;
    RETURN;
  END IF;
  
  -- Check if listing already exists
  IF EXISTS (
    SELECT 1 FROM preset_marketplace_listings 
    WHERE preset_id = p_preset_id
  ) THEN
    RETURN QUERY SELECT false, 'Preset already has a marketplace listing', NULL::UUID;
    RETURN;
  END IF;
  
  -- Validate price
  IF p_sale_price <= 0 THEN
    RETURN QUERY SELECT false, 'Sale price must be greater than 0', NULL::UUID;
    RETURN;
  END IF;
  
  BEGIN
    -- Update preset as for sale
    UPDATE presets
    SET 
      is_for_sale = true,
      sale_price = p_sale_price,
      seller_user_id = p_seller_user_id,
      marketplace_status = 'pending_review',
      updated_at = NOW()
    WHERE id = p_preset_id;
    
    -- Create marketplace listing
    INSERT INTO preset_marketplace_listings (
      preset_id,
      seller_user_id,
      sale_price,
      marketplace_title,
      marketplace_description,
      tags,
      status
    ) VALUES (
      p_preset_id,
      p_seller_user_id,
      p_sale_price,
      p_marketplace_title,
      p_marketplace_description,
      p_tags,
      'pending_review'
    ) RETURNING id INTO v_listing_id;
    
    RETURN QUERY SELECT true, 'Listing created successfully', v_listing_id;
    
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT false, 'Failed to create listing: ' || SQLERRM, NULL::UUID;
  END;
END;
$$ LANGUAGE plpgsql;

-- Function to approve a marketplace listing (admin only)
CREATE OR REPLACE FUNCTION approve_marketplace_listing(
  p_listing_id UUID,
  p_admin_user_id UUID
) RETURNS TABLE(success BOOLEAN, message TEXT) AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  -- Check if user is admin
  SELECT EXISTS(
    SELECT 1 FROM users_profile 
    WHERE user_id = p_admin_user_id 
    AND 'ADMIN' = ANY(role_flags)
  ) INTO v_is_admin;
  
  IF NOT v_is_admin THEN
    RETURN QUERY SELECT false, 'Insufficient permissions';
    RETURN;
  END IF;
  
  -- Update listing status
  UPDATE preset_marketplace_listings
  SET 
    status = 'approved',
    approved_by = p_admin_user_id,
    approved_at = NOW(),
    updated_at = NOW()
  WHERE id = p_listing_id AND status = 'pending_review';
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Listing not found or not pending review';
    RETURN;
  END IF;
  
  -- Update preset status
  UPDATE presets
  SET marketplace_status = 'approved'
  WHERE id = (
    SELECT preset_id FROM preset_marketplace_listings WHERE id = p_listing_id
  );
  
  RETURN QUERY SELECT true, 'Listing approved successfully';
END;
$$ LANGUAGE plpgsql;

-- Function to reject a marketplace listing (admin only)
CREATE OR REPLACE FUNCTION reject_marketplace_listing(
  p_listing_id UUID,
  p_admin_user_id UUID,
  p_rejection_reason TEXT
) RETURNS TABLE(success BOOLEAN, message TEXT) AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  -- Check if user is admin
  SELECT EXISTS(
    SELECT 1 FROM users_profile 
    WHERE user_id = p_admin_user_id 
    AND 'ADMIN' = ANY(role_flags)
  ) INTO v_is_admin;
  
  IF NOT v_is_admin THEN
    RETURN QUERY SELECT false, 'Insufficient permissions';
    RETURN;
  END IF;
  
  -- Update listing status
  UPDATE preset_marketplace_listings
  SET 
    status = 'rejected',
    approved_by = p_admin_user_id,
    approved_at = NOW(),
    rejection_reason = p_rejection_reason,
    updated_at = NOW()
  WHERE id = p_listing_id AND status = 'pending_review';
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Listing not found or not pending review';
    RETURN;
  END IF;
  
  -- Update preset status
  UPDATE presets
  SET marketplace_status = 'rejected'
  WHERE id = (
    SELECT preset_id FROM preset_marketplace_listings WHERE id = p_listing_id
  );
  
  RETURN QUERY SELECT true, 'Listing rejected successfully';
END;
$$ LANGUAGE plpgsql;

-- Function to get marketplace stats for a user
CREATE OR REPLACE FUNCTION get_user_marketplace_stats(p_user_id UUID)
RETURNS TABLE(
  total_listings INTEGER,
  approved_listings INTEGER,
  pending_listings INTEGER,
  total_sales INTEGER,
  total_revenue INTEGER,
  total_purchases INTEGER,
  total_spent INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE((SELECT COUNT(*)::INTEGER FROM preset_marketplace_listings WHERE seller_user_id = p_user_id), 0),
    COALESCE((SELECT COUNT(*)::INTEGER FROM preset_marketplace_listings WHERE seller_user_id = p_user_id AND status = 'approved'), 0),
    COALESCE((SELECT COUNT(*)::INTEGER FROM preset_marketplace_listings WHERE seller_user_id = p_user_id AND status = 'pending_review'), 0),
    COALESCE((SELECT SUM(total_sales)::INTEGER FROM preset_marketplace_listings WHERE seller_user_id = p_user_id), 0),
    COALESCE((SELECT SUM(revenue_earned)::INTEGER FROM preset_marketplace_listings WHERE seller_user_id = p_user_id), 0),
    COALESCE((SELECT COUNT(*)::INTEGER FROM preset_purchases WHERE buyer_user_id = p_user_id AND payment_status = 'completed'), 0),
    COALESCE((SELECT SUM(purchase_price)::INTEGER FROM preset_purchases WHERE buyer_user_id = p_user_id AND payment_status = 'completed'), 0);
END;
$$ LANGUAGE plpgsql;

-- Function to search marketplace presets
CREATE OR REPLACE FUNCTION search_marketplace_presets(
  p_query TEXT DEFAULT '',
  p_category VARCHAR(50) DEFAULT NULL,
  p_min_price INTEGER DEFAULT NULL,
  p_max_price INTEGER DEFAULT NULL,
  p_sort_by VARCHAR(20) DEFAULT 'recent', -- 'recent', 'popular', 'price_low', 'price_high', 'rating'
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
  preset_id UUID,
  preset_name VARCHAR(100),
  preset_description TEXT,
  category VARCHAR(50),
  sale_price INTEGER,
  total_sales INTEGER,
  marketplace_title VARCHAR(150),
  marketplace_description TEXT,
  tags TEXT[],
  seller_display_name VARCHAR(255),
  seller_handle VARCHAR(50),
  average_rating DECIMAL(3,2),
  review_count INTEGER,
  created_at TIMESTAMPTZ
) AS $$
DECLARE
  v_order_clause TEXT;
BEGIN
  -- Build order clause based on sort parameter
  CASE p_sort_by
    WHEN 'popular' THEN v_order_clause := 'l.total_sales DESC, l.created_at DESC';
    WHEN 'price_low' THEN v_order_clause := 'l.sale_price ASC, l.created_at DESC';
    WHEN 'price_high' THEN v_order_clause := 'l.sale_price DESC, l.created_at DESC';
    WHEN 'rating' THEN v_order_clause := 'avg_rating DESC NULLS LAST, l.created_at DESC';
    ELSE v_order_clause := 'l.created_at DESC'; -- 'recent'
  END CASE;
  
  RETURN QUERY EXECUTE format('
    SELECT 
      p.id,
      p.name,
      p.description,
      p.category,
      l.sale_price,
      l.total_sales,
      l.marketplace_title,
      l.marketplace_description,
      l.tags,
      up.display_name,
      up.handle,
      COALESCE(AVG(r.rating), 0)::DECIMAL(3,2) as avg_rating,
      COUNT(r.id)::INTEGER as review_count,
      l.created_at
    FROM preset_marketplace_listings l
    JOIN presets p ON l.preset_id = p.id
    JOIN users_profile up ON l.seller_user_id = up.user_id
    LEFT JOIN preset_reviews r ON p.id = r.preset_id AND r.is_visible = true
    WHERE l.status = ''approved''
      AND ($1 = '''' OR (
        p.name ILIKE ''%%'' || $1 || ''%%'' 
        OR p.description ILIKE ''%%'' || $1 || ''%%''
        OR l.marketplace_title ILIKE ''%%'' || $1 || ''%%''
        OR l.marketplace_description ILIKE ''%%'' || $1 || ''%%''
      ))
      AND ($2 IS NULL OR p.category = $2)
      AND ($3 IS NULL OR l.sale_price >= $3)
      AND ($4 IS NULL OR l.sale_price <= $4)
    GROUP BY p.id, l.id, up.display_name, up.handle
    ORDER BY %s
    LIMIT $5 OFFSET $6
  ', v_order_clause)
  USING p_query, p_category, p_min_price, p_max_price, p_limit, p_offset;
END;
$$ LANGUAGE plpgsql;

-- Function to update daily marketplace analytics
CREATE OR REPLACE FUNCTION update_marketplace_analytics(p_date DATE DEFAULT CURRENT_DATE)
RETURNS VOID AS $$
DECLARE
  v_total_sales INTEGER;
  v_total_revenue INTEGER;
  v_unique_buyers INTEGER;
  v_unique_sellers INTEGER;
  v_new_listings INTEGER;
  v_approved_listings INTEGER;
  v_rejected_listings INTEGER;
  v_top_category VARCHAR(50);
  v_top_category_sales INTEGER;
BEGIN
  -- Calculate metrics for the given date
  SELECT 
    COUNT(*),
    COALESCE(SUM(purchase_price), 0),
    COUNT(DISTINCT buyer_user_id),
    COUNT(DISTINCT seller_user_id)
  INTO v_total_sales, v_total_revenue, v_unique_buyers, v_unique_sellers
  FROM preset_purchases
  WHERE DATE(purchased_at) = p_date
  AND payment_status = 'completed';
  
  -- Get listing metrics
  SELECT COUNT(*) INTO v_new_listings
  FROM preset_marketplace_listings
  WHERE DATE(created_at) = p_date;
  
  SELECT COUNT(*) INTO v_approved_listings
  FROM preset_marketplace_listings
  WHERE DATE(approved_at) = p_date AND status = 'approved';
  
  SELECT COUNT(*) INTO v_rejected_listings
  FROM preset_marketplace_listings
  WHERE DATE(approved_at) = p_date AND status = 'rejected';
  
  -- Get top category for the day
  SELECT p.category, COUNT(*) INTO v_top_category, v_top_category_sales
  FROM preset_purchases pp
  JOIN presets p ON pp.preset_id = p.id
  WHERE DATE(pp.purchased_at) = p_date
  AND pp.payment_status = 'completed'
  GROUP BY p.category
  ORDER BY COUNT(*) DESC
  LIMIT 1;
  
  -- Insert or update analytics record
  INSERT INTO marketplace_analytics (
    date,
    total_sales,
    total_revenue,
    unique_buyers,
    unique_sellers,
    new_listings,
    approved_listings,
    rejected_listings,
    top_category,
    top_category_sales
  ) VALUES (
    p_date,
    v_total_sales,
    v_total_revenue,
    v_unique_buyers,
    v_unique_sellers,
    v_new_listings,
    v_approved_listings,
    v_rejected_listings,
    v_top_category,
    v_top_category_sales
  )
  ON CONFLICT (date) DO UPDATE SET
    total_sales = EXCLUDED.total_sales,
    total_revenue = EXCLUDED.total_revenue,
    unique_buyers = EXCLUDED.unique_buyers,
    unique_sellers = EXCLUDED.unique_sellers,
    new_listings = EXCLUDED.new_listings,
    approved_listings = EXCLUDED.approved_listings,
    rejected_listings = EXCLUDED.rejected_listings,
    top_category = EXCLUDED.top_category,
    top_category_sales = EXCLUDED.top_category_sales;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION purchase_preset_with_credits(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION create_marketplace_listing(UUID, UUID, INTEGER, VARCHAR(150), TEXT, TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION approve_marketplace_listing(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION reject_marketplace_listing(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_marketplace_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION search_marketplace_presets(TEXT, VARCHAR(50), INTEGER, INTEGER, VARCHAR(20), INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION update_marketplace_analytics(DATE) TO service_role;

-- Add comments for documentation
COMMENT ON FUNCTION purchase_preset_with_credits IS 'Purchase a preset using credits with full transaction handling';
COMMENT ON FUNCTION create_marketplace_listing IS 'Create a new marketplace listing for a preset';
COMMENT ON FUNCTION approve_marketplace_listing IS 'Approve a marketplace listing (admin only)';
COMMENT ON FUNCTION reject_marketplace_listing IS 'Reject a marketplace listing with reason (admin only)';
COMMENT ON FUNCTION get_user_marketplace_stats IS 'Get marketplace statistics for a user';
COMMENT ON FUNCTION search_marketplace_presets IS 'Search and filter marketplace presets with various criteria';
COMMENT ON FUNCTION update_marketplace_analytics IS 'Update daily marketplace analytics (automated)';

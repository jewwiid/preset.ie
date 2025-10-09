-- =====================================================
-- Marketplace & Messaging Email Triggers
-- Preset purchases, gear rentals, reviews, messages
-- =====================================================

-- =====================================================
-- 1. PRESET MARKETPLACE - Purchase Notifications
-- =====================================================

-- Seller: Preset Sold
CREATE OR REPLACE FUNCTION trigger_preset_sold_email()
RETURNS TRIGGER AS $$
DECLARE
  seller_auth_id UUID;
  buyer_name TEXT;
  preset_name TEXT;
BEGIN
  -- Only trigger on completed purchases
  IF NEW.payment_status = 'completed' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'completed') THEN
    
    -- Get seller auth ID
    SELECT user_id INTO seller_auth_id
    FROM users_profile
    WHERE user_id = NEW.seller_user_id;
    
    -- Get buyer name
    SELECT display_name INTO buyer_name
    FROM users_profile
    WHERE user_id = NEW.buyer_user_id;
    
    -- Get preset name
    SELECT COALESCE(title, name) INTO preset_name
    FROM presets
    WHERE id = NEW.preset_id;
    
    PERFORM call_email_api(
      '/api/emails/marketplace/preset-sold',
      jsonb_build_object(
        'authUserId', seller_auth_id,
        'buyerName', buyer_name,
        'presetName', preset_name,
        'purchasePrice', NEW.purchase_price,
        'sellerPayout', NEW.seller_payout,
        'platformFee', NEW.platform_fee,
        'purchaseId', NEW.id
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS preset_sold_email_trigger ON preset_purchases;
CREATE TRIGGER preset_sold_email_trigger
  AFTER INSERT OR UPDATE ON preset_purchases
  FOR EACH ROW
  EXECUTE FUNCTION trigger_preset_sold_email();

-- Buyer: Preset Purchase Confirmation
CREATE OR REPLACE FUNCTION trigger_preset_purchase_confirmation_email()
RETURNS TRIGGER AS $$
DECLARE
  buyer_auth_id UUID;
  preset_name TEXT;
  seller_name TEXT;
BEGIN
  IF NEW.payment_status = 'completed' THEN
    
    SELECT user_id INTO buyer_auth_id
    FROM users_profile
    WHERE user_id = NEW.buyer_user_id;
    
    SELECT display_name INTO seller_name
    FROM users_profile
    WHERE user_id = NEW.seller_user_id;
    
    SELECT COALESCE(title, name) INTO preset_name
    FROM presets
    WHERE id = NEW.preset_id;
    
    PERFORM call_email_api(
      '/api/emails/marketplace/preset-purchased',
      jsonb_build_object(
        'authUserId', buyer_auth_id,
        'presetName', preset_name,
        'sellerName', seller_name,
        'purchasePrice', NEW.purchase_price,
        'purchaseId', NEW.id,
        'presetId', NEW.preset_id
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS preset_purchase_confirmation_trigger ON preset_purchases;
CREATE TRIGGER preset_purchase_confirmation_trigger
  AFTER INSERT ON preset_purchases
  FOR EACH ROW
  EXECUTE FUNCTION trigger_preset_purchase_confirmation_email();

-- =====================================================
-- 2. PRESET MARKETPLACE - Listing Approval/Rejection
-- =====================================================

CREATE OR REPLACE FUNCTION trigger_preset_listing_status_email()
RETURNS TRIGGER AS $$
DECLARE
  seller_auth_id UUID;
  preset_name TEXT;
BEGIN
  -- Only trigger when status changes
  IF NEW.status != OLD.status THEN
    
    SELECT user_id INTO seller_auth_id
    FROM users_profile
    WHERE user_id = NEW.seller_user_id;
    
    SELECT COALESCE(title, name) INTO preset_name
    FROM presets
    WHERE id = NEW.preset_id;
    
    -- Approved
    IF NEW.status = 'approved' AND OLD.status = 'pending_review' THEN
      PERFORM call_email_api(
        '/api/emails/marketplace/listing-approved',
        jsonb_build_object(
          'authUserId', seller_auth_id,
          'presetName', preset_name,
          'listingTitle', NEW.marketplace_title,
          'salePrice', NEW.sale_price,
          'listingId', NEW.id
        )
      );
    
    -- Rejected
    ELSIF NEW.status = 'rejected' THEN
      PERFORM call_email_api(
        '/api/emails/marketplace/listing-rejected',
        jsonb_build_object(
          'authUserId', seller_auth_id,
          'presetName', preset_name,
          'listingTitle', NEW.marketplace_title,
          'rejectionReason', NEW.rejection_reason,
          'listingId', NEW.id
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS preset_listing_status_trigger ON preset_marketplace_listings;
CREATE TRIGGER preset_listing_status_trigger
  AFTER UPDATE ON preset_marketplace_listings
  FOR EACH ROW
  EXECUTE FUNCTION trigger_preset_listing_status_email();

-- =====================================================
-- 3. PRESET MARKETPLACE - Reviews
-- =====================================================

CREATE OR REPLACE FUNCTION trigger_preset_review_received_email()
RETURNS TRIGGER AS $$
DECLARE
  seller_auth_id UUID;
  reviewer_name TEXT;
  preset_name TEXT;
  purchase_record RECORD;
BEGIN
  -- Get purchase details
  SELECT * INTO purchase_record
  FROM preset_purchases
  WHERE id = NEW.purchase_id;
  
  -- Get seller auth ID
  SELECT user_id INTO seller_auth_id
  FROM users_profile
  WHERE user_id = purchase_record.seller_user_id;
  
  -- Get reviewer name
  SELECT display_name INTO reviewer_name
  FROM users_profile
  WHERE user_id = NEW.reviewer_user_id;
  
  -- Get preset name
  SELECT COALESCE(title, name) INTO preset_name
  FROM presets
  WHERE id = NEW.preset_id;
  
  PERFORM call_email_api(
    '/api/emails/marketplace/review-received',
    jsonb_build_object(
      'authUserId', seller_auth_id,
      'reviewerName', reviewer_name,
      'presetName', preset_name,
      'rating', NEW.rating,
      'reviewTitle', NEW.title,
      'reviewComment', NEW.comment,
      'reviewId', NEW.id
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS preset_review_received_trigger ON preset_reviews;
CREATE TRIGGER preset_review_received_trigger
  AFTER INSERT ON preset_reviews
  FOR EACH ROW
  EXECUTE FUNCTION trigger_preset_review_received_email();

-- =====================================================
-- 4. PRESET MARKETPLACE - Preset Used in Project
-- =====================================================

-- If you have preset_usage table
-- CREATE OR REPLACE FUNCTION trigger_preset_used_email()
-- RETURNS TRIGGER AS $$
-- DECLARE
--   creator_auth_id UUID;
--   user_name TEXT;
--   preset_name TEXT;
-- BEGIN
--   SELECT user_id INTO creator_auth_id
--   FROM users_profile up
--   JOIN presets p ON p.seller_user_id = up.user_id
--   WHERE p.id = NEW.preset_id;
--   
--   SELECT display_name INTO user_name
--   FROM users_profile
--   WHERE user_id = NEW.user_id;
--   
--   SELECT COALESCE(title, name) INTO preset_name
--   FROM presets
--   WHERE id = NEW.preset_id;
--   
--   PERFORM call_email_api(
--     '/api/emails/marketplace/preset-used',
--     jsonb_build_object(
--       'authUserId', creator_auth_id,
--       'userName', user_name,
--       'presetName', preset_name,
--       'usageCount', (SELECT COUNT(*) FROM preset_usage WHERE preset_id = NEW.preset_id)
--     )
--   );
--   
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. MESSAGING - New Message Received
-- =====================================================

CREATE OR REPLACE FUNCTION trigger_message_received_email()
RETURNS TRIGGER AS $$
DECLARE
  recipient_auth_id UUID;
  sender_name TEXT;
  sender_avatar TEXT;
  gig_title TEXT;
  message_preview TEXT;
BEGIN
  -- Get recipient auth ID
  SELECT user_id INTO recipient_auth_id
  FROM users_profile
  WHERE id = NEW.to_user_id;
  
  -- Get sender details
  SELECT display_name, avatar_url INTO sender_name, sender_avatar
  FROM users_profile
  WHERE id = NEW.from_user_id;
  
  -- Get gig context
  SELECT title INTO gig_title
  FROM gigs
  WHERE id = NEW.gig_id;
  
  -- Create message preview
  message_preview := substring(NEW.body, 1, 100);
  IF length(NEW.body) > 100 THEN
    message_preview := message_preview || '...';
  END IF;
  
  PERFORM call_email_api(
    '/api/emails/messaging/new-message',
    jsonb_build_object(
      'authUserId', recipient_auth_id,
      'senderName', sender_name,
      'senderAvatar', sender_avatar,
      'gigTitle', gig_title,
      'messagePreview', message_preview,
      'messageId', NEW.id,
      'gigId', NEW.gig_id,
      'hasAttachments', (NEW.attachments IS NOT NULL AND jsonb_array_length(NEW.attachments) > 0)
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS message_received_email_trigger ON messages;
CREATE TRIGGER message_received_email_trigger
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION trigger_message_received_email();

-- =====================================================
-- 6. MESSAGING - Unread Messages Digest (Scheduled)
-- =====================================================

CREATE OR REPLACE FUNCTION send_unread_messages_digest()
RETURNS void AS $$
DECLARE
  user_record RECORD;
  unread_count INTEGER;
  unread_messages JSONB;
BEGIN
  -- Find users with unread messages
  FOR user_record IN
    SELECT DISTINCT 
      up.user_id,
      up.display_name
    FROM users_profile up
    WHERE EXISTS (
      SELECT 1 
      FROM messages m
      WHERE m.to_user_id = up.id
      AND m.read_at IS NULL
      AND m.created_at >= NOW() - INTERVAL '24 hours'
    )
  LOOP
    -- Count unread messages
    SELECT COUNT(*) INTO unread_count
    FROM messages m
    JOIN users_profile up ON m.to_user_id = up.id
    WHERE up.user_id = user_record.user_id
    AND m.read_at IS NULL;
    
    -- Get unread message previews (max 5)
    SELECT json_agg(
      json_build_object(
        'senderName', sender.display_name,
        'gigTitle', g.title,
        'preview', substring(m.body, 1, 50),
        'sentAt', m.created_at
      )
    ) INTO unread_messages
    FROM messages m
    JOIN users_profile sender ON m.from_user_id = sender.id
    JOIN users_profile recipient ON m.to_user_id = recipient.id
    JOIN gigs g ON m.gig_id = g.id
    WHERE recipient.user_id = user_record.user_id
    AND m.read_at IS NULL
    ORDER BY m.created_at DESC
    LIMIT 5;
    
    -- Send digest
    PERFORM call_email_api(
      '/api/emails/messaging/unread-digest',
      jsonb_build_object(
        'authUserId', user_record.user_id,
        'name', user_record.display_name,
        'unreadCount', unread_count,
        'messages', unread_messages
      )
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule: Twice daily (9 AM and 5 PM)
-- SELECT cron.schedule('unread-messages-digest', '0 9,17 * * *', 'SELECT send_unread_messages_digest()');

-- =====================================================
-- 7. EQUIPMENT/GEAR RENTAL (if tables exist)
-- =====================================================

-- CREATE OR REPLACE FUNCTION trigger_gear_rental_request_email()
-- RETURNS TRIGGER AS $$
-- DECLARE
--   owner_auth_id UUID;
--   requester_name TEXT;
--   equipment_name TEXT;
-- BEGIN
--   -- Get owner details
--   SELECT user_id INTO owner_auth_id
--   FROM users_profile up
--   JOIN equipment_listings el ON el.owner_user_id = up.id
--   WHERE el.id = NEW.listing_id;
--   
--   -- Get requester name
--   SELECT display_name INTO requester_name
--   FROM users_profile
--   WHERE id = NEW.requester_user_id;
--   
--   -- Get equipment name
--   SELECT name INTO equipment_name
--   FROM equipment_listings
--   WHERE id = NEW.listing_id;
--   
--   PERFORM call_email_api(
--     '/api/emails/marketplace/gear-rental-request',
--     jsonb_build_object(
--       'authUserId', owner_auth_id,
--       'requesterName', requester_name,
--       'equipmentName', equipment_name,
--       'startDate', NEW.start_date,
--       'endDate', NEW.end_date,
--       'requestId', NEW.id
--     )
--   );
--   
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 8. MARKETPLACE MILESTONES (Scheduled)
-- =====================================================

CREATE OR REPLACE FUNCTION send_marketplace_milestones()
RETURNS void AS $$
DECLARE
  seller_record RECORD;
BEGIN
  -- Find sellers who just hit sales milestones (10, 50, 100, 500 sales)
  FOR seller_record IN
    SELECT 
      p.seller_user_id,
      up.user_id as auth_user_id,
      up.display_name,
      COUNT(pp.id) as total_sales,
      SUM(pp.seller_payout) as total_revenue
    FROM preset_purchases pp
    JOIN presets p ON pp.preset_id = p.id
    JOIN users_profile up ON p.seller_user_id = up.user_id
    WHERE pp.payment_status = 'completed'
    GROUP BY p.seller_user_id, up.user_id, up.display_name
    HAVING COUNT(pp.id) IN (10, 50, 100, 500, 1000)
  LOOP
    PERFORM call_email_api(
      '/api/emails/marketplace/sales-milestone',
      jsonb_build_object(
        'authUserId', seller_record.auth_user_id,
        'name', seller_record.display_name,
        'totalSales', seller_record.total_sales,
        'totalRevenue', seller_record.total_revenue
      )
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule: Daily at 10 AM
-- SELECT cron.schedule('marketplace-milestones', '0 10 * * *', 'SELECT send_marketplace_milestones()');

-- =====================================================
-- Comments
-- =====================================================

COMMENT ON FUNCTION trigger_preset_sold_email IS 'Notifies seller when their preset is purchased';
COMMENT ON FUNCTION trigger_preset_purchase_confirmation_email IS 'Sends purchase confirmation to buyer';
COMMENT ON FUNCTION trigger_preset_listing_status_email IS 'Notifies seller of listing approval/rejection';
COMMENT ON FUNCTION trigger_preset_review_received_email IS 'Notifies seller when preset is reviewed';
COMMENT ON FUNCTION trigger_message_received_email IS 'Notifies recipient of new message';
COMMENT ON FUNCTION send_unread_messages_digest IS 'Sends digest of unread messages twice daily';
COMMENT ON FUNCTION send_marketplace_milestones IS 'Celebrates sales milestones';


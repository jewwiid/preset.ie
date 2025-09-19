-- =====================================================
-- Add Marketplace Review Notifications
-- =====================================================
-- Creates notification triggers for marketplace reviews
-- to notify users when they receive reviews

-- =====================================================
-- Review Notification Function
-- =====================================================

CREATE OR REPLACE FUNCTION trigger_marketplace_review_notification()
RETURNS TRIGGER AS $$
DECLARE
    v_author_name TEXT;
    v_order_type TEXT;
    v_title TEXT;
    v_message TEXT;
BEGIN
    -- Get author name
    SELECT display_name INTO v_author_name
    FROM users_profile
    WHERE id = NEW.author_id;
    
    -- Get order type for context
    v_order_type := CASE NEW.order_type 
        WHEN 'rent' THEN 'rental'
        WHEN 'sale' THEN 'sale'
        ELSE 'transaction'
    END;
    
    -- Create notification for the user who received the review
    PERFORM create_marketplace_notification(
        NEW.subject_user_id,  -- recipient_id
        'review_received',    -- type
        'You received a new review',  -- title
        COALESCE(v_author_name, 'Someone') || ' left you a ' || NEW.rating || '-star review for your ' || v_order_type,  -- message
        NULL,  -- avatar_url
        '/marketplace/reviews',  -- action_url
        jsonb_build_object('review_id', NEW.id, 'order_type', NEW.order_type, 'rating', NEW.rating),  -- action_data
        NEW.author_id,  -- sender_id
        NULL,  -- listing_id
        NULL,  -- rental_order_id
        NULL,  -- sale_order_id
        NULL,  -- offer_id
        NEW.id  -- review_id
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Review Notification Trigger
-- =====================================================

CREATE TRIGGER marketplace_review_notification_trigger
    AFTER INSERT ON marketplace_reviews
    FOR EACH ROW
    EXECUTE FUNCTION trigger_marketplace_review_notification();

-- =====================================================
-- Review Response Notification Function
-- =====================================================

CREATE OR REPLACE FUNCTION trigger_marketplace_review_response_notification()
RETURNS TRIGGER AS $$
DECLARE
    v_subject_name TEXT;
BEGIN
    -- Only notify if response was added or updated
    IF (OLD.response IS NULL AND NEW.response IS NOT NULL) OR 
       (OLD.response IS NOT NULL AND NEW.response IS NOT NULL AND OLD.response != NEW.response) THEN
        
        -- Get subject user name
        SELECT display_name INTO v_subject_name
        FROM users_profile
        WHERE id = NEW.subject_user_id;
        
        -- Notify the original reviewer about the response
        PERFORM create_marketplace_notification(
            NEW.author_id,  -- recipient_id
            'review_updated',  -- type
            'Your review received a response',  -- title
            COALESCE(v_subject_name, 'The user') || ' responded to your review',  -- message
            NULL,  -- avatar_url
            '/marketplace/reviews',  -- action_url
            jsonb_build_object('review_id', NEW.id, 'order_type', NEW.order_type, 'rating', NEW.rating),  -- action_data
            NEW.subject_user_id,  -- sender_id
            NULL,  -- listing_id
            NULL,  -- rental_order_id
            NULL,  -- sale_order_id
            NULL,  -- offer_id
            NEW.id  -- review_id
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Review Response Notification Trigger
-- =====================================================

CREATE TRIGGER marketplace_review_response_notification_trigger
    AFTER UPDATE ON marketplace_reviews
    FOR EACH ROW
    EXECUTE FUNCTION trigger_marketplace_review_response_notification();

-- =====================================================
-- Success Message
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Marketplace Review Notifications Added!';
    RAISE NOTICE '🔔 Created: review_received notification trigger';
    RAISE NOTICE '💬 Created: review_updated notification trigger';
    RAISE NOTICE '🎯 Ready for: Marketplace review notifications';
END $$;

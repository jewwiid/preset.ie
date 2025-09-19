-- =====================================================
-- Marketplace Notifications Extension
-- =====================================================
-- Extends the existing notification system to support
-- marketplace-specific events and notifications

-- =====================================================
-- Extend Notifications Table for Marketplace
-- =====================================================

-- Add marketplace-specific columns to notifications table
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS related_listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS related_rental_order_id UUID REFERENCES rental_orders(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS related_sale_order_id UUID REFERENCES sale_orders(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS related_offer_id UUID REFERENCES offers(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS related_review_id UUID REFERENCES marketplace_reviews(id) ON DELETE CASCADE;

-- =====================================================
-- Marketplace Notification Types
-- =====================================================

-- Add marketplace-specific notification categories
-- These will be used in the application layer to categorize notifications

-- Marketplace notification types:
-- 'listing_created' - New listing created
-- 'listing_updated' - Listing updated
-- 'listing_inquiry' - Someone inquired about a listing
-- 'offer_received' - Received an offer for a listing
-- 'offer_accepted' - Offer was accepted
-- 'offer_declined' - Offer was declined
-- 'offer_expired' - Offer expired
-- 'rental_request' - Rental request received
-- 'rental_confirmed' - Rental confirmed
-- 'rental_cancelled' - Rental cancelled
-- 'rental_completed' - Rental completed
-- 'sale_request' - Sale request received
-- 'sale_confirmed' - Sale confirmed
-- 'sale_cancelled' - Sale cancelled
-- 'sale_completed' - Sale completed
-- 'payment_received' - Payment received
-- 'payment_failed' - Payment failed
-- 'review_received' - Review received
-- 'review_updated' - Review updated
-- 'dispute_opened' - Dispute opened
-- 'dispute_resolved' - Dispute resolved

-- =====================================================
-- Marketplace Notification Preferences
-- =====================================================

-- Add marketplace-specific preferences to notification_preferences table
ALTER TABLE notification_preferences 
ADD COLUMN IF NOT EXISTS marketplace_notifications BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS listing_notifications BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS offer_notifications BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS order_notifications BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS payment_notifications BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS review_notifications BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS dispute_notifications BOOLEAN DEFAULT TRUE;

-- =====================================================
-- Marketplace Notification Functions
-- =====================================================

-- Function to create marketplace notifications
CREATE OR REPLACE FUNCTION create_marketplace_notification(
    p_recipient_id UUID,
    p_type VARCHAR(50),
    p_title VARCHAR(255),
    p_message TEXT DEFAULT NULL,
    p_avatar_url TEXT DEFAULT NULL,
    p_action_url TEXT DEFAULT NULL,
    p_action_data JSONB DEFAULT NULL,
    p_sender_id UUID DEFAULT NULL,
    p_listing_id UUID DEFAULT NULL,
    p_rental_order_id UUID DEFAULT NULL,
    p_sale_order_id UUID DEFAULT NULL,
    p_offer_id UUID DEFAULT NULL,
    p_review_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_notification_id UUID;
    v_category VARCHAR(20);
BEGIN
    -- Determine category based on notification type
    CASE p_type
        WHEN 'listing_created', 'listing_updated', 'listing_inquiry' THEN
            v_category := 'marketplace';
        WHEN 'offer_received', 'offer_accepted', 'offer_declined', 'offer_expired' THEN
            v_category := 'marketplace';
        WHEN 'rental_request', 'rental_confirmed', 'rental_cancelled', 'rental_completed' THEN
            v_category := 'marketplace';
        WHEN 'sale_request', 'sale_confirmed', 'sale_cancelled', 'sale_completed' THEN
            v_category := 'marketplace';
        WHEN 'payment_received', 'payment_failed' THEN
            v_category := 'marketplace';
        WHEN 'review_received', 'review_updated' THEN
            v_category := 'marketplace';
        WHEN 'dispute_opened', 'dispute_resolved' THEN
            v_category := 'marketplace';
        ELSE
            v_category := 'system';
    END CASE;

    -- Check if user has marketplace notifications enabled
    IF NOT EXISTS (
        SELECT 1 FROM notification_preferences 
        WHERE user_id = p_recipient_id 
        AND marketplace_notifications = true
    ) THEN
        -- User has disabled marketplace notifications, don't create notification
        RETURN NULL;
    END IF;

    -- Create the notification
    INSERT INTO notifications (
        recipient_id,
        type,
        category,
        title,
        message,
        avatar_url,
        action_url,
        action_data,
        sender_id,
        related_listing_id,
        related_rental_order_id,
        related_sale_order_id,
        related_offer_id,
        related_review_id,
        delivered_in_app,
        created_at
    ) VALUES (
        p_recipient_id,
        p_type,
        v_category,
        p_title,
        p_message,
        p_avatar_url,
        p_action_url,
        p_action_data,
        p_sender_id,
        p_listing_id,
        p_rental_order_id,
        p_sale_order_id,
        p_offer_id,
        p_review_id,
        true, -- Marketplace notifications are always delivered in-app
        NOW()
    ) RETURNING id INTO v_notification_id;

    RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create listing-related notifications
CREATE OR REPLACE FUNCTION notify_listing_event(
    p_listing_id UUID,
    p_event_type VARCHAR(50),
    p_recipient_id UUID,
    p_sender_id UUID DEFAULT NULL,
    p_custom_message TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_notification_id UUID;
    v_listing_title TEXT;
    v_sender_name TEXT;
    v_title TEXT;
    v_message TEXT;
BEGIN
    -- Get listing title
    SELECT title INTO v_listing_title
    FROM listings
    WHERE id = p_listing_id;

    -- Get sender name if provided
    IF p_sender_id IS NOT NULL THEN
        SELECT display_name INTO v_sender_name
        FROM users_profile
        WHERE user_id = p_sender_id;
    END IF;

    -- Generate title and message based on event type
    CASE p_event_type
        WHEN 'listing_inquiry' THEN
            v_title := 'New inquiry about your listing';
            v_message := COALESCE(p_custom_message, 
                CASE 
                    WHEN v_sender_name IS NOT NULL 
                    THEN v_sender_name || ' is interested in "' || v_listing_title || '"'
                    ELSE 'Someone is interested in "' || v_listing_title || '"'
                END
            );
        WHEN 'offer_received' THEN
            v_title := 'New offer received';
            v_message := COALESCE(p_custom_message,
                CASE 
                    WHEN v_sender_name IS NOT NULL 
                    THEN v_sender_name || ' made an offer on "' || v_listing_title || '"'
                    ELSE 'You received an offer on "' || v_listing_title || '"'
                END
            );
        WHEN 'rental_request' THEN
            v_title := 'Rental request received';
            v_message := COALESCE(p_custom_message,
                CASE 
                    WHEN v_sender_name IS NOT NULL 
                    THEN v_sender_name || ' wants to rent "' || v_listing_title || '"'
                    ELSE 'You received a rental request for "' || v_listing_title || '"'
                END
            );
        WHEN 'sale_request' THEN
            v_title := 'Sale request received';
            v_message := COALESCE(p_custom_message,
                CASE 
                    WHEN v_sender_name IS NOT NULL 
                    THEN v_sender_name || ' wants to buy "' || v_listing_title || '"'
                    ELSE 'You received a sale request for "' || v_listing_title || '"'
                END
            );
        ELSE
            v_title := 'Marketplace update';
            v_message := COALESCE(p_custom_message, 'Update regarding "' || v_listing_title || '"');
    END CASE;

    -- Create notification
    SELECT create_marketplace_notification(
        p_recipient_id,
        p_event_type,
        v_title,
        v_message,
        NULL, -- avatar_url
        '/marketplace/listings/' || p_listing_id, -- action_url
        jsonb_build_object('listing_id', p_listing_id, 'event_type', p_event_type), -- action_data
        p_sender_id,
        p_listing_id,
        NULL, -- rental_order_id
        NULL, -- sale_order_id
        NULL, -- offer_id
        NULL  -- review_id
    ) INTO v_notification_id;

    RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create order-related notifications
CREATE OR REPLACE FUNCTION notify_order_event(
    p_order_id UUID,
    p_order_type VARCHAR(20), -- 'rental' or 'sale'
    p_event_type VARCHAR(50),
    p_recipient_id UUID,
    p_custom_message TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_notification_id UUID;
    v_listing_title TEXT;
    v_title TEXT;
    v_message TEXT;
    v_action_url TEXT;
BEGIN
    -- Get listing title from order
    IF p_order_type = 'rental' THEN
        SELECT l.title INTO v_listing_title
        FROM rental_orders ro
        JOIN listings l ON l.id = ro.listing_id
        WHERE ro.id = p_order_id;
        
        v_action_url := '/marketplace/orders?tab=rental';
    ELSE
        SELECT l.title INTO v_listing_title
        FROM sale_orders so
        JOIN listings l ON l.id = so.listing_id
        WHERE so.id = p_order_id;
        
        v_action_url := '/marketplace/orders?tab=sale';
    END IF;

    -- Generate title and message based on event type
    CASE p_event_type
        WHEN 'rental_confirmed', 'sale_confirmed' THEN
            v_title := 'Order confirmed';
            v_message := COALESCE(p_custom_message, 'Your order for "' || v_listing_title || '" has been confirmed');
        WHEN 'rental_cancelled', 'sale_cancelled' THEN
            v_title := 'Order cancelled';
            v_message := COALESCE(p_custom_message, 'Your order for "' || v_listing_title || '" has been cancelled');
        WHEN 'rental_completed', 'sale_completed' THEN
            v_title := 'Order completed';
            v_message := COALESCE(p_custom_message, 'Your order for "' || v_listing_title || '" has been completed');
        WHEN 'payment_received' THEN
            v_title := 'Payment received';
            v_message := COALESCE(p_custom_message, 'Payment received for "' || v_listing_title || '"');
        WHEN 'payment_failed' THEN
            v_title := 'Payment failed';
            v_message := COALESCE(p_custom_message, 'Payment failed for "' || v_listing_title || '"');
        ELSE
            v_title := 'Order update';
            v_message := COALESCE(p_custom_message, 'Update regarding your order for "' || v_listing_title || '"');
    END CASE;

    -- Create notification
    IF p_order_type = 'rental' THEN
        SELECT create_marketplace_notification(
            p_recipient_id,
            p_event_type,
            v_title,
            v_message,
            NULL, -- avatar_url
            v_action_url,
            jsonb_build_object('order_id', p_order_id, 'order_type', p_order_type, 'event_type', p_event_type),
            NULL, -- sender_id
            NULL, -- listing_id
            p_order_id, -- rental_order_id
            NULL, -- sale_order_id
            NULL, -- offer_id
            NULL  -- review_id
        ) INTO v_notification_id;
    ELSE
        SELECT create_marketplace_notification(
            p_recipient_id,
            p_event_type,
            v_title,
            v_message,
            NULL, -- avatar_url
            v_action_url,
            jsonb_build_object('order_id', p_order_id, 'order_type', p_order_type, 'event_type', p_event_type),
            NULL, -- sender_id
            NULL, -- listing_id
            NULL, -- rental_order_id
            p_order_id, -- sale_order_id
            NULL, -- offer_id
            NULL  -- review_id
        ) INTO v_notification_id;
    END IF;

    RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Marketplace Notification Triggers
-- =====================================================

-- Trigger to notify when a new offer is created
CREATE OR REPLACE FUNCTION trigger_offer_notification()
RETURNS TRIGGER AS $$
BEGIN
    -- Notify the listing owner about the new offer
    PERFORM notify_listing_event(
        NEW.listing_id,
        'offer_received',
        NEW.to_user,
        NEW.from_user,
        'You received a new offer for your listing'
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER offer_notification_trigger
    AFTER INSERT ON offers
    FOR EACH ROW
    EXECUTE FUNCTION trigger_offer_notification();

-- Trigger to notify when an offer is accepted/declined
CREATE OR REPLACE FUNCTION trigger_offer_response_notification()
RETURNS TRIGGER AS $$
BEGIN
    -- Only notify if status changed
    IF OLD.status != NEW.status THEN
        CASE NEW.status
            WHEN 'accepted' THEN
                PERFORM notify_listing_event(
                    NEW.listing_id,
                    'offer_accepted',
                    NEW.from_user,
                    NEW.to_user,
                    'Your offer was accepted!'
                );
            WHEN 'declined' THEN
                PERFORM notify_listing_event(
                    NEW.listing_id,
                    'offer_declined',
                    NEW.from_user,
                    NEW.to_user,
                    'Your offer was declined'
                );
        END CASE;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER offer_response_notification_trigger
    AFTER UPDATE ON offers
    FOR EACH ROW
    EXECUTE FUNCTION trigger_offer_response_notification();

-- Trigger to notify when a rental order is created
CREATE OR REPLACE FUNCTION trigger_rental_order_notification()
RETURNS TRIGGER AS $$
BEGIN
    -- Notify the listing owner about the rental request
    PERFORM notify_listing_event(
        NEW.listing_id,
        'rental_request',
        NEW.owner_id,
        NEW.renter_id,
        'You received a rental request'
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER rental_order_notification_trigger
    AFTER INSERT ON rental_orders
    FOR EACH ROW
    EXECUTE FUNCTION trigger_rental_order_notification();

-- Trigger to notify when a sale order is created
CREATE OR REPLACE FUNCTION trigger_sale_order_notification()
RETURNS TRIGGER AS $$
BEGIN
    -- Notify the listing owner about the sale request
    PERFORM notify_listing_event(
        NEW.listing_id,
        'sale_request',
        NEW.owner_id,
        NEW.buyer_id,
        'You received a sale request'
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER sale_order_notification_trigger
    AFTER INSERT ON sale_orders
    FOR EACH ROW
    EXECUTE FUNCTION trigger_sale_order_notification();

-- Trigger to notify when order status changes
CREATE OR REPLACE FUNCTION trigger_order_status_notification()
RETURNS TRIGGER AS $$
BEGIN
    -- Only notify if status changed
    IF OLD.status != NEW.status THEN
        -- Notify both owner and renter/buyer
        PERFORM notify_order_event(
            NEW.id,
            'rental',
            NEW.status,
            NEW.owner_id,
            'Order status updated'
        );
        
        PERFORM notify_order_event(
            NEW.id,
            'rental',
            NEW.status,
            NEW.renter_id,
            'Order status updated'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER rental_order_status_notification_trigger
    AFTER UPDATE ON rental_orders
    FOR EACH ROW
    EXECUTE FUNCTION trigger_order_status_notification();

CREATE TRIGGER sale_order_status_notification_trigger
    AFTER UPDATE ON sale_orders
    FOR EACH ROW
    EXECUTE FUNCTION trigger_order_status_notification();

-- =====================================================
-- Indexes for Marketplace Notifications
-- =====================================================

-- Index for marketplace-related notifications
CREATE INDEX IF NOT EXISTS idx_notifications_marketplace_listing 
    ON notifications(related_listing_id) WHERE related_listing_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_marketplace_rental_order 
    ON notifications(related_rental_order_id) WHERE related_rental_order_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_marketplace_sale_order 
    ON notifications(related_sale_order_id) WHERE related_sale_order_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_marketplace_offer 
    ON notifications(related_offer_id) WHERE related_offer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_marketplace_review 
    ON notifications(related_review_id) WHERE related_review_id IS NOT NULL;

-- =====================================================
-- Grant Permissions
-- =====================================================

GRANT EXECUTE ON FUNCTION create_marketplace_notification TO authenticated;
GRANT EXECUTE ON FUNCTION notify_listing_event TO authenticated;
GRANT EXECUTE ON FUNCTION notify_order_event TO authenticated;

-- =====================================================
-- Comments for Documentation
-- =====================================================

COMMENT ON COLUMN notifications.related_listing_id IS 'References marketplace listing for listing-related notifications';
COMMENT ON COLUMN notifications.related_rental_order_id IS 'References rental order for order-related notifications';
COMMENT ON COLUMN notifications.related_sale_order_id IS 'References sale order for order-related notifications';
COMMENT ON COLUMN notifications.related_offer_id IS 'References offer for offer-related notifications';
COMMENT ON COLUMN notifications.related_review_id IS 'References marketplace review for review-related notifications';

COMMENT ON FUNCTION create_marketplace_notification IS 'Creates marketplace-specific notifications with proper categorization and preference checking';
COMMENT ON FUNCTION notify_listing_event IS 'Creates notifications for listing-related events (inquiries, offers, requests)';
COMMENT ON FUNCTION notify_order_event IS 'Creates notifications for order-related events (confirmations, cancellations, payments)';

-- =====================================================
-- Success Message
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Marketplace Notifications Extension Complete!';
    RAISE NOTICE '📊 Extended: notifications table with marketplace columns';
    RAISE NOTICE '⚙️  Created: marketplace notification functions';
    RAISE NOTICE '🔔 Added: automatic notification triggers';
    RAISE NOTICE '🎯 Ready for: Marketplace event notifications';
END $$;

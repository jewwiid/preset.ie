-- =====================================================
-- Preset Notification System - Phase 2 Implementation
-- =====================================================
-- Creates comprehensive notification infrastructure for
-- platform events, user engagement, and multi-channel delivery

-- =====================================================
-- Core Notifications Table
-- =====================================================

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Content
    type VARCHAR(50) NOT NULL, -- 'gig_published', 'application_received', etc.
    category VARCHAR(20) NOT NULL, -- 'gig', 'application', 'message', 'system'
    title VARCHAR(255) NOT NULL,
    message TEXT,
    
    -- Rich Content
    avatar_url TEXT,
    thumbnail_url TEXT,
    action_url TEXT,
    action_data JSONB, -- Flexible data for actions
    
    -- Relationships
    sender_id UUID REFERENCES auth.users(id),
    related_gig_id UUID REFERENCES gigs(id),
    related_application_id UUID REFERENCES applications(id),
    
    -- State
    read_at TIMESTAMPTZ,
    dismissed_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    
    -- Delivery Tracking
    delivered_push BOOLEAN DEFAULT FALSE,
    delivered_email BOOLEAN DEFAULT FALSE,
    delivered_in_app BOOLEAN DEFAULT FALSE,
    
    -- Scheduling
    scheduled_for TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Notification Preferences Table
-- =====================================================

CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Channel Controls
    email_enabled BOOLEAN DEFAULT TRUE,
    push_enabled BOOLEAN DEFAULT TRUE,
    in_app_enabled BOOLEAN DEFAULT TRUE,
    
    -- Category Controls (integrates with existing user_settings)
    gig_notifications BOOLEAN DEFAULT TRUE,
    application_notifications BOOLEAN DEFAULT TRUE,
    message_notifications BOOLEAN DEFAULT TRUE,
    booking_notifications BOOLEAN DEFAULT TRUE,
    system_notifications BOOLEAN DEFAULT TRUE,
    marketing_notifications BOOLEAN DEFAULT FALSE,
    
    -- Delivery Timing
    digest_frequency VARCHAR(20) DEFAULT 'real-time', -- 'real-time', 'hourly', 'daily', 'weekly'
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    timezone VARCHAR(50) DEFAULT 'UTC',
    
    -- Mobile Specific
    badge_count_enabled BOOLEAN DEFAULT TRUE,
    sound_enabled BOOLEAN DEFAULT TRUE,
    vibration_enabled BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- =====================================================
-- Indexes for Performance
-- =====================================================

-- Index for getting unread notifications for a user
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_unread 
    ON notifications(recipient_id, read_at) WHERE read_at IS NULL;

-- Index for scheduled notifications processing
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled 
    ON notifications(scheduled_for) WHERE delivered_at IS NULL;

-- Index for filtering by category and creation time
CREATE INDEX IF NOT EXISTS idx_notifications_category 
    ON notifications(category, created_at);

-- Index for delivery tracking queries
CREATE INDEX IF NOT EXISTS idx_notifications_delivery 
    ON notifications(delivered_in_app, delivered_email, delivered_push, created_at);

-- Index for related entity lookups
CREATE INDEX IF NOT EXISTS idx_notifications_related_gig 
    ON notifications(related_gig_id) WHERE related_gig_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_related_application 
    ON notifications(related_application_id) WHERE related_application_id IS NOT NULL;

-- User preferences lookup index
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id 
    ON notification_preferences(user_id);

-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (auth.uid() = recipient_id);

-- Users can update their own notification states (mark as read, dismissed)
CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = recipient_id);

-- System/authenticated services can create notifications
CREATE POLICY "System can create notifications" ON notifications
    FOR INSERT WITH CHECK (true);

-- System can update notifications for delivery tracking
CREATE POLICY "System can update delivery status" ON notifications
    FOR UPDATE USING (true);

-- Users can access their own notification preferences
CREATE POLICY "Users can access own preferences" ON notification_preferences
    FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- Utility Functions
-- =====================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_notifications_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at
    BEFORE UPDATE ON notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Default Preferences for New Users
-- =====================================================

-- Function to create default notification preferences for new users
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notification_preferences (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create default preferences for new users
CREATE TRIGGER create_notification_preferences_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_default_notification_preferences();

-- =====================================================
-- Notification Cleanup Functions
-- =====================================================

-- Function to clean up old notifications (older than 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM notifications 
    WHERE created_at < NOW() - INTERVAL '90 days'
    AND (read_at IS NOT NULL OR dismissed_at IS NOT NULL);
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Notification Analytics Views
-- =====================================================

-- View for notification delivery stats
CREATE OR REPLACE VIEW notification_delivery_stats AS
SELECT 
    DATE_TRUNC('day', created_at) as date,
    category,
    COUNT(*) as total_sent,
    COUNT(*) FILTER (WHERE delivered_in_app = true) as delivered_in_app,
    COUNT(*) FILTER (WHERE delivered_email = true) as delivered_email,
    COUNT(*) FILTER (WHERE delivered_push = true) as delivered_push,
    COUNT(*) FILTER (WHERE read_at IS NOT NULL) as read_count,
    AVG(EXTRACT(EPOCH FROM (read_at - created_at))/60) FILTER (WHERE read_at IS NOT NULL) as avg_time_to_read_minutes
FROM notifications 
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at), category
ORDER BY date DESC, category;

-- =====================================================
-- Grant Necessary Permissions
-- =====================================================

GRANT ALL ON notifications TO authenticated;
GRANT ALL ON notification_preferences TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Grant access to the analytics view
GRANT SELECT ON notification_delivery_stats TO authenticated;

-- =====================================================
-- Insert Default Preferences for Existing Users
-- =====================================================

-- Create default notification preferences for any existing users
INSERT INTO notification_preferences (user_id)
SELECT id FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- =====================================================
-- Comments for Documentation
-- =====================================================

COMMENT ON TABLE notifications IS 'Core notifications table storing all platform notifications with rich content support and delivery tracking';
COMMENT ON TABLE notification_preferences IS 'User-specific notification preferences for multi-channel delivery control';

COMMENT ON COLUMN notifications.type IS 'Specific notification type (e.g., gig_published, application_received, talent_booked)';
COMMENT ON COLUMN notifications.category IS 'Broad notification category for filtering (gig, application, message, system)';
COMMENT ON COLUMN notifications.action_data IS 'Flexible JSON data for notification actions and context';
COMMENT ON COLUMN notifications.scheduled_for IS 'When the notification should be delivered (enables scheduled notifications)';

COMMENT ON COLUMN notification_preferences.digest_frequency IS 'How often to send digest emails: real-time, hourly, daily, weekly';
COMMENT ON COLUMN notification_preferences.quiet_hours_start IS 'Time to stop sending push notifications (local time)';
COMMENT ON COLUMN notification_preferences.quiet_hours_end IS 'Time to resume sending push notifications (local time)';

-- =====================================================
-- Success Message
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Notification System Phase 2 - Database Schema Complete!';
    RAISE NOTICE '📊 Created: notifications table with % indexes', 
        (SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'notifications');
    RAISE NOTICE '⚙️  Created: notification_preferences table';
    RAISE NOTICE '🔒 Applied: Row Level Security policies';
    RAISE NOTICE '🎯 Ready for: Phase 3 - Core Platform Events';
END $$;
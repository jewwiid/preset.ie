-- Create notification_preferences table for user notification settings
-- This table stores user preferences for different types of notifications

CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email_enabled BOOLEAN DEFAULT true,
    push_enabled BOOLEAN DEFAULT true,
    in_app_enabled BOOLEAN DEFAULT true,
    gig_notifications BOOLEAN DEFAULT true,
    application_notifications BOOLEAN DEFAULT true,
    message_notifications BOOLEAN DEFAULT true,
    booking_notifications BOOLEAN DEFAULT true,
    system_notifications BOOLEAN DEFAULT true,
    marketing_notifications BOOLEAN DEFAULT false,
    digest_frequency VARCHAR(20) DEFAULT 'real-time' CHECK (digest_frequency IN ('real-time', 'hourly', 'daily', 'weekly')),
    timezone VARCHAR(100) DEFAULT 'UTC',
    badge_count_enabled BOOLEAN DEFAULT true,
    sound_enabled BOOLEAN DEFAULT true,
    vibration_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);

-- Enable RLS
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can view own notification preferences" ON notification_preferences;
CREATE POLICY "Users can view own notification preferences" ON notification_preferences
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own notification preferences" ON notification_preferences;
CREATE POLICY "Users can insert own notification preferences" ON notification_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notification preferences" ON notification_preferences;
CREATE POLICY "Users can update own notification preferences" ON notification_preferences
    FOR UPDATE USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_notification_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_notification_preferences_updated_at ON notification_preferences;
CREATE TRIGGER update_notification_preferences_updated_at
    BEFORE UPDATE ON notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_notification_preferences_updated_at();

-- Grant permissions
GRANT ALL ON notification_preferences TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE notification_preferences IS 'User-specific notification preferences for multi-channel delivery control';
COMMENT ON COLUMN notification_preferences.email_enabled IS 'Whether email notifications are enabled';
COMMENT ON COLUMN notification_preferences.push_enabled IS 'Whether push notifications are enabled';
COMMENT ON COLUMN notification_preferences.in_app_enabled IS 'Whether in-app notifications are enabled';
COMMENT ON COLUMN notification_preferences.gig_notifications IS 'Whether to receive gig-related notifications';
COMMENT ON COLUMN notification_preferences.application_notifications IS 'Whether to receive application-related notifications';
COMMENT ON COLUMN notification_preferences.message_notifications IS 'Whether to receive message notifications';
COMMENT ON COLUMN notification_preferences.booking_notifications IS 'Whether to receive booking-related notifications';
COMMENT ON COLUMN notification_preferences.system_notifications IS 'Whether to receive system notifications';
COMMENT ON COLUMN notification_preferences.marketing_notifications IS 'Whether to receive marketing notifications';
COMMENT ON COLUMN notification_preferences.digest_frequency IS 'How often to send digest emails: real-time, hourly, daily, weekly';
COMMENT ON COLUMN notification_preferences.timezone IS 'User timezone for notification timing';
COMMENT ON COLUMN notification_preferences.badge_count_enabled IS 'Whether to show badge counts';
COMMENT ON COLUMN notification_preferences.sound_enabled IS 'Whether to play notification sounds';
COMMENT ON COLUMN notification_preferences.vibration_enabled IS 'Whether to vibrate for notifications';

-- Create notification_preferences table
-- Run this in your Supabase SQL Editor

-- Create notification_preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- General notification settings
    email_notifications BOOLEAN DEFAULT true,
    in_app_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT true,
    
    -- Specific notification types
    gig_notifications BOOLEAN DEFAULT true,
    message_notifications BOOLEAN DEFAULT true,
    collaboration_notifications BOOLEAN DEFAULT true,
    marketplace_notifications BOOLEAN DEFAULT true,
    system_notifications BOOLEAN DEFAULT true,
    
    -- Frequency settings
    notification_frequency VARCHAR(20) DEFAULT 'immediate', -- immediate, daily, weekly, never
    
    -- Quiet hours (optional)
    quiet_hours_enabled BOOLEAN DEFAULT false,
    quiet_hours_start TIME DEFAULT '22:00',
    quiet_hours_end TIME DEFAULT '08:00',
    quiet_hours_timezone VARCHAR(50) DEFAULT 'UTC',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one preference record per user
    UNIQUE(user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_gig_notifications ON notification_preferences(gig_notifications);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_in_app_enabled ON notification_preferences(in_app_notifications);

-- Enable Row Level Security
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own notification preferences" ON notification_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification preferences" ON notification_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification preferences" ON notification_preferences
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notification preferences" ON notification_preferences
    FOR DELETE USING (auth.uid() = user_id);

-- Allow service role full access for system operations
CREATE POLICY "Service role full access" ON notification_preferences
    FOR ALL USING (auth.role() = 'service_role');

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_notification_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_notification_preferences_updated_at 
    BEFORE UPDATE ON notification_preferences 
    FOR EACH ROW EXECUTE FUNCTION update_notification_preferences_updated_at();

-- Create function to get or create notification preferences for a user
CREATE OR REPLACE FUNCTION get_or_create_notification_preferences(user_uuid UUID)
RETURNS notification_preferences AS $$
DECLARE
    prefs notification_preferences;
BEGIN
    -- Try to get existing preferences
    SELECT * INTO prefs FROM notification_preferences WHERE user_id = user_uuid;
    
    -- If no preferences exist, create default ones
    IF NOT FOUND THEN
        INSERT INTO notification_preferences (user_id)
        VALUES (user_uuid)
        RETURNING * INTO prefs;
    END IF;
    
    RETURN prefs;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable realtime for notification_preferences table
ALTER PUBLICATION supabase_realtime ADD TABLE notification_preferences;

-- Verify the table was created successfully
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'notification_preferences';

-- Show the table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'notification_preferences'
ORDER BY ordinal_position;

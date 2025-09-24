-- Fix preset_notifications table creation
-- Drop and recreate the table to ensure proper structure

-- Drop existing table if it exists
DROP TABLE IF EXISTS preset_notifications CASCADE;

-- Create preset_notifications table with correct structure
CREATE TABLE preset_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    preset_id UUID NOT NULL REFERENCES presets(id) ON DELETE CASCADE,
    creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL CHECK (notification_type IN ('preset_used', 'sample_created', 'verification_requested')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}'::jsonb,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance
CREATE INDEX idx_preset_notifications_creator_id ON preset_notifications(creator_id);
CREATE INDEX idx_preset_notifications_preset_id ON preset_notifications(preset_id);
CREATE INDEX idx_preset_notifications_is_read ON preset_notifications(is_read);
CREATE INDEX idx_preset_notifications_created_at ON preset_notifications(created_at);

-- Enable RLS
ALTER TABLE preset_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for preset_notifications
CREATE POLICY "Users can view their own notifications" ON preset_notifications
    FOR SELECT USING (creator_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON preset_notifications
    FOR UPDATE USING (creator_id = auth.uid());

CREATE POLICY "System can insert notifications" ON preset_notifications
    FOR INSERT WITH CHECK (true); -- Allow system to create notifications

-- Add comment for documentation
COMMENT ON TABLE preset_notifications IS 'Notifications for preset creators when their presets are used';

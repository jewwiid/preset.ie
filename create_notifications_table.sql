-- Create notifications table
-- Run this in your Supabase SQL Editor

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL,
    category VARCHAR(100) NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    avatar_url TEXT,
    thumbnail_url TEXT,
    action_url TEXT,
    data JSONB,
    read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_category ON notifications(category);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_read ON notifications(recipient_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_created ON notifications(recipient_id, created_at);

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (auth.uid() = recipient_id);

CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = recipient_id);

CREATE POLICY "Users can insert notifications" ON notifications
    FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can delete their own notifications" ON notifications
    FOR DELETE USING (auth.uid() = recipient_id);

-- Allow service role full access for system operations
CREATE POLICY "Service role full access" ON notifications
    FOR ALL USING (auth.role() = 'service_role');

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_notifications_updated_at 
    BEFORE UPDATE ON notifications 
    FOR EACH ROW EXECUTE FUNCTION update_notifications_updated_at();

-- Create function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_as_read(notification_id UUID, user_uuid UUID)
RETURNS void AS $$
BEGIN
    UPDATE notifications 
    SET read = true, read_at = NOW(), updated_at = NOW()
    WHERE id = notification_id 
    AND recipient_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to mark all notifications as read for a user
CREATE OR REPLACE FUNCTION mark_all_notifications_as_read(user_uuid UUID)
RETURNS void AS $$
BEGIN
    UPDATE notifications 
    SET read = true, read_at = NOW(), updated_at = NOW()
    WHERE recipient_id = user_uuid 
    AND read = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get notification count for a user
CREATE OR REPLACE FUNCTION get_unread_notification_count(user_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER
        FROM notifications 
        WHERE recipient_id = user_uuid 
        AND read = false
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable realtime for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Verify the table was created successfully
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'notifications';

-- Show the table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'notifications'
ORDER BY ordinal_position;

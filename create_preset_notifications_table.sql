-- Create preset_notifications table
-- Run this in your Supabase SQL Editor

-- Create preset_notifications table
CREATE TABLE IF NOT EXISTS preset_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    preset_id UUID,
    type VARCHAR(100) NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    action_url TEXT,
    data JSONB,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_preset_notifications_creator_id ON preset_notifications(creator_id);
CREATE INDEX IF NOT EXISTS idx_preset_notifications_preset_id ON preset_notifications(preset_id);
CREATE INDEX IF NOT EXISTS idx_preset_notifications_type ON preset_notifications(type);
CREATE INDEX IF NOT EXISTS idx_preset_notifications_is_read ON preset_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_preset_notifications_created_at ON preset_notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_preset_notifications_creator_read ON preset_notifications(creator_id, is_read);

-- Enable Row Level Security
ALTER TABLE preset_notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own preset notifications" ON preset_notifications
    FOR SELECT USING (auth.uid() = creator_id);

CREATE POLICY "Users can update their own preset notifications" ON preset_notifications
    FOR UPDATE USING (auth.uid() = creator_id);

CREATE POLICY "Users can insert preset notifications" ON preset_notifications
    FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can delete their own preset notifications" ON preset_notifications
    FOR DELETE USING (auth.uid() = creator_id);

-- Allow service role full access for system operations
CREATE POLICY "Service role full access" ON preset_notifications
    FOR ALL USING (auth.role() = 'service_role');

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_preset_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_preset_notifications_updated_at 
    BEFORE UPDATE ON preset_notifications 
    FOR EACH ROW EXECUTE FUNCTION update_preset_notifications_updated_at();

-- Enable realtime for preset_notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE preset_notifications;

-- Verify the table was created successfully
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'preset_notifications';

-- Show the table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'preset_notifications'
ORDER BY ordinal_position;

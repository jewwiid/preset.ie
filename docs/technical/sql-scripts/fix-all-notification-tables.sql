-- Fix All Missing Notification Tables
-- This creates all missing notification-related tables that are causing user creation to fail

-- Create notification_preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT true,
    message_notifications BOOLEAN DEFAULT true,
    gig_notifications BOOLEAN DEFAULT true,
    application_notifications BOOLEAN DEFAULT true,
    review_notifications BOOLEAN DEFAULT true,
    marketing_notifications BOOLEAN DEFAULT false,
    weekly_digest BOOLEAN DEFAULT true,
    marketplace_notifications BOOLEAN DEFAULT true,
    listing_notifications BOOLEAN DEFAULT true,
    digest_frequency VARCHAR(20) DEFAULT 'daily',
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create gig_notification_preferences table
CREATE TABLE IF NOT EXISTS gig_notification_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    location_radius INTEGER DEFAULT 25 CHECK (location_radius BETWEEN 5 AND 100),
    min_budget DECIMAL(10,2),
    max_budget DECIMAL(10,2),
    preferred_purposes TEXT[] DEFAULT '{}',
    preferred_vibes TEXT[] DEFAULT '{}',
    preferred_styles TEXT[] DEFAULT '{}',
    notify_on_match BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    read_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    scheduled_for TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for notification_preferences
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_email ON notification_preferences(email_notifications);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_push ON notification_preferences(push_notifications);

-- Create indexes for gig_notification_preferences
CREATE INDEX IF NOT EXISTS idx_gig_notification_preferences_user_id ON gig_notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_gig_notification_preferences_notify_on_match ON gig_notification_preferences(notify_on_match) WHERE notify_on_match = true;

-- Create indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON notifications(read_at) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Enable Row Level Security
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE gig_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notification_preferences
DROP POLICY IF EXISTS "Users can access own preferences" ON notification_preferences;
CREATE POLICY "Users can access own preferences" ON notification_preferences
    FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for gig_notification_preferences
DROP POLICY IF EXISTS "Users can view own gig notification preferences" ON gig_notification_preferences;
CREATE POLICY "Users can view own gig notification preferences" 
ON gig_notification_preferences 
FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own gig notification preferences" ON gig_notification_preferences;
CREATE POLICY "Users can create own gig notification preferences" 
ON gig_notification_preferences 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own gig notification preferences" ON gig_notification_preferences;
CREATE POLICY "Users can update own gig notification preferences" 
ON gig_notification_preferences 
FOR UPDATE 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own gig notification preferences" ON gig_notification_preferences;
CREATE POLICY "Users can delete own gig notification preferences" 
ON gig_notification_preferences 
FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for notifications
DROP POLICY IF EXISTS "Users can access own notifications" ON notifications;
CREATE POLICY "Users can access own notifications" ON notifications
    FOR ALL USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_notification_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_notification_preferences_updated_at ON notification_preferences;
CREATE TRIGGER update_notification_preferences_updated_at
    BEFORE UPDATE ON notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_notification_updated_at();

DROP TRIGGER IF EXISTS update_gig_notification_preferences_updated_at ON gig_notification_preferences;
CREATE TRIGGER update_gig_notification_preferences_updated_at
    BEFORE UPDATE ON gig_notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_notification_updated_at();

DROP TRIGGER IF EXISTS update_notifications_updated_at ON notifications;
CREATE TRIGGER update_notifications_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_notification_updated_at();

-- Create function to create default notification preferences
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_preferences (
    user_id,
    email_notifications,
    push_notifications,
    message_notifications,
    gig_notifications,
    application_notifications,
    review_notifications,
    marketing_notifications,
    weekly_digest,
    marketplace_notifications,
    listing_notifications
  ) VALUES (
    NEW.id,
    true,
    true,
    true,
    true,
    true,
    true,
    false,
    true,
    true,
    true
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic notification preferences creation
DROP TRIGGER IF EXISTS create_notification_preferences_trigger ON auth.users;
CREATE TRIGGER create_notification_preferences_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_default_notification_preferences();

-- Grant permissions
GRANT ALL ON notification_preferences TO authenticated;
GRANT ALL ON gig_notification_preferences TO authenticated;
GRANT ALL ON notifications TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Verify the tables were created
SELECT 'All notification tables created successfully' as status;

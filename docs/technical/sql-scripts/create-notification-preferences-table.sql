-- Create notification_preferences table if it doesn't exist
-- This ensures the table exists in the public schema with the correct structure

-- Drop the table if it exists (to ensure clean creation)
DROP TABLE IF EXISTS notification_preferences CASCADE;

-- Create the notification_preferences table with the exact structure we saw
CREATE TABLE notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    digest_frequency VARCHAR(20) DEFAULT 'real-time',
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    timezone VARCHAR(50) DEFAULT 'UTC',
    badge_count_enabled BOOLEAN DEFAULT true,
    sound_enabled BOOLEAN DEFAULT true,
    vibration_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    marketplace_notifications BOOLEAN DEFAULT true,
    listing_notifications BOOLEAN DEFAULT true,
    offer_notifications BOOLEAN DEFAULT true,
    order_notifications BOOLEAN DEFAULT true,
    payment_notifications BOOLEAN DEFAULT true,
    review_notifications BOOLEAN DEFAULT true,
    dispute_notifications BOOLEAN DEFAULT true,
    UNIQUE(user_id)
);

-- Create indexes
CREATE INDEX idx_notification_preferences_user_id ON notification_preferences(user_id);
CREATE INDEX idx_notification_preferences_email ON notification_preferences(email_enabled);
CREATE INDEX idx_notification_preferences_push ON notification_preferences(push_enabled);

-- Enable Row Level Security
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "Users can access own preferences" ON notification_preferences
    FOR ALL USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_notification_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_notification_preferences_updated_at
    BEFORE UPDATE ON notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_notification_preferences_updated_at();

-- Create function to create default notification preferences
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_preferences (
    user_id,
    email_enabled,
    push_enabled,
    in_app_enabled,
    gig_notifications,
    application_notifications,
    message_notifications,
    booking_notifications,
    system_notifications,
    marketing_notifications,
    digest_frequency,
    quiet_hours_start,
    quiet_hours_end,
    timezone,
    badge_count_enabled,
    sound_enabled,
    vibration_enabled,
    marketplace_notifications,
    listing_notifications,
    offer_notifications,
    order_notifications,
    payment_notifications,
    review_notifications,
    dispute_notifications
  ) VALUES (
    NEW.id,
    true,  -- email_enabled
    true,  -- push_enabled
    true,  -- in_app_enabled
    true,  -- gig_notifications
    true,  -- application_notifications
    true,  -- message_notifications
    true,  -- booking_notifications
    true,  -- system_notifications
    false, -- marketing_notifications
    'real-time', -- digest_frequency
    NULL,  -- quiet_hours_start
    NULL,  -- quiet_hours_end
    'UTC', -- timezone
    true,  -- badge_count_enabled
    true,  -- sound_enabled
    true,  -- vibration_enabled
    true,  -- marketplace_notifications
    true,  -- listing_notifications
    true,  -- offer_notifications
    true,  -- order_notifications
    true,  -- payment_notifications
    true,  -- review_notifications
    true   -- dispute_notifications
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
GRANT USAGE ON SCHEMA public TO authenticated;

-- Verify the table was created
SELECT 'notification_preferences table created successfully!' as status;

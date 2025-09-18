-- Fix Missing notification_preferences Table
-- This creates the missing notification_preferences table that's causing user creation to fail

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
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create indexes for notification_preferences
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_email ON notification_preferences(email_notifications);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_push ON notification_preferences(push_notifications);

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
    weekly_digest
  ) VALUES (
    NEW.id,
    true,
    true,
    true,
    true,
    true,
    true,
    false,
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

-- Verify the table was created
SELECT 'notification_preferences table created successfully' as status;

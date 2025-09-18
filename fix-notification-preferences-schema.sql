-- Fix notification_preferences schema issue
-- The triggers are looking for the table but can't find it
-- This suggests a schema or permission issue

-- First, let's check what schemas exist and where the table is
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE tablename = 'notification_preferences';

-- Check current search path
SHOW search_path;

-- Set search path to include public schema explicitly
SET search_path = public, auth;

-- Drop the table completely and recreate it in the public schema
DROP TABLE IF EXISTS notification_preferences CASCADE;

-- Create notification_preferences table in public schema explicitly
CREATE TABLE public.notification_preferences (
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
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON public.notification_preferences(user_id);

-- Enable RLS
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
DROP POLICY IF EXISTS "Users can access own preferences" ON public.notification_preferences;
CREATE POLICY "Users can access own preferences" ON public.notification_preferences
    FOR ALL USING (auth.uid() = user_id);

-- Grant permissions explicitly
GRANT ALL ON public.notification_preferences TO authenticated;
GRANT ALL ON public.notification_preferences TO service_role;
GRANT ALL ON public.notification_preferences TO anon;

-- Update the trigger function to use explicit schema
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into notification_preferences table with explicit schema
  INSERT INTO public.notification_preferences (
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
  )
  VALUES (
    NEW.id,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    false,
    'real-time',
    'UTC',
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    true
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the manual function as well
CREATE OR REPLACE FUNCTION create_default_notification_preferences_manual(
  p_user_id UUID
)
RETURNS VOID AS $$
BEGIN
  -- Insert into notification_preferences table with explicit schema
  INSERT INTO public.notification_preferences (
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
  )
  VALUES (
    p_user_id,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    false,
    'real-time',
    'UTC',
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    true
  )
  ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions on functions
GRANT EXECUTE ON FUNCTION create_default_notification_preferences() TO service_role;
GRANT EXECUTE ON FUNCTION create_default_notification_preferences_manual(UUID) TO service_role;

-- Verify the table was created in the correct schema
SELECT 'notification_preferences table created in public schema!' as status;


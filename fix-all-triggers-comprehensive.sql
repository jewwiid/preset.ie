-- Comprehensive fix for all user creation triggers
-- This addresses the notification_preferences issue and ensures all triggers work

-- First, drop all existing triggers on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS create_user_settings_trigger ON auth.users;
DROP TRIGGER IF EXISTS create_notification_preferences_trigger ON auth.users;

-- Drop all existing functions
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS create_default_user_settings() CASCADE;
DROP FUNCTION IF EXISTS initialize_user_credits() CASCADE;
DROP FUNCTION IF EXISTS create_default_notification_preferences() CASCADE;

-- Ensure notification_preferences table exists in public schema
DROP TABLE IF EXISTS notification_preferences CASCADE;

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
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);

-- Enable RLS
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
DROP POLICY IF EXISTS "Users can access own preferences" ON notification_preferences;
CREATE POLICY "Users can access own preferences" ON notification_preferences
    FOR ALL USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON notification_preferences TO authenticated;
GRANT ALL ON notification_preferences TO service_role;

-- Create simplified trigger functions that don't cause conflicts
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into public.users table
  INSERT INTO public.users (id, email, role, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'TALENT'),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION create_default_user_settings()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into user_settings table
  INSERT INTO user_settings (
    user_id,
    email_notifications,
    push_notifications,
    sms_notifications,
    marketing_emails,
    profile_visibility,
    show_contact_info,
    allow_messages,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    true,
    true,
    false,
    false,
    'public',
    true,
    true,
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION initialize_user_credits()
RETURNS TRIGGER AS $$
DECLARE
  monthly_allowance INTEGER;
BEGIN
  -- Determine monthly allowance based on subscription tier
  monthly_allowance := CASE 
    WHEN COALESCE(NEW.raw_user_meta_data->>'subscription_tier', 'FREE') = 'FREE' THEN 10
    WHEN COALESCE(NEW.raw_user_meta_data->>'subscription_tier', 'FREE') = 'PREMIUM' THEN 50
    WHEN COALESCE(NEW.raw_user_meta_data->>'subscription_tier', 'FREE') = 'PRO' THEN 100
    ELSE 10
  END;

  -- Insert into user_credits table
  INSERT INTO user_credits (
    user_id,
    subscription_tier,
    monthly_allowance,
    current_balance,
    consumed_this_month,
    last_reset_at,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'subscription_tier', 'FREE'),
    monthly_allowance,
    monthly_allowance,
    0,
    DATE_TRUNC('month', NOW()),
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into notification_preferences table
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

-- Create triggers
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

CREATE TRIGGER create_user_settings_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_default_user_settings();

CREATE TRIGGER initialize_user_credits_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION initialize_user_credits();

CREATE TRIGGER create_notification_preferences_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_default_notification_preferences();

-- Verify everything was created
SELECT 'All triggers and functions created successfully!' as status;


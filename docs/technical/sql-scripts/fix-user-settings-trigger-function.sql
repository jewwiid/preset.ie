-- Fix the create_default_user_settings trigger function to use correct column names
-- Based on the actual user_settings table structure

-- Drop the existing function
DROP FUNCTION IF EXISTS public.create_default_user_settings();

-- Recreate the function with correct column names
CREATE OR REPLACE FUNCTION public.create_default_user_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_settings (
    user_id,
    email_notifications,
    push_notifications,
    marketing_emails,
    profile_visibility,
    show_contact_info,
    two_factor_enabled,
    message_notifications,
    allow_stranger_messages,
    privacy_level,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    true,
    true,
    false,
    'public',
    true,
    false,
    true,
    false,
    'standard',
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify the function was created
SELECT 'create_default_user_settings function updated successfully!' as status;

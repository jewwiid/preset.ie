-- Comprehensive fix for create_default_user_settings trigger function
-- This will drop all related triggers and recreate them properly

-- First, drop all triggers that use this function
DROP TRIGGER IF EXISTS create_default_user_settings_trigger ON auth.users;
DROP TRIGGER IF EXISTS create_default_user_settings_trigger ON public.users;

-- Drop the function completely (with CASCADE to remove dependent triggers)
DROP FUNCTION IF EXISTS public.create_default_user_settings() CASCADE;

-- Recreate the function with correct column names based on actual table structure
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

-- Recreate the trigger on auth.users
CREATE TRIGGER create_default_user_settings_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_user_settings();

-- Verify the function was created correctly
SELECT 
    'create_default_user_settings function recreated successfully!' as status,
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_name = 'create_default_user_settings' 
AND routine_schema = 'public';

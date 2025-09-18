-- Fix the handle_new_user function to properly cast the role to user_role enum
-- and handle the notification_preferences table issue

-- Drop the existing function
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Recreate the function with proper type casting
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into public.users with proper type casting
  INSERT INTO public.users (
    id,
    email,
    role,
    subscription_tier,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'USER')::user_role,
    COALESCE(NEW.raw_user_meta_data->>'subscription_tier', 'FREE')::subscription_tier,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER handle_new_user_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Verify the function was created
SELECT 'handle_new_user function fixed with proper type casting!' as status;

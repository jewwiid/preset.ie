-- Final fix for handle_new_user function with proper type casting
-- This will completely replace the function with correct enum casting

-- Drop the existing function and trigger
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Recreate the function with proper type casting for all enum columns
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

-- Verify the function was created correctly
SELECT 
    'handle_new_user function recreated with proper enum casting!' as status,
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user' 
AND routine_schema = 'public';

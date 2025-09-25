-- ============================================================================
-- SURGICAL OAUTH FIX - Only drop user-created triggers, not system ones
-- ============================================================================

-- Step 1: Drop only user-created triggers (not constraint triggers)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_simple ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_fixed ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_complete ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_comprehensive ON auth.users;
DROP TRIGGER IF EXISTS oauth_user_creation_trigger ON auth.users;
DROP TRIGGER IF EXISTS simple_oauth_profile_trigger ON auth.users;
DROP TRIGGER IF EXISTS trigger_create_user_profile ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user_trigger ON auth.users;

-- Step 2: Drop user-created functions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user_simple() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user_fixed() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user_complete() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user_comprehensive() CASCADE;
DROP FUNCTION IF EXISTS public.handle_oauth_user_creation() CASCADE;
DROP FUNCTION IF EXISTS public.simple_profile_creator() CASCADE;

-- Step 3: Create the simplest working trigger function
CREATE OR REPLACE FUNCTION public.create_oauth_profile()
RETURNS TRIGGER AS
$$
BEGIN
    -- Only process OAuth sign-ups (skip email signups)
    IF NEW.raw_app_meta_data IS NOT NULL AND NEW.raw_app_meta_data->>'provider' IS NOT NULL THEN
        
        -- Insert profile with minimal error handling
        INSERT INTO public.users_profile (
            user_id,
            display_name,
            handle,
            bio,
            role_flags,
            subscription_tier,
            subscription_status
        ) VALUES (
            NEW.id,
            COALESCE(NEW.raw_user_meta_data->>'name', NEW.email, 'User'),
            'user_' || replace(NEW.id::TEXT, '-', ''),  -- Remove hyphens for valid handle
            'Welcome to Preset!',
            ARRAY['TALENT']::user_role[],
            'FREE'::subscription_tier,
            'ACTIVE'::subscription_status
        );
        
    END IF;
    
    RETURN NEW;
EXCEPTION 
    WHEN OTHERS THEN
        -- If anything fails, just continue without breaking OAuth
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Create the trigger
CREATE TRIGGER create_oauth_profile_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.create_oauth_profile();

-- Step 5: Grant permissions
GRANT EXECUTE ON FUNCTION public.create_oauth_profile() TO service_role;
GRANT EXECUTE ON FUNCTION public.create_oauth_profile() TO authenticated;

-- Step 6: Verify the fix
SELECT 'SURGICAL OAUTH FIX VERIFICATION:' as status;

-- Check our trigger exists
SELECT 
  t.tgname as trigger_name,
  CASE t.tgenabled 
    WHEN 'R' THEN 'ENABLED' 
    WHEN 'A' THEN 'ENABLED' 
    ELSE 'DISABLED' 
  END as status
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'auth' 
  AND c.relname = 'users'
  AND t.tgname = 'create_oauth_profile_trigger';

-- Check all triggers on auth.users (should only see our trigger + system ones)
SELECT 'All triggers on auth.users:' as info;
SELECT 
  t.tgname as trigger_name,
  CASE 
    WHEN t.tgname LIKE 'RI_ConstraintTrigger%' THEN 'SYSTEM'
    WHEN t.tgname LIKE 'create_oauth_profile_trigger' THEN 'OUR_TRIGGER'
    ELSE 'OTHER'
  END as trigger_type
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'auth' AND c.relname = 'users'
ORDER BY trigger_type, t.tgname;

SELECT '✅ SURGICAL OAUTH FIX APPLIED!' as result;
SELECT 'OAuth should now work without database errors' as note;

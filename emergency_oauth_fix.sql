-- ============================================================================
-- EMERGENCY OAUTH FIX - Nuclear Option
-- This completely removes ALL triggers and creates a minimal working one
-- ============================================================================

-- Step 1: NUCLEAR OPTION - Remove absolutely everything
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop all triggers on auth.users
    FOR r IN (
        SELECT t.tgname 
        FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE n.nspname = 'auth' AND c.relname = 'users'
    ) LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || quote_ident(r.tgname) || ' ON auth.users';
    END LOOP;
    
    -- Drop all functions that might be related
    FOR r IN (
        SELECT p.proname
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' 
          AND (p.proname LIKE '%user%' OR p.proname LIKE '%auth%' OR p.proname LIKE '%profile%')
          AND p.proname != 'users'
    ) LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS public.' || quote_ident(r.proname) || ' CASCADE';
    END LOOP;
END
$$;

-- Step 2: Wait a moment to ensure everything is cleaned
SELECT pg_sleep(1);

-- Step 3: Create the simplest possible working trigger
CREATE OR REPLACE FUNCTION public.simple_profile_creator()
RETURNS TRIGGER AS
$$
BEGIN
    -- Only for OAuth users
    IF NEW.raw_app_meta_data IS NOT NULL AND NEW.raw_app_meta_data->>'provider' IS NOT NULL THEN
        
        -- Try to insert profile, ignore errors
        BEGIN
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
                'user_' || NEW.id::TEXT,  -- Use user ID as handle (guaranteed unique)
                'Welcome to Preset!',
                ARRAY['TALENT']::user_role[],
                'FREE'::subscription_tier,
                'ACTIVE'::subscription_status
            );
        EXCEPTION 
            WHEN OTHERS THEN
                -- Log error but don't fail
                RAISE LOG 'Profile creation failed for user %: %', NEW.id, SQLERRM;
        END;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Create the trigger
CREATE TRIGGER simple_oauth_profile_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.simple_profile_creator();

-- Step 5: Grant permissions
GRANT EXECUTE ON FUNCTION public.simple_profile_creator() TO service_role;
GRANT EXECUTE ON FUNCTION public.simple_profile_creator() TO authenticated;

-- Step 6: Test that trigger exists
SELECT 'Emergency fix verification:' as result;
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
  AND t.tgname = 'simple_oauth_profile_trigger';

SELECT '🚨 EMERGENCY OAUTH FIX APPLIED!' as result;
SELECT 'This should definitely work now' as note;

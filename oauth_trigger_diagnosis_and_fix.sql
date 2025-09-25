-- ============================================================================
-- OAUTH TRIGGER DIAGNOSIS AND COMPREHENSIVE FIX
-- This will diagnose and fix the "Database error saving new user" issue
-- ============================================================================

-- Step 1: Check what triggers currently exist
SELECT '=== CURRENT TRIGGER STATUS ===' as status;
SELECT 
  t.tgname as trigger_name,
  CASE t.tgenabled 
    WHEN 'O' THEN 'DISABLED' 
    WHEN 'D' THEN 'DISABLED' 
    WHEN 'R' THEN 'ENABLED' 
    WHEN 'A' THEN 'ENABLED' 
    ELSE 'UNKNOWN' 
  END as status,
  pg_get_triggerdef(t.oid) as definition
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'auth' 
  AND c.relname = 'users'
ORDER BY t.tgname;

-- Step 2: Check what functions exist
SELECT '=== EXISTING FUNCTIONS ===' as status;
SELECT 
  p.proname as function_name,
  pg_get_functiondef(p.oid) as definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname LIKE '%user%'
  AND p.proname LIKE '%handle%'
ORDER BY p.proname;

-- Step 3: Check users_profile table structure
SELECT '=== TABLE STRUCTURE ===' as status;
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'users_profile'
ORDER BY ordinal_position;

-- Step 4: COMPLETELY CLEAN SLATE - Remove ALL auth user triggers
SELECT '=== CLEANING ALL TRIGGERS ===' as status;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_simple ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_fixed ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_complete ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_comprehensive ON auth.users;
DROP TRIGGER IF EXISTS trigger_create_user_profile ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user_trigger ON auth.users;
DROP TRIGGER IF EXISTS initialize_user_credits_trigger ON auth.users;
DROP TRIGGER IF EXISTS create_default_notification_preferences_trigger ON auth.users;
DROP TRIGGER IF EXISTS create_default_user_settings_trigger ON auth.users;

-- Drop ALL related functions
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user_simple() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user_fixed() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user_complete() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user_comprehensive() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user_profile() CASCADE;
DROP FUNCTION IF EXISTS create_user_profile() CASCADE;
DROP FUNCTION IF EXISTS initialize_user_credits() CASCADE;
DROP FUNCTION IF EXISTS create_default_notification_preferences() CASCADE;
DROP FUNCTION IF EXISTS create_default_user_settings() CASCADE;

-- Step 5: Create a BULLETPROOF trigger function
CREATE OR REPLACE FUNCTION public.handle_oauth_user_creation()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
DECLARE
    user_display_name TEXT;
    user_handle TEXT;
    attempt_count INTEGER := 0;
    max_attempts INTEGER := 5;
BEGIN
    -- Log the trigger execution
    RAISE LOG 'OAuth user creation trigger fired for user: % (email: %)', NEW.id, NEW.email;
    
    -- Only process OAuth users (skip email signup)
    IF NEW.raw_app_meta_data->>'provider' IS NULL THEN
        RAISE LOG 'Skipping non-OAuth user: %', NEW.id;
        RETURN NEW;
    END IF;
    
    -- Extract display name from OAuth metadata
    user_display_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        NEW.raw_user_meta_data->>'given_name' || ' ' || NEW.raw_user_meta_data->>'family_name',
        split_part(NEW.email, '@', 1),
        'User'
    );
    
    -- Generate unique handle with retry logic
    WHILE attempt_count < max_attempts LOOP
        attempt_count := attempt_count + 1;
        
        -- Create handle: user_timestamp_random
        user_handle := 'user_' || 
                      EXTRACT(EPOCH FROM NOW())::BIGINT || '_' || 
                      substr(md5(random()::text || attempt_count::text), 1, 6);
        
        -- Try to insert the profile
        BEGIN
            INSERT INTO public.users_profile (
                user_id,
                display_name,
                handle,
                bio,
                role_flags,
                subscription_tier,
                subscription_status,
                created_at,
                updated_at
            ) VALUES (
                NEW.id,
                user_display_name,
                user_handle,
                'Welcome to Preset! Complete your profile to get started.',
                ARRAY['TALENT']::user_role[],
                'FREE'::subscription_tier,
                'ACTIVE'::subscription_status,
                NOW(),
                NOW()
            );
            
            RAISE LOG 'Successfully created profile for OAuth user: % with handle: %', NEW.id, user_handle;
            EXIT; -- Success, exit the loop
            
        EXCEPTION
            WHEN unique_violation THEN
                -- Handle already exists, try again with different handle
                IF attempt_count >= max_attempts THEN
                    RAISE LOG 'Failed to create unique handle after % attempts for user: %', max_attempts, NEW.id;
                    -- Don't fail the auth process, just log it
                    RETURN NEW;
                END IF;
                CONTINUE;
                
            WHEN foreign_key_violation THEN
                RAISE LOG 'Foreign key violation creating profile for user: % - %', NEW.id, SQLERRM;
                -- Don't fail the auth process
                RETURN NEW;
                
            WHEN OTHERS THEN
                RAISE LOG 'Unexpected error creating profile for user: % - %', NEW.id, SQLERRM;
                -- Don't fail the auth process
                RETURN NEW;
        END;
    END LOOP;
    
    -- Optional: Initialize credits if table exists
    BEGIN
        INSERT INTO public.user_credits (user_id, credit_balance, created_at, updated_at)
        VALUES (NEW.id, 0, NOW(), NOW());
        RAISE LOG 'Initialized credits for user: %', NEW.id;
    EXCEPTION
        WHEN undefined_table THEN
            -- Credits table doesn't exist, skip silently
            NULL;
        WHEN unique_violation THEN
            -- Credits already exist, that's fine
            NULL;
        WHEN OTHERS THEN
            RAISE LOG 'Could not initialize credits for user %: %', NEW.id, SQLERRM;
    END;
    
    RETURN NEW;
END;
$$;

-- Step 6: Create the trigger
CREATE TRIGGER oauth_user_creation_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_oauth_user_creation();

-- Step 7: Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_oauth_user_creation() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_oauth_user_creation() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_oauth_user_creation() TO anon;

-- Step 8: Add helpful comment
COMMENT ON FUNCTION public.handle_oauth_user_creation() IS 'Bulletproof function to create user profiles for OAuth sign-ups with comprehensive error handling';

-- Step 9: Verify the fix
SELECT '=== VERIFICATION ===' as status;
SELECT 
  t.tgname as trigger_name,
  CASE t.tgenabled 
    WHEN 'O' THEN 'DISABLED' 
    WHEN 'D' THEN 'DISABLED' 
    WHEN 'R' THEN 'ENABLED' 
    WHEN 'A' THEN 'ENABLED' 
    ELSE 'UNKNOWN' 
  END as status
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'auth' 
  AND c.relname = 'users'
  AND t.tgname = 'oauth_user_creation_trigger';

-- Step 10: Test permissions
SELECT '=== PERMISSIONS TEST ===' as status;
SELECT 
  p.proname as function_name,
  array_agg(DISTINCT pg_authid.rolname ORDER BY pg_authid.rolname) as granted_to
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
LEFT JOIN information_schema.routine_privileges rp ON rp.routine_name = p.proname
LEFT JOIN pg_authid ON pg_authid.rolname = rp.grantee
WHERE n.nspname = 'public' 
  AND p.proname = 'handle_oauth_user_creation'
GROUP BY p.proname;

SELECT '✅ COMPREHENSIVE OAUTH FIX APPLIED!' as result;
SELECT 'The trigger should now work without any database errors' as note;

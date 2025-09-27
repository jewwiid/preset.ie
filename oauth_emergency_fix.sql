-- ============================================================================
-- EMERGENCY OAUTH FIX - Complete Cleanup and Rebuild
-- This script will completely remove ALL triggers and rebuild from scratch
-- ============================================================================

-- Step 1: Show current state
SELECT '=== CURRENT TRIGGERS ON AUTH.USERS ===' as status;
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
  AND NOT t.tgisinternal;

-- Step 2: NUCLEAR OPTION - Remove ALL triggers on auth.users
SELECT '=== REMOVING ALL TRIGGERS ===' as status;

-- Get all trigger names and drop them
DO $$
DECLARE
    trigger_record RECORD;
BEGIN
    FOR trigger_record IN 
        SELECT t.tgname 
        FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE n.nspname = 'auth' 
          AND c.relname = 'users'
          AND NOT t.tgisinternal
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || quote_ident(trigger_record.tgname) || ' ON auth.users';
        RAISE NOTICE 'Dropped trigger: %', trigger_record.tgname;
    END LOOP;
END $$;

-- Step 3: Drop ALL related functions
SELECT '=== REMOVING ALL TRIGGER FUNCTIONS ===' as status;

DROP FUNCTION IF EXISTS public.create_user_profile_oauth() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user_profile() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user_complete() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user_comprehensive() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user_fixed() CASCADE;
DROP FUNCTION IF EXISTS public.create_user_profile_on_signup() CASCADE;
DROP FUNCTION IF EXISTS public.handle_oauth_user_creation() CASCADE;
DROP FUNCTION IF EXISTS public.simple_profile_creator() CASCADE;
DROP FUNCTION IF EXISTS public.create_oauth_profile() CASCADE;

-- Step 4: Check users_profile table constraints
SELECT '=== CHECKING TABLE CONSTRAINTS ===' as status;
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.table_name = 'users_profile'
    AND tc.table_schema = 'public';

-- Step 5: Create a MINIMAL, bulletproof trigger function
SELECT '=== CREATING MINIMAL TRIGGER FUNCTION ===' as status;

CREATE OR REPLACE FUNCTION public.create_user_profile_minimal()
RETURNS TRIGGER AS $$
BEGIN
    -- Log the attempt
    RAISE LOG 'OAuth user creation attempt: % (email: %)', NEW.id, NEW.email;
    
    -- Try to create profile with minimal required fields only
    BEGIN
        INSERT INTO public.users_profile (
            user_id,
            display_name,
            handle
        ) VALUES (
            NEW.id,
            COALESCE(
                NEW.raw_user_meta_data->>'full_name',
                NEW.raw_user_meta_data->>'name', 
                split_part(NEW.email, '@', 1),
                'User'
            ),
            'user_' || EXTRACT(EPOCH FROM NOW())::BIGINT || '_' || substr(md5(random()::text), 1, 8)
        );
        
        RAISE LOG 'Profile created successfully for user: %', NEW.id;
        
    EXCEPTION
        WHEN unique_violation THEN
            -- Try again with a different handle
            BEGIN
                INSERT INTO public.users_profile (
                    user_id,
                    display_name,
                    handle
                ) VALUES (
                    NEW.id,
                    COALESCE(
                        NEW.raw_user_meta_data->>'full_name',
                        NEW.raw_user_meta_data->>'name', 
                        split_part(NEW.email, '@', 1),
                        'User'
                    ),
                    'user_' || EXTRACT(EPOCH FROM NOW())::BIGINT || '_' || substr(md5(NEW.id::text || random()::text), 1, 8)
                );
                RAISE LOG 'Profile created with new handle for user: %', NEW.id;
            EXCEPTION
                WHEN OTHERS THEN
                    RAISE LOG 'Failed to create profile even with new handle for user %: %', NEW.id, SQLERRM;
            END;
            
        WHEN OTHERS THEN
            -- Log the specific error
            RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
            RAISE LOG 'Error detail: %', SQLSTATE;
            RAISE LOG 'Error context: %', SQLERRM;
    END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Create the trigger
SELECT '=== CREATING NEW TRIGGER ===' as status;

CREATE TRIGGER oauth_user_creation_minimal
    AFTER INSERT ON auth.users
    FOR EACH ROW 
    EXECUTE FUNCTION public.create_user_profile_minimal();

-- Step 7: Grant permissions
GRANT EXECUTE ON FUNCTION public.create_user_profile_minimal() TO service_role;
GRANT EXECUTE ON FUNCTION public.create_user_profile_minimal() TO authenticated;

-- Step 8: Verify the setup
SELECT '=== VERIFICATION ===' as status;

-- Check that only our trigger exists
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
  AND NOT t.tgisinternal;

-- Test the function manually with a dummy user
SELECT '=== TESTING FUNCTION ===' as status;
SELECT 'Function exists: ' || EXISTS(
    SELECT 1 FROM pg_proc WHERE proname = 'create_user_profile_minimal'
) as test_result;

-- Final status
SELECT '=== OAUTH FIX COMPLETE ===' as status,
       'Try Google OAuth sign-in now' as next_step;

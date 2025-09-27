-- ============================================================================
-- OAUTH FIX - Manual Execution
-- Fixes "Database error saving new user" during Google OAuth sign-in
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Check current triggers before we start
SELECT 'Current triggers on auth.users:' as info;
SELECT t.tgname as trigger_name, 
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
WHERE n.nspname = 'auth' AND c.relname = 'users';

-- Step 1: Remove ALL existing problematic triggers on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_complete ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_comprehensive ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_fixed ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_simple ON auth.users;
DROP TRIGGER IF EXISTS trigger_create_user_profile ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user_trigger ON auth.users;
DROP TRIGGER IF EXISTS initialize_user_credits_trigger ON auth.users;
DROP TRIGGER IF EXISTS create_default_notification_preferences_trigger ON auth.users;
DROP TRIGGER IF EXISTS create_default_user_settings_trigger ON auth.users;
DROP TRIGGER IF EXISTS oauth_user_creation_trigger ON auth.users;
DROP TRIGGER IF EXISTS simple_oauth_profile_trigger ON auth.users;
DROP TRIGGER IF EXISTS create_oauth_profile_trigger ON auth.users;

-- Step 2: Drop problematic functions
DROP FUNCTION IF EXISTS handle_new_user_complete();
DROP FUNCTION IF EXISTS handle_new_user_comprehensive();
DROP FUNCTION IF EXISTS handle_new_user_fixed();
DROP FUNCTION IF EXISTS create_user_profile_on_signup();
DROP FUNCTION IF EXISTS handle_oauth_user_creation();
DROP FUNCTION IF EXISTS simple_profile_creator();
DROP FUNCTION IF EXISTS create_oauth_profile();

-- Step 3: Create a simple, robust trigger function
CREATE OR REPLACE FUNCTION public.create_user_profile_oauth()
RETURNS TRIGGER AS $$
BEGIN
    -- Log the attempt
    RAISE LOG 'OAuth user creation: % (email: %)', NEW.id, NEW.email;
    
    -- Insert into users_profile table
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
            updated_at,
            first_name,
            last_name,
            account_status,
            age_verified
        ) VALUES (
            NEW.id,
            -- Use name from OAuth metadata or fallback
            COALESCE(
                NEW.raw_user_meta_data->>'full_name',
                NEW.raw_user_meta_data->>'name', 
                split_part(NEW.email, '@', 1),
                'User'
            ),
            -- Generate unique handle
            'user_' || EXTRACT(EPOCH FROM NOW())::BIGINT || '_' || substr(md5(random()::text), 1, 6),
            'Welcome to Preset! Complete your profile to get started.',
            ARRAY['TALENT']::user_role[],
            'FREE'::subscription_tier,
            'ACTIVE'::subscription_status,
            NOW(),
            NOW(),
            -- Extract first and last name from OAuth data
            COALESCE(
                split_part(NEW.raw_user_meta_data->>'full_name', ' ', 1),
                split_part(NEW.raw_user_meta_data->>'name', ' ', 1),
                split_part(NEW.email, '@', 1)
            ),
            COALESCE(
                CASE 
                    WHEN NEW.raw_user_meta_data->>'full_name' ~ ' ' THEN 
                        split_part(NEW.raw_user_meta_data->>'full_name', ' ', 2)
                    WHEN NEW.raw_user_meta_data->>'name' ~ ' ' THEN 
                        split_part(NEW.raw_user_meta_data->>'name', ' ', 2)
                    ELSE NULL
                END
            ),
            'ACTIVE',
            false
        );
        
        RAISE LOG 'Profile created successfully for user: %', NEW.id;
        
    EXCEPTION
        WHEN unique_violation THEN
            -- Handle already exists, generate new one
            INSERT INTO public.users_profile (
                user_id,
                display_name,
                handle,
                bio,
                role_flags,
                subscription_tier,
                subscription_status,
                created_at,
                updated_at,
                first_name,
                last_name,
                account_status,
                age_verified
            ) VALUES (
                NEW.id,
                COALESCE(
                    NEW.raw_user_meta_data->>'full_name',
                    NEW.raw_user_meta_data->>'name', 
                    split_part(NEW.email, '@', 1),
                    'User'
                ),
                'user_' || EXTRACT(EPOCH FROM NOW())::BIGINT || '_' || substr(md5(random()::text), 1, 8),
                'Welcome to Preset! Complete your profile to get started.',
                ARRAY['TALENT']::user_role[],
                'FREE'::subscription_tier,
                'ACTIVE'::subscription_status,
                NOW(),
                NOW(),
                COALESCE(
                    split_part(NEW.raw_user_meta_data->>'full_name', ' ', 1),
                    split_part(NEW.raw_user_meta_data->>'name', ' ', 1),
                    split_part(NEW.email, '@', 1)
                ),
                COALESCE(
                    CASE 
                        WHEN NEW.raw_user_meta_data->>'full_name' ~ ' ' THEN 
                            split_part(NEW.raw_user_meta_data->>'full_name', ' ', 2)
                        WHEN NEW.raw_user_meta_data->>'name' ~ ' ' THEN 
                            split_part(NEW.raw_user_meta_data->>'name', ' ', 2)
                        ELSE NULL
                    END
                ),
                'ACTIVE',
                false
            );
            RAISE LOG 'Profile created with new handle for user: %', NEW.id;
            
        WHEN OTHERS THEN
            -- Log error but don't fail OAuth
            RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
    END;
    
    -- Initialize user credits (optional)
    BEGIN
        INSERT INTO user_credits (user_id, credit_balance, created_at, updated_at)
        VALUES (NEW.id, 0, NOW(), NOW());
        RAISE LOG 'Credits initialized for user: %', NEW.id;
    EXCEPTION
        WHEN undefined_table THEN
            -- Credits table doesn't exist, skip
            NULL;
        WHEN unique_violation THEN
            -- Credits already exist
            NULL;
        WHEN OTHERS THEN
            RAISE LOG 'Could not initialize credits: %', SQLERRM;
    END;
    
    -- Initialize user settings (optional)
    BEGIN
        INSERT INTO user_settings (user_id, email_notifications, push_notifications, marketing_emails, profile_visibility, show_contact_info, two_factor_enabled, created_at, updated_at)
        VALUES (NEW.id, true, true, false, 'public', true, false, NOW(), NOW());
        RAISE LOG 'Settings initialized for user: %', NEW.id;
    EXCEPTION
        WHEN undefined_table THEN
            -- Settings table doesn't exist, skip
            NULL;
        WHEN unique_violation THEN
            -- Settings already exist
            NULL;
        WHEN OTHERS THEN
            RAISE LOG 'Could not initialize settings: %', SQLERRM;
    END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Create the trigger (drop first if exists)
DROP TRIGGER IF EXISTS oauth_user_creation_fixed ON auth.users;
CREATE TRIGGER oauth_user_creation_fixed
    AFTER INSERT ON auth.users
    FOR EACH ROW 
    EXECUTE FUNCTION public.create_user_profile_oauth();

-- Step 5: Grant permissions
GRANT EXECUTE ON FUNCTION public.create_user_profile_oauth() TO service_role;
GRANT EXECUTE ON FUNCTION public.create_user_profile_oauth() TO authenticated;

-- Step 6: Verify the setup
SELECT 'OAuth fix applied successfully!' as status;

-- Check trigger is active
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
  AND t.tgname = 'oauth_user_creation_fixed';

-- Check users_profile table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'users_profile'
ORDER BY ordinal_position;

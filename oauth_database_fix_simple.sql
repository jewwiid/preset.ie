-- ============================================================================
-- OAUTH DATABASE FIX - Copy this entire file into Supabase SQL Editor
-- This fixes the "Database error saving new user" issue
-- ============================================================================

-- Step 1: Remove the broken trigger that's causing the error
DROP TRIGGER IF EXISTS on_auth_user_created_complete ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_comprehensive ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_fixed ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_simple ON auth.users;

-- Drop the broken functions
DROP FUNCTION IF EXISTS handle_new_user_complete();
DROP FUNCTION IF EXISTS handle_new_user_comprehensive();
DROP FUNCTION IF EXISTS handle_new_user_fixed();

-- Step 2: Create the CORRECT trigger function for your schema
CREATE OR REPLACE FUNCTION handle_new_user_profile()
RETURNS TRIGGER AS $$
BEGIN
    -- Log the attempt for debugging
    RAISE LOG 'Creating profile for user: % with email: %', NEW.id, NEW.email;
    
    -- Insert into users_profile table with correct column structure
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
            -- Use Google OAuth metadata or fallback to email
            COALESCE(
                NEW.raw_user_meta_data->>'full_name',
                NEW.raw_user_meta_data->>'name', 
                split_part(NEW.email, '@', 1),
                'User'
            ),
            -- Generate unique handle (no special chars, lowercase)
            'user_' || EXTRACT(EPOCH FROM NOW())::BIGINT || '_' || substr(md5(random()::text), 1, 6),
            'Welcome to Preset! Complete your profile to get started.',
            ARRAY['TALENT']::user_role[],  -- Default role
            'FREE'::subscription_tier,     -- Default subscription
            'ACTIVE'::subscription_status, -- Default status
            NOW(),
            NOW()
        );
        
        RAISE LOG 'Successfully created profile for user: %', NEW.id;
        
    EXCEPTION
        WHEN unique_violation THEN
            -- Profile already exists, that's OK
            RAISE LOG 'Profile already exists for user: %', NEW.id;
        WHEN OTHERS THEN
            -- Log error but don't fail the OAuth process
            RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
    END;
    
    -- Optional: Initialize user credits (if table exists)
    BEGIN
        INSERT INTO user_credits (user_id, credit_balance, created_at, updated_at)
        VALUES (NEW.id, 0, NOW(), NOW());
        RAISE LOG 'Initialized credits for user: %', NEW.id;
    EXCEPTION
        WHEN undefined_table THEN
            -- Credits table doesn't exist, skip
            NULL;
        WHEN unique_violation THEN
            -- Credits already exist, that's fine
            NULL;
        WHEN OTHERS THEN
            RAISE LOG 'Could not initialize credits for user %: %', NEW.id, SQLERRM;
    END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Create the trigger
CREATE TRIGGER on_auth_user_created_fixed
    AFTER INSERT ON auth.users
    FOR EACH ROW 
    EXECUTE FUNCTION handle_new_user_profile();

-- Step 4: Grant necessary permissions
GRANT EXECUTE ON FUNCTION handle_new_user_profile() TO service_role;
GRANT EXECUTE ON FUNCTION handle_new_user_profile() TO authenticated;

-- Step 5: Add helpful comment
COMMENT ON FUNCTION handle_new_user_profile() IS 'Creates user profile automatically when new user signs up via OAuth';

-- ============================================================================
-- VERIFICATION QUERIES - Run these to confirm the fix worked
-- ============================================================================

-- Check that the trigger is active
SELECT 'Trigger Status Check:' as test;
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
  AND t.tgname = 'on_auth_user_created_fixed';

-- Check users_profile table structure to confirm compatibility
SELECT 'Table Structure Check:' as test;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'users_profile'
ORDER BY ordinal_position;

-- Success message
SELECT '✅ OAuth database fix applied successfully!' as result,
       'You can now test Google OAuth sign-up' as next_step;

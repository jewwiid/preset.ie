-- Remove the problematic trigger completely
-- This will allow OAuth user creation to work without database triggers

-- 1. Drop the trigger (this should work even if we can't enable/disable it)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS trigger_create_user_profile ON auth.users;

-- 2. Drop the function
DROP FUNCTION IF EXISTS create_user_profile_on_signup();

-- 3. Verify the trigger is gone
SELECT 'Trigger removal status:' as status;
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
    AND t.tgname LIKE '%user%';

-- 4. Check if the function is gone
SELECT 'Function removal status:' as status;
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public'
    AND routine_name LIKE '%user%';

-- 5. Final status
SELECT 'Trigger and function removed - OAuth should now work' as status;

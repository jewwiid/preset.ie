-- Enable the OAuth trigger
-- The trigger exists but is disabled (tgenabled = O)

-- 1. Enable the trigger
ALTER TABLE auth.users ENABLE TRIGGER on_auth_user_created;

-- 2. Verify the trigger is now enabled
SELECT 'Trigger status after enabling:' as status;
SELECT 
    t.tgname as trigger_name,
    CASE t.tgenabled 
        WHEN 'O' THEN 'DISABLED' 
        WHEN 'D' THEN 'DISABLED' 
        WHEN 'R' THEN 'ENABLED' 
        WHEN 'A' THEN 'ENABLED' 
        ELSE 'UNKNOWN' 
    END as status,
    t.tgenabled as raw_status
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'auth' 
    AND c.relname = 'users'
    AND t.tgname = 'on_auth_user_created';

-- 3. If the above doesn't work, try recreating the trigger
-- (Sometimes Supabase disables triggers automatically)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_user_profile_on_signup();

-- 4. Final verification
SELECT 'Final trigger status:' as status;
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
    AND t.tgname = 'on_auth_user_created';

-- Simple OAuth Check - Focus on the core issue

-- 1. Check user count
SELECT 'User count in auth.users:' as status, COUNT(*) as count FROM auth.users;

-- 2. Check if trigger exists and is enabled
SELECT 'Trigger status:' as status;
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

-- 3. Check RLS status
SELECT 'RLS status:' as status;
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'auth' 
    AND tablename = 'users';

-- 4. Check RLS policies
SELECT 'RLS policies:' as status;
SELECT 
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE schemaname = 'auth' 
    AND tablename = 'users'
ORDER BY policyname;

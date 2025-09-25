-- Simple diagnostic for auth.users issues
-- Focus on the most important checks

-- 1. Check constraints on auth.users
SELECT 'Constraints on auth.users:' as status;
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE tc.table_name = 'users' 
    AND tc.table_schema = 'auth'
ORDER BY tc.constraint_type, tc.constraint_name;

-- 2. Check triggers on auth.users
SELECT 'Triggers on auth.users:' as status;
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
    AND event_object_schema = 'auth'
ORDER BY trigger_name;

-- 3. Check RLS policies on auth.users
SELECT 'RLS policies on auth.users:' as status;
SELECT 
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE schemaname = 'auth' 
    AND tablename = 'users'
ORDER BY policyname;

-- 4. Check RLS status
SELECT 'RLS status for auth.users:' as status;
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'auth' 
    AND tablename = 'users';

-- 5. Check current user count
SELECT 'Current user count in auth.users:' as status, COUNT(*) as user_count FROM auth.users;

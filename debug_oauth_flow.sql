-- Debug OAuth Flow - Check what's happening during user creation

-- 1. Check if there are any users in auth.users
SELECT 'Current users in auth.users:' as status;
SELECT COUNT(*) as user_count FROM auth.users;

-- 2. Check recent auth events/flow states
SELECT 'Recent flow states:' as status;
SELECT 
    id,
    created_at,
    updated_at,
    auth_code_issued_at
FROM auth.flow_state 
ORDER BY created_at DESC 
LIMIT 5;

-- 3. Check if there are any error logs or audit entries
SELECT 'Recent audit log entries:' as status;
SELECT 
    id,
    created_at,
    instance_id,
    ip_address
FROM auth.audit_log_entries 
ORDER BY created_at DESC 
LIMIT 10;

-- 4. Check if the trigger is actually enabled
SELECT 'Trigger status:' as status;
SELECT 
    t.tgname as trigger_name,
    t.tgenabled,
    pg_get_triggerdef(t.oid) as trigger_definition
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'auth' 
    AND c.relname = 'users'
    AND t.tgname = 'on_auth_user_created';

-- 5. Check if there are any RLS policies blocking operations
SELECT 'RLS policies on auth.users:' as status;
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'auth' 
    AND tablename = 'users'
ORDER BY policyname;

-- 6. Check RLS status
SELECT 'RLS status for auth.users:' as status;
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'auth' 
    AND tablename = 'users';

-- 7. Check if there are any constraints that might be causing issues
SELECT 'Constraints on auth.users:' as status;
SELECT 
    tc.constraint_name,
    tc.constraint_type,
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
WHERE tc.table_name = 'users' 
    AND tc.table_schema = 'auth'
ORDER BY tc.constraint_type, tc.constraint_name;

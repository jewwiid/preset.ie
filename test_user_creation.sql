-- Test user creation to identify the real issue

-- 1. Check current user count
SELECT 'Current user count:' as status, COUNT(*) as count FROM auth.users;

-- 2. Check if there are any users with recent creation dates
SELECT 'Recent users:' as status;
SELECT 
    id,
    email,
    created_at,
    raw_user_meta_data->>'full_name' as full_name,
    raw_app_meta_data->>'provider' as provider
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;

-- 3. Check if there are any users in users_profile
SELECT 'Users in users_profile:' as status, COUNT(*) as count FROM public.users_profile;

-- 4. Check for any constraint violations or errors
SELECT 'Recent audit entries:' as status;
SELECT 
    id,
    created_at,
    instance_id
FROM auth.audit_log_entries 
ORDER BY created_at DESC 
LIMIT 5;

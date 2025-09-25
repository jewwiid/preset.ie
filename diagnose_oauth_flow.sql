-- Diagnose OAuth flow to identify the exact failure point

-- 1. Check if there are any recent OAuth attempts
SELECT 'Recent OAuth flow states:' as status;
SELECT 
    id,
    created_at,
    updated_at,
    auth_code_issued_at
FROM auth.flow_state 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC 
LIMIT 10;

-- 2. Check if there are any recent auth events
SELECT 'Recent auth events:' as status;
SELECT 
    id,
    created_at,
    instance_id
FROM auth.audit_log_entries 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC 
LIMIT 10;

-- 3. Check if there are any users created recently
SELECT 'Recent users:' as status;
SELECT 
    id,
    email,
    created_at,
    raw_app_meta_data->>'provider' as provider,
    raw_user_meta_data->>'full_name' as full_name
FROM auth.users 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC 
LIMIT 5;

-- 4. Check total user count
SELECT 'Total users in auth.users:' as status, COUNT(*) as count FROM auth.users;

-- 5. Check if there are any users with Google provider
SELECT 'Google users count:' as status, COUNT(*) as count 
FROM auth.users 
WHERE raw_app_meta_data->>'provider' = 'google';

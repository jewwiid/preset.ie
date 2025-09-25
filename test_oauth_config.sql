-- Test OAuth configuration
-- Check if there are any configuration issues

-- 1. Check if there are any recent auth errors
SELECT 'Recent auth events:' as status;
SELECT 
    id,
    created_at,
    instance_id
FROM auth.audit_log_entries 
ORDER BY created_at DESC 
LIMIT 10;

-- 2. Check if there are any flow states (OAuth attempts)
SELECT 'Recent flow states:' as status;
SELECT 
    id,
    created_at,
    updated_at
FROM auth.flow_state 
ORDER BY created_at DESC 
LIMIT 5;

-- 3. Check if there are any users at all
SELECT 'Total users:' as status, COUNT(*) as count FROM auth.users;

-- 4. Check if there are any users with Google provider
SELECT 'Google users:' as status;
SELECT 
    id,
    email,
    created_at,
    raw_app_meta_data->>'provider' as provider
FROM auth.users 
WHERE raw_app_meta_data->>'provider' = 'google'
ORDER BY created_at DESC 
LIMIT 5;

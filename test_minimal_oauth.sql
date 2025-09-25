-- Minimal OAuth test to identify the exact failure point

-- 1. Check if there are any recent OAuth attempts (flow states)
SELECT 'Recent OAuth attempts:' as status;
SELECT 
    id,
    created_at,
    updated_at
FROM auth.flow_state 
ORDER BY created_at DESC 
LIMIT 5;

-- 2. Check if there are any recent auth events/errors
SELECT 'Recent auth events:' as status;
SELECT 
    id,
    created_at,
    instance_id
FROM auth.audit_log_entries 
ORDER BY created_at DESC 
LIMIT 5;

-- 3. Check if there are any users at all (not just Google users)
SELECT 'Total users in auth.users:' as status, COUNT(*) as count FROM auth.users;

-- 4. Check if there are any users created in the last 24 hours
SELECT 'Users created in last 24 hours:' as status;
SELECT 
    id,
    email,
    created_at,
    raw_app_meta_data->>'provider' as provider
FROM auth.users 
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

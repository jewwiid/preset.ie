-- Check foreign key relationships for verification_requests table
-- Run in Supabase Dashboard to understand the exact relationships

-- 1. Check table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'verification_requests'
ORDER BY ordinal_position;

-- 2. Check foreign key constraints
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name = 'verification_requests';

-- 3. Check users_profile table structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'users_profile'
AND column_name IN ('id', 'user_id')
ORDER BY ordinal_position;

-- 4. Test the join manually
SELECT 
    vr.id,
    vr.user_id as verification_user_id,
    vr.request_type,
    vr.status,
    up.id as profile_id,
    up.user_id as profile_user_id,
    up.display_name,
    up.handle
FROM verification_requests vr
LEFT JOIN users_profile up ON vr.user_id = up.id
LIMIT 3;

-- 5. Alternative join attempt
SELECT 
    vr.id,
    vr.user_id as verification_user_id,
    vr.request_type,
    vr.status,
    up.id as profile_id,
    up.user_id as profile_user_id,
    up.display_name,
    up.handle
FROM verification_requests vr
LEFT JOIN users_profile up ON vr.user_id = up.user_id
LIMIT 3;
-- Test verification_requests table
-- Run this in Supabase Dashboard SQL Editor to debug the issue

-- Test 1: Check if table exists and has data
SELECT 'Table exists and has data' as test_1, COUNT(*) as record_count FROM verification_requests;

-- Test 2: Check the structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'verification_requests' 
ORDER BY ordinal_position;

-- Test 3: Check sample data
SELECT 
    id,
    user_id,
    request_type,
    status,
    submitted_at,
    additional_data
FROM verification_requests 
LIMIT 5;

-- Test 4: Check the join that's failing
SELECT 
    vr.*,
    up.display_name,
    up.handle
FROM verification_requests vr
LEFT JOIN users_profile up ON vr.user_id = up.id
LIMIT 5;

-- Test 5: Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'verification_requests';

-- Test 6: Disable RLS temporarily to see if that's the issue
ALTER TABLE verification_requests DISABLE ROW LEVEL SECURITY;
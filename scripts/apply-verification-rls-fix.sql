-- Apply production RLS policies for verification_requests
-- Run this directly in Supabase Dashboard SQL Editor

-- Drop any existing policies (safe to run multiple times)
DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can view own verification requests" ON verification_requests;
    DROP POLICY IF EXISTS "Users can create own verification requests" ON verification_requests;
    DROP POLICY IF EXISTS "Admins can manage all verification requests" ON verification_requests;
    DROP POLICY IF EXISTS "admin_view_all_verification_requests" ON verification_requests;
    DROP POLICY IF EXISTS "admin_manage_verification_requests" ON verification_requests;
    DROP POLICY IF EXISTS "user_view_own_verification_requests" ON verification_requests;
    DROP POLICY IF EXISTS "user_create_own_verification_requests" ON verification_requests;
    DROP POLICY IF EXISTS "user_update_own_verification_requests" ON verification_requests;
EXCEPTION
    WHEN OTHERS THEN 
        RAISE NOTICE 'Some policies did not exist: %', SQLERRM;
END $$;

-- Create production-ready policies following the established pattern

-- 1. Admins can view all verification requests (primary use case for admin dashboard)
CREATE POLICY admin_view_all_verification_requests ON verification_requests
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users_profile 
            WHERE user_id = auth.uid()
            AND 'ADMIN' = ANY(role_flags)
        )
    );

-- 2. Admins can manage all verification requests  
CREATE POLICY admin_manage_verification_requests ON verification_requests
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users_profile 
            WHERE user_id = auth.uid()
            AND 'ADMIN' = ANY(role_flags)
        )
    );

-- 3. Users can view their own verification requests
CREATE POLICY user_view_own_verification_requests ON verification_requests
    FOR SELECT  
    USING (
        user_id = (
            SELECT id FROM users_profile 
            WHERE user_id = auth.uid()
        )
    );

-- 4. Users can create their own verification requests
CREATE POLICY user_create_own_verification_requests ON verification_requests
    FOR INSERT
    WITH CHECK (
        user_id = (
            SELECT id FROM users_profile 
            WHERE user_id = auth.uid()
        )
    );

-- 5. Users can update their own verification requests (before review)
CREATE POLICY user_update_own_verification_requests ON verification_requests
    FOR UPDATE
    USING (
        user_id = (
            SELECT id FROM users_profile 
            WHERE user_id = auth.uid()
        )
        AND status = 'pending'  -- Only allow updates to pending requests
    );

-- Verify the policies were created
SELECT 
    policyname,
    cmd,
    permissive,
    roles
FROM pg_policies 
WHERE tablename = 'verification_requests'
ORDER BY policyname;

-- Test the query that VerificationQueue component uses
SELECT 'Testing admin verification query...' as test_status;

-- This should work for admin users now
SELECT 
    vr.id,
    vr.request_type,
    vr.status,
    vr.submitted_at,
    up.display_name,
    up.handle
FROM verification_requests vr
LEFT JOIN users_profile up ON vr.user_id = up.id
ORDER BY vr.submitted_at DESC
LIMIT 3;
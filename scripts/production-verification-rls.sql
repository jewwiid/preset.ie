-- Production-ready RLS policies for verification_requests
-- Fix the root authentication and policy issues

-- Drop the incorrectly configured policies
DROP POLICY IF EXISTS "Users can view own verification requests" ON verification_requests;
DROP POLICY IF EXISTS "Users can create own verification requests" ON verification_requests;
DROP POLICY IF EXISTS "Admins can manage all verification requests" ON verification_requests;

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

-- Test the query that VerificationQueue component uses
SELECT 'Testing VerificationQueue query...' as test_status;

-- This should work now for admin users
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
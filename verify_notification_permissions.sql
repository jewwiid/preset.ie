-- Verify notification_preferences permissions and policies

-- 1. Check table permissions
SELECT
    grantee,
    privilege_type
FROM information_schema.role_table_grants
WHERE table_name = 'notification_preferences'
ORDER BY grantee, privilege_type;

-- 2. Check the INSERT policy details
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    cmd,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies
WHERE tablename = 'notification_preferences'
  AND cmd = 'INSERT';

-- 3. Test if a user can theoretically insert (this will show what the policy evaluates to)
-- Replace 'YOUR_USER_ID' with an actual user ID to test
DO $$
BEGIN
    RAISE NOTICE 'Current auth.uid() would be: %', auth.uid();
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'auth.uid() is not available in this context';
END $$;

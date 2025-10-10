-- Add admin policy to view all verification documents
-- Uses auth.users table with role column

-- First, verify the users table structure (check if role column exists)
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users_profile'
  AND column_name IN ('role', 'role_flags', 'is_admin');

-- If role is in users_profile, use this admin policy:
CREATE POLICY "Admins can view all verification docs"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'verification-documents' AND
    EXISTS (
        SELECT 1 FROM public.users_profile
        WHERE users_profile.user_id = auth.uid()
        AND 'ADMIN' = ANY(users_profile.role_flags)
    )
);

-- Verify all policies
SELECT
    policyname,
    cmd,
    roles
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND (qual LIKE '%verification-documents%' OR with_check LIKE '%verification-documents%')
ORDER BY cmd, policyname;

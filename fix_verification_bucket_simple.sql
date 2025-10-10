-- Secure verification-documents bucket policies (SIMPLIFIED)
-- Prevents users from modifying/deleting docs after submission
-- Skip admin policy for now - can add later once we know the table name

-- Ensure bucket is PRIVATE
UPDATE storage.buckets
SET public = false
WHERE name = 'verification-documents';

-- Drop existing policies
DROP POLICY IF EXISTS "Users can delete verification docs" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload verification docs" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own verification docs" ON storage.objects;
DROP POLICY IF EXISTS "Users can update verification docs" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all verification docs" ON storage.objects;

-- Policy 1: Users can upload verification documents (INSERT only)
CREATE POLICY "Users can upload verification docs"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'verification-documents' AND
    auth.uid()::text = (storage.foldername(name))[1] AND
    storage.extension(name) = ANY (ARRAY['jpg', 'jpeg', 'png', 'pdf'])
);

-- Policy 2: Users can view ONLY their own verification documents
CREATE POLICY "Users can view own verification docs"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'verification-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

-- NO UPDATE policy - once uploaded, cannot be modified
-- NO DELETE policy - once uploaded, cannot be deleted (audit trail)
-- Admin policy can be added later once we identify the correct users table

-- Verify the secure configuration
SELECT
    name,
    public,
    file_size_limit
FROM storage.buckets
WHERE name = 'verification-documents';

-- Show policies
SELECT
    policyname,
    cmd,
    roles
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND (qual LIKE '%verification-documents%' OR with_check LIKE '%verification-documents%')
ORDER BY cmd, policyname;

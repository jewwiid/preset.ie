-- FIXED BUCKET POLICIES - CORRECT SYNTAX FOR ARRAY COLUMNS
-- Copy and paste this into Supabase Dashboard > SQL Editor

-- =============================================================================
-- USER-MEDIA BUCKET POLICIES
-- =============================================================================

-- Policy 1: Users can upload to user-media bucket
CREATE POLICY "Users can upload to user-media" ON storage.objects
FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'user-media' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 2: Users can update their own files in user-media
CREATE POLICY "Users can update their own user-media files" ON storage.objects
FOR UPDATE 
TO authenticated
USING (
  bucket_id = 'user-media' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 3: Users can delete their own files in user-media
CREATE POLICY "Users can delete their own user-media files" ON storage.objects
FOR DELETE 
TO authenticated
USING (
  bucket_id = 'user-media' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 4: Public read access for user-media
CREATE POLICY "Public read access for user-media" ON storage.objects
FOR SELECT 
TO public
USING (bucket_id = 'user-media');

-- =============================================================================
-- VERIFICATION-DOCUMENTS BUCKET POLICIES
-- =============================================================================

-- Policy 1: Users can upload verification documents
CREATE POLICY "Users can upload verification documents" ON storage.objects
FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'verification-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 2: Users can update their own verification documents
CREATE POLICY "Users can update their own verification documents" ON storage.objects
FOR UPDATE 
TO authenticated
USING (
  bucket_id = 'verification-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 3: Users can delete their own verification documents
CREATE POLICY "Users can delete their own verification documents" ON storage.objects
FOR DELETE 
TO authenticated
USING (
  bucket_id = 'verification-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 4: Users can view their own verification documents
CREATE POLICY "Users can view their own verification documents" ON storage.objects
FOR SELECT 
TO authenticated
USING (
  bucket_id = 'verification-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 5: Admins can view all verification documents (FIXED SYNTAX)
CREATE POLICY "Admins can view all verification documents" ON storage.objects
FOR SELECT 
TO authenticated
USING (
  bucket_id = 'verification-documents' 
  AND EXISTS (
    SELECT 1 FROM users_profile 
    WHERE user_id = auth.uid() 
    AND 'ADMIN' = ANY(role_flags)
  )
);

-- Policy 6: Admins can manage all verification documents (FIXED SYNTAX)
CREATE POLICY "Admins can manage all verification documents" ON storage.objects
FOR ALL 
TO authenticated
USING (
  bucket_id = 'verification-documents' 
  AND EXISTS (
    SELECT 1 FROM users_profile 
    WHERE user_id = auth.uid() 
    AND 'ADMIN' = ANY(role_flags)
  )
)
WITH CHECK (
  bucket_id = 'verification-documents' 
  AND EXISTS (
    SELECT 1 FROM users_profile 
    WHERE user_id = auth.uid() 
    AND 'ADMIN' = ANY(role_flags)
  )
);

-- =============================================================================
-- VERIFICATION: Check all policies were created
-- =============================================================================

SELECT 
  policyname,
  cmd,
  CASE 
    WHEN policyname ILIKE '%user-media%' THEN 'USER-MEDIA'
    WHEN policyname ILIKE '%verification%' THEN 'VERIFICATION-DOCUMENTS'  
    WHEN policyname ILIKE '%profile%' THEN 'PROFILE-IMAGES'
    WHEN policyname ILIKE '%moodboard%' THEN 'MOODBOARD-IMAGES'
    ELSE 'OTHER'
  END as bucket_category
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
ORDER BY bucket_category, cmd;
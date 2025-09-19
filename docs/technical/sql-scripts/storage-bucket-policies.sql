-- RLS Policies for Storage Buckets
-- Run these in your Supabase SQL Editor

-- ==============================================
-- MOODBOARD-UPLOADS BUCKET POLICIES
-- ==============================================

-- Policy 1: Users can upload to their own folder in moodboard-uploads
CREATE POLICY "Users can upload to their own folder" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'moodboard-uploads' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 2: Users can view their own uploads in moodboard-uploads
CREATE POLICY "Users can view their own uploads" ON storage.objects
FOR SELECT USING (
  bucket_id = 'moodboard-uploads' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 3: Users can update their own uploads in moodboard-uploads
CREATE POLICY "Users can update their own uploads" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'moodboard-uploads' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 4: Users can delete their own uploads in moodboard-uploads
CREATE POLICY "Users can delete their own uploads" ON storage.objects
FOR DELETE USING (
  bucket_id = 'moodboard-uploads' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ==============================================
-- PLAYGROUND-GALLERY BUCKET POLICIES
-- ==============================================

-- Policy 5: Users can upload to their own folder in playground-gallery
CREATE POLICY "Users can upload to their own folder in playground" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'playground-gallery' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 6: Users can view their own uploads in playground-gallery
CREATE POLICY "Users can view their own uploads in playground" ON storage.objects
FOR SELECT USING (
  bucket_id = 'playground-gallery' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 7: Users can update their own uploads in playground-gallery
CREATE POLICY "Users can update their own uploads in playground" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'playground-gallery' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 8: Users can delete their own uploads in playground-gallery
CREATE POLICY "Users can delete their own uploads in playground" ON storage.objects
FOR DELETE USING (
  bucket_id = 'playground-gallery' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ==============================================
-- PUBLIC READ ACCESS FOR SHOWCASES
-- ==============================================

-- Policy 9: Public read access for showcase images (if stored in moodboard-uploads)
-- This allows showcase images to be viewed by anyone
CREATE POLICY "Public can view showcase images" ON storage.objects
FOR SELECT USING (
  bucket_id = 'moodboard-uploads' 
  AND EXISTS (
    SELECT 1 FROM showcase_media sm 
    WHERE sm.image_url LIKE '%' || name || '%'
  )
);

-- Policy 10: Public read access for playground gallery images used in showcases
CREATE POLICY "Public can view playground showcase images" ON storage.objects
FOR SELECT USING (
  bucket_id = 'playground-gallery' 
  AND EXISTS (
    SELECT 1 FROM showcase_media sm 
    WHERE sm.image_url LIKE '%' || name || '%'
  )
);

-- ==============================================
-- ADMIN ACCESS POLICIES (Optional)
-- ==============================================

-- Policy 11: Admins can view all files (if you have admin role system)
CREATE POLICY "Admins can view all files" ON storage.objects
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM users_profile up 
    WHERE up.user_id = auth.uid() 
    AND 'admin' = ANY(up.role_flags)
  )
);

-- Policy 12: Admins can delete any files (if you have admin role system)
CREATE POLICY "Admins can delete any files" ON storage.objects
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM users_profile up 
    WHERE up.user_id = auth.uid() 
    AND 'admin' = ANY(up.role_flags)
  )
);

-- ==============================================
-- NOTES:
-- ==============================================
-- 
-- 1. These policies assume your storage buckets are organized as:
--    - moodboard-uploads/{user_id}/filename.ext
--    - playground-gallery/{user_id}/filename.ext
--
-- 2. The policies use auth.uid() to get the current user's ID
--
-- 3. Public read access is granted for images that are referenced in showcases
--
-- 4. Admin policies are optional and depend on your role system
--
-- 5. Make sure RLS is enabled on storage.objects:
--    ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
--
-- 6. To check if RLS is enabled:
--    SELECT schemaname, tablename, rowsecurity 
--    FROM pg_tables 
--    WHERE tablename = 'objects' AND schemaname = 'storage';

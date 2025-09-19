-- Simple Storage Bucket Policies Setup
-- Run this in your Supabase SQL Editor

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- MOODBOARD-UPLOADS BUCKET POLICIES
-- ==============================================

-- Users can upload to their own folder
CREATE POLICY "Users can upload to moodboard-uploads" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'moodboard-uploads' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can view their own uploads
CREATE POLICY "Users can view moodboard-uploads" ON storage.objects
FOR SELECT USING (
  bucket_id = 'moodboard-uploads' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can update their own uploads
CREATE POLICY "Users can update moodboard-uploads" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'moodboard-uploads' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete their own uploads
CREATE POLICY "Users can delete moodboard-uploads" ON storage.objects
FOR DELETE USING (
  bucket_id = 'moodboard-uploads' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ==============================================
-- PLAYGROUND-GALLERY BUCKET POLICIES
-- ==============================================

-- Users can upload to their own folder
CREATE POLICY "Users can upload to playground-gallery" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'playground-gallery' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can view their own uploads
CREATE POLICY "Users can view playground-gallery" ON storage.objects
FOR SELECT USING (
  bucket_id = 'playground-gallery' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can update their own uploads
CREATE POLICY "Users can update playground-gallery" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'playground-gallery' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete their own uploads
CREATE POLICY "Users can delete playground-gallery" ON storage.objects
FOR DELETE USING (
  bucket_id = 'playground-gallery' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ==============================================
-- PUBLIC READ ACCESS FOR SHOWCASES
-- ==============================================

-- Public can view images used in showcases (moodboard-uploads)
CREATE POLICY "Public can view showcase images from moodboard" ON storage.objects
FOR SELECT USING (
  bucket_id = 'moodboard-uploads' 
  AND EXISTS (
    SELECT 1 FROM showcase_media sm 
    WHERE sm.image_url LIKE '%' || name || '%'
  )
);

-- Public can view images used in showcases (playground-gallery)
CREATE POLICY "Public can view showcase images from playground" ON storage.objects
FOR SELECT USING (
  bucket_id = 'playground-gallery' 
  AND EXISTS (
    SELECT 1 FROM showcase_media sm 
    WHERE sm.image_url LIKE '%' || name || '%'
  )
);

-- ==============================================
-- VERIFICATION
-- ==============================================

-- Check if policies were created successfully
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
ORDER BY policyname;

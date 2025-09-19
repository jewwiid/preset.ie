-- RLS Policies for playground-gallery storage bucket
-- Run this in your Supabase SQL Editor

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can upload to their own folder
CREATE POLICY "Users can upload to own folder" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'playground-gallery' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 2: Users can view their own images
CREATE POLICY "Users can view own images" ON storage.objects
FOR SELECT USING (
  bucket_id = 'playground-gallery' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 3: Users can delete their own images
CREATE POLICY "Users can delete own images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'playground-gallery' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 4: Anyone can view public images (optional - for sharing)
CREATE POLICY "Anyone can view public images" ON storage.objects
FOR SELECT USING (
  bucket_id = 'playground-gallery'
);

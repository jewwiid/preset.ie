-- Fix storage policies for user-media bucket
-- Generated on 2025-09-09T08:08:36.729Z

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DO $$ 
BEGIN
    -- Drop policies if they exist
    DROP POLICY IF EXISTS "Auth users can upload to user-media" ON storage.objects;
    DROP POLICY IF EXISTS "Anyone can view user-media files" ON storage.objects;
    DROP POLICY IF EXISTS "Users can update own files in user-media" ON storage.objects;
    DROP POLICY IF EXISTS "Users can delete own files in user-media" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated users can upload to user-media" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated users can upload media" ON storage.objects;
    DROP POLICY IF EXISTS "Anyone can view user-media" ON storage.objects;
    DROP POLICY IF EXISTS "Users can update own media" ON storage.objects;
    DROP POLICY IF EXISTS "Users can delete own media" ON storage.objects;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

-- Create new comprehensive policies
CREATE POLICY "Auth users can upload to user-media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'user-media');

CREATE POLICY "Anyone can view user-media files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'user-media');

CREATE POLICY "Users can update own files in user-media"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'user-media' AND auth.uid()::text = owner::text)
WITH CHECK (bucket_id = 'user-media');

CREATE POLICY "Users can delete own files in user-media"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'user-media' AND auth.uid()::text = owner::text);

-- Ensure bucket is public
UPDATE storage.buckets 
SET public = true 
WHERE name = 'user-media';

-- Fix RLS policies for profile-images storage bucket
-- This allows users to upload their own avatars and banners

-- First, check if the bucket exists
SELECT name, public FROM storage.buckets WHERE name = 'profile-images';

-- If it doesn't exist, create it
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can upload their own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view profile images" ON storage.objects;

-- Policy 1: Users can upload files to their own folder
CREATE POLICY "Users can upload their own profile images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'profile-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 2: Users can update their own files
CREATE POLICY "Users can update their own profile images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'profile-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
    bucket_id = 'profile-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 3: Users can delete their own files
CREATE POLICY "Users can delete their own profile images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'profile-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 4: Anyone can view profile images (public bucket)
CREATE POLICY "Anyone can view profile images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'profile-images');

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON storage.objects TO authenticated;
GRANT SELECT ON storage.objects TO anon;

-- Verify policies
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename = 'objects'
  AND policyname LIKE '%profile images%'
ORDER BY policyname;

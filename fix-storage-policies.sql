-- Fix storage policies for user-media bucket
-- Run this in Supabase SQL Editor

-- First, ensure the bucket exists and is public
UPDATE storage.buckets 
SET public = true 
WHERE name = 'user-media';

-- Drop all existing policies for the bucket
DROP POLICY IF EXISTS "Users can upload their own media" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own media" ON storage.objects;
DROP POLICY IF EXISTS "Public can view media" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own media" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own media" ON storage.objects;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON storage.objects;
DROP POLICY IF EXISTS "Enable read access for all users" ON storage.objects;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON storage.objects;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload media" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view user-media" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own media" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own media" ON storage.objects;

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create comprehensive policies for user-media bucket

-- 1. Allow authenticated users to upload files to user-media bucket
CREATE POLICY "Auth users can upload to user-media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-media'
);

-- 2. Allow anyone to view files in user-media bucket (public bucket)
CREATE POLICY "Anyone can view user-media files"
ON storage.objects FOR SELECT
TO public
USING (
  bucket_id = 'user-media'
);

-- 3. Allow users to update their own files
CREATE POLICY "Users can update own files in user-media"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'user-media' 
  AND (auth.uid()::text = owner::text OR owner IS NULL)
)
WITH CHECK (
  bucket_id = 'user-media'
);

-- 4. Allow users to delete their own files
CREATE POLICY "Users can delete own files in user-media"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'user-media' 
  AND (auth.uid()::text = owner::text OR owner IS NULL)
);

-- Verify the policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
ORDER BY policyname;

-- Check bucket configuration
SELECT 
  id,
  name,
  owner,
  created_at,
  updated_at,
  public,
  avif_autodetection,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE name = 'user-media';
-- ============================================
-- STORAGE POLICY FIX FOR MOODBOARD UPLOADS
-- ============================================
-- Copy and paste this entire script into your Supabase SQL Editor
-- URL: https://supabase.com/dashboard/project/zbsmgymyfhnwjdnmlelr/sql/new

-- Step 1: Ensure bucket exists and is public
-- ============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('user-media', 'user-media', true, 52428800, ARRAY['image/*', 'video/*'])
ON CONFLICT (id) DO UPDATE
SET public = true,
    file_size_limit = 52428800,
    allowed_mime_types = ARRAY['image/*', 'video/*'];

-- Step 2: Enable RLS on storage.objects
-- ============================================
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Step 3: Drop ALL existing policies for clean slate
-- ============================================
DO $$ 
DECLARE
    pol record;
BEGIN
    -- Find and drop all policies on storage.objects
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects'
        AND policyname LIKE '%user-media%' OR policyname LIKE '%media%' OR policyname LIKE '%upload%'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
    END LOOP;
END $$;

-- Step 4: Create simple, working policies
-- ============================================

-- Policy 1: Anyone authenticated can upload to user-media
CREATE POLICY "upload_to_user_media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'user-media');

-- Policy 2: Anyone can view files in user-media (public bucket)
CREATE POLICY "view_user_media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'user-media');

-- Policy 3: Users can update their own files
CREATE POLICY "update_own_user_media"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'user-media' AND (auth.uid()::text = owner::text OR owner IS NULL))
WITH CHECK (bucket_id = 'user-media');

-- Policy 4: Users can delete their own files
CREATE POLICY "delete_own_user_media"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'user-media' AND (auth.uid()::text = owner::text OR owner IS NULL));

-- Step 5: Verify the setup
-- ============================================
SELECT 'Bucket Configuration:' as info;
SELECT name, public, file_size_limit, allowed_mime_types 
FROM storage.buckets 
WHERE name = 'user-media';

SELECT '' as separator;
SELECT 'Storage Policies Created:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND policyname IN ('upload_to_user_media', 'view_user_media', 'update_own_user_media', 'delete_own_user_media')
ORDER BY policyname;

-- Step 6: Grant necessary permissions
-- ============================================
GRANT ALL ON storage.objects TO authenticated;
GRANT SELECT ON storage.objects TO anon;

-- Success message
SELECT '✅ Storage policies have been configured successfully!' as result;
SELECT '✅ Users should now be able to upload images to moodboards!' as result;
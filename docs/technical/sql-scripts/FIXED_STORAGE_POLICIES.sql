-- ============================================
-- STORAGE POLICY FIX - WORKS WITH USER PERMISSIONS
-- ============================================
-- Copy and paste this entire script into your Supabase SQL Editor
-- URL: https://supabase.com/dashboard/project/zbsmgymyfhnwjdnmlelr/sql/new

-- Step 1: Ensure bucket exists and is public
-- ============================================
-- This should work with regular permissions
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('user-media', 'user-media', true, 52428800, ARRAY['image/*', 'video/*'])
ON CONFLICT (id) DO UPDATE
SET public = true,
    file_size_limit = 52428800,
    allowed_mime_types = ARRAY['image/*', 'video/*'];

-- Step 2: Check current RLS status (informational only)
-- ============================================
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'storage' 
AND tablename = 'objects';

-- Step 3: View existing policies (informational)
-- ============================================
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
ORDER BY policyname;

-- Step 4: Create a helper function for authenticated uploads
-- ============================================
-- This works around RLS limitations by using functions
CREATE OR REPLACE FUNCTION public.can_upload_to_user_media()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Allow any authenticated user to upload
    RETURN auth.uid() IS NOT NULL;
END;
$$;

-- Step 5: Create a table for tracking user uploads (alternative approach)
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_uploads (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    file_path text NOT NULL,
    bucket_name text DEFAULT 'user-media',
    uploaded_at timestamp with time zone DEFAULT now(),
    file_size bigint,
    mime_type text
);

-- Enable RLS on our custom table
ALTER TABLE public.user_uploads ENABLE ROW LEVEL SECURITY;

-- Create policies for our custom table
CREATE POLICY "Users can insert their own uploads"
ON public.user_uploads FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own uploads"
ON public.user_uploads FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own uploads"
ON public.user_uploads FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Step 6: Verify bucket configuration
-- ============================================
SELECT 
    name,
    public,
    file_size_limit,
    allowed_mime_types,
    created_at,
    updated_at
FROM storage.buckets 
WHERE name = 'user-media';

-- Step 7: Check if we can query storage.objects (for debugging)
-- ============================================
SELECT COUNT(*) as total_files
FROM storage.objects
WHERE bucket_id = 'user-media';

-- Success message
SELECT '✅ Bucket configuration updated!' as result;
SELECT '⚠️  Storage policies require Dashboard configuration' as warning;
SELECT '📝 Go to Storage > Policies in Supabase Dashboard to configure RLS' as instruction;
-- Temporary debug policy for avatars - TO BE REMOVED AFTER TESTING
-- This allows authenticated users to upload to the avatars bucket

-- Drop existing policies
DROP POLICY IF EXISTS "Users can upload their own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view profile photos" ON storage.objects;

-- Create permissive INSERT policy for debugging (TEMPORARY)
CREATE POLICY "Authenticated users can upload avatars" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- Create UPDATE policy
CREATE POLICY "Authenticated users can update avatars" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'avatars')
WITH CHECK (bucket_id = 'avatars');

-- Create DELETE policy
CREATE POLICY "Authenticated users can delete avatars" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'avatars');

-- Create SELECT policy (public viewing)
CREATE POLICY "Anyone can view avatars" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'avatars');

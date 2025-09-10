-- Storage RLS Policies for all buckets
-- Ensures secure access to storage objects

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Profile Photos Policies
CREATE POLICY "Anyone can view profile photos 1"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-photos');

CREATE POLICY "Users can upload own profile photo 1"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update own profile photo 1"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own profile photo 1"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- User Media Policies
CREATE POLICY "Anyone can view user media 1"
ON storage.objects FOR SELECT
USING (bucket_id = 'user-media');

CREATE POLICY "Users can upload own media 1"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-media' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update own media 1"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'user-media' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own media 1"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'user-media' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Moodboard Images Policies
CREATE POLICY "Anyone can view moodboard images 1"
ON storage.objects FOR SELECT
USING (bucket_id = 'moodboard-images');

CREATE POLICY "Authenticated can upload moodboard images 1"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'moodboard-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update own moodboard images 1"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'moodboard-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own moodboard images 1"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'moodboard-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
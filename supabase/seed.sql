-- Seed file for Supabase Storage Buckets
-- This ensures buckets are created on fresh database setup

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('profile-photos', 'profile-photos', true, 5242880, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']),
  ('user-media', 'user-media', true, 10485760, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime']),
  ('moodboard-images', 'moodboard-images', true, 5242880, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- RLS Policies for profile-photos bucket
CREATE POLICY "Anyone can view profile photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'profile-photos');

CREATE POLICY "Users can upload own profile photo" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'profile-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update own profile photo" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'profile-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own profile photo" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'profile-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- RLS Policies for user-media bucket  
CREATE POLICY "Anyone can view user media" ON storage.objects
  FOR SELECT USING (bucket_id = 'user-media');

CREATE POLICY "Users can upload own media" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'user-media' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update own media" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'user-media' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own media" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'user-media' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- RLS Policies for moodboard-images bucket
CREATE POLICY "Anyone can view moodboard images" ON storage.objects
  FOR SELECT USING (bucket_id = 'moodboard-images');

CREATE POLICY "Authenticated users can upload moodboard images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'moodboard-images');

CREATE POLICY "Users can update own moodboard images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'moodboard-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own moodboard images" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'moodboard-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
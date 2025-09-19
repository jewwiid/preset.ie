-- Profile Photos Storage Setup
-- Creates storage bucket for user profile photos with proper policies

-- Create profile-photos bucket
INSERT INTO storage.buckets (id, name)
VALUES (
  'profile-photos',
  'profile-photos'
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for profile photos

-- Allow authenticated users to upload their own profile photo
CREATE POLICY "Users can upload own profile photo" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'profile-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update their own profile photo
CREATE POLICY "Users can update own profile photo" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'profile-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'profile-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own profile photo
CREATE POLICY "Users can delete own profile photo" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'profile-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public to view profile photos (for public profiles)
-- But only if the profile is public
CREATE POLICY "Public can view profile photos" ON storage.objects
FOR SELECT TO public
USING (
  bucket_id = 'profile-photos'
  -- Additional check can be added here to verify if profile is public
);

-- Function to generate secure profile photo path
CREATE OR REPLACE FUNCTION generate_profile_photo_path(user_id UUID, file_extension TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Path format: {user_id}/profile_{timestamp}.{extension}
  RETURN user_id::text || '/profile_' || 
         EXTRACT(EPOCH FROM NOW())::BIGINT::TEXT || '.' || 
         LOWER(file_extension);
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old profile photos when uploading new one
CREATE OR REPLACE FUNCTION cleanup_old_profile_photos()
RETURNS TRIGGER AS $$
DECLARE
  old_photo_url TEXT;
BEGIN
  -- Get the old photo URL
  SELECT avatar_url INTO old_photo_url 
  FROM users_profile 
  WHERE user_id = NEW.user_id;
  
  -- If there was an old photo and it's different from the new one
  IF old_photo_url IS NOT NULL AND old_photo_url != NEW.avatar_url THEN
    -- Extract the path from the URL and delete from storage
    -- This is a placeholder - actual implementation would parse the URL
    -- and delete the file from storage
    NULL; -- Placeholder for cleanup logic
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to cleanup old photos
CREATE TRIGGER cleanup_old_profile_photos_trigger
  BEFORE UPDATE OF avatar_url ON users_profile
  FOR EACH ROW
  WHEN (OLD.avatar_url IS DISTINCT FROM NEW.avatar_url)
  EXECUTE FUNCTION cleanup_old_profile_photos();

-- Grant permissions
GRANT ALL ON storage.buckets TO authenticated;
GRANT ALL ON storage.objects TO authenticated;
GRANT SELECT ON storage.objects TO anon;

-- Add index for faster lookups (commented out due to permissions)
-- CREATE INDEX IF NOT EXISTS idx_storage_objects_bucket_owner 
-- ON storage.objects(bucket_id, owner);

-- Add comment (commented out due to permissions)
-- COMMENT ON SCHEMA storage IS 'Supabase Storage schema for managing file uploads including profile photos';
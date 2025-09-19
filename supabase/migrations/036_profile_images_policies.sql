-- RLS policies for profile-images bucket
-- Note: Bucket already created via API

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile images" ON storage.objects;

-- Create RLS policies for profile-images bucket
CREATE POLICY "Users can view all profile images" ON storage.objects
FOR SELECT USING (bucket_id = 'profile-images');

CREATE POLICY "Users can upload their own profile images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'profile-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own profile images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'profile-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own profile images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'profile-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create a function to get user profile image URL
CREATE OR REPLACE FUNCTION get_user_profile_image_url(user_id UUID)
RETURNS TEXT AS $$
DECLARE
  image_url TEXT;
BEGIN
  SELECT 
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM storage.objects 
        WHERE bucket_id = 'profile-images' 
        AND name LIKE user_id::text || '/%'
        ORDER BY created_at DESC 
        LIMIT 1
      ) THEN
        (SELECT 
          'https://zbsmgymyfhnwjdnmlelr.supabase.co/storage/v1/object/public/profile-images/' || 
          (SELECT name FROM storage.objects 
           WHERE bucket_id = 'profile-images' 
           AND name LIKE user_id::text || '/%'
           ORDER BY created_at DESC 
           LIMIT 1)
        )
      ELSE NULL
    END INTO image_url;
  
  RETURN image_url;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_profile_image_url(UUID) TO authenticated;

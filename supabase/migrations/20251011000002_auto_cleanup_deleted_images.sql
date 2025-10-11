-- Create a function to verify if an image exists in storage
CREATE OR REPLACE FUNCTION check_image_exists_in_bucket(image_url TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  bucket_name TEXT := 'platform-images';
  file_path TEXT;
  file_exists BOOLEAN;
BEGIN
  -- Extract the file path from the URL
  -- URL format: https://[project].supabase.co/storage/v1/object/public/platform-images/[path]
  file_path := substring(image_url from 'platform-images/(.*)$');

  IF file_path IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Check if file exists in storage
  SELECT EXISTS (
    SELECT 1
    FROM storage.objects
    WHERE bucket_id = bucket_name
    AND name = file_path
  ) INTO file_exists;

  RETURN file_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to clean up orphaned platform_images records
CREATE OR REPLACE FUNCTION cleanup_orphaned_platform_images()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER := 0;
  image_record RECORD;
BEGIN
  -- Loop through all platform images
  FOR image_record IN
    SELECT id, image_url FROM platform_images
  LOOP
    -- Check if the image still exists in storage
    IF NOT check_image_exists_in_bucket(image_record.image_url) THEN
      -- Delete the orphaned record
      DELETE FROM platform_images WHERE id = image_record.id;
      deleted_count := deleted_count + 1;

      RAISE NOTICE 'Deleted orphaned image record: % (URL: %)',
        image_record.id, image_record.image_url;
    END IF;
  END LOOP;

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger on storage.objects to clean up platform_images when files are deleted
CREATE OR REPLACE FUNCTION on_storage_object_deleted()
RETURNS TRIGGER AS $$
DECLARE
  deleted_image_url TEXT;
BEGIN
  -- Only process platform-images bucket
  IF OLD.bucket_id = 'platform-images' THEN
    -- Construct the public URL that would be in platform_images table
    deleted_image_url := format(
      'https://%s.supabase.co/storage/v1/object/public/platform-images/%s',
      current_setting('app.settings.project_ref', true),
      OLD.name
    );

    -- Delete any platform_images records pointing to this file
    DELETE FROM platform_images
    WHERE image_url LIKE '%' || OLD.name || '%';

    RAISE NOTICE 'Auto-cleaned platform_images records for deleted file: %', OLD.name;
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_cleanup_platform_images_on_storage_delete ON storage.objects;

-- Create the trigger
CREATE TRIGGER trigger_cleanup_platform_images_on_storage_delete
  AFTER DELETE ON storage.objects
  FOR EACH ROW
  EXECUTE FUNCTION on_storage_object_deleted();

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION check_image_exists_in_bucket(TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION cleanup_orphaned_platform_images() TO authenticated, service_role;

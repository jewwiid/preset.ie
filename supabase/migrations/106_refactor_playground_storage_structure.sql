-- Refactor playground storage to use playground-gallery bucket for all content
-- Structure:
-- playground-gallery/{user-id}/temporary/images/ - Temporary uploaded images (7-day cleanup)
-- playground-gallery/{user-id}/temporary/videos/ - Temporary generated videos (7-day cleanup)
-- playground-gallery/{user-id}/saved/images/ - Permanently saved images
-- playground-gallery/{user-id}/saved/videos/ - Permanently saved videos

-- Update playground-gallery bucket to allow video files
UPDATE storage.buckets
SET
  file_size_limit = 104857600, -- 100MB limit for videos
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'video/quicktime']
WHERE id = 'playground-gallery';

-- Create new cleanup function for playground-gallery temporary content
CREATE OR REPLACE FUNCTION cleanup_playground_temporary_content()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete temporary uploads older than 7 days from playground-gallery bucket
  -- Only cleanup items in /temporary/ folders
  DELETE FROM storage.objects
  WHERE bucket_id = 'playground-gallery'
    AND name LIKE '%/temporary/%'
    AND created_at < NOW() - INTERVAL '7 days';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_playground_temporary_content() IS
  'Cleans up temporary images and videos older than 7 days from playground-gallery bucket. Only affects /temporary/ folders, leaving /saved/ content intact.';

-- Update existing cleanup function to handle old playground-uploads bucket
-- (for backwards compatibility during migration)
CREATE OR REPLACE FUNCTION cleanup_old_playground_uploads()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete temporary uploads older than 7 days from playground-uploads bucket
  -- This function can be removed after all content is migrated to playground-gallery
  DELETE FROM storage.objects
  WHERE bucket_id = 'playground-uploads'
    AND name LIKE '%/base-images/%'
    AND created_at < NOW() - INTERVAL '7 days'
    -- Exclude images that are referenced in saved gallery items
    AND NOT EXISTS (
      SELECT 1 FROM playground_gallery
      WHERE (generation_metadata->>'image_url')::text LIKE '%' || storage.objects.name || '%'
         OR (generation_metadata->>'styled_image_url')::text LIKE '%' || storage.objects.name || '%'
    );

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_old_playground_uploads() IS
  'Legacy cleanup for playground-uploads bucket. Can be removed after migration to playground-gallery structure.';

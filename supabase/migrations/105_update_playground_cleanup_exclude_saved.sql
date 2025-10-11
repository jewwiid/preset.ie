-- Update cleanup function to exclude base images referenced by saved videos
-- This ensures we don't delete base images that are still referenced in gallery

CREATE OR REPLACE FUNCTION cleanup_old_playground_uploads()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete temporary uploads older than 7 days from playground-uploads bucket
  -- Only cleanup base-images (reference images) that are NOT referenced in saved gallery items
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
  'Cleans up temporary reference images (base-images) older than 7 days from playground-uploads bucket. Excludes images referenced in saved gallery items.';

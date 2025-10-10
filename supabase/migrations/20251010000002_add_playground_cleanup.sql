-- Add cleanup mechanism for temporary playground uploads
-- Reference images should be temporary and cleaned up after X days

-- Create a function to clean up old temporary playground uploads
CREATE OR REPLACE FUNCTION cleanup_old_playground_uploads()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete temporary uploads older than 7 days from playground-uploads bucket
  -- Only cleanup base-images (reference images), not saved generations
  DELETE FROM storage.objects
  WHERE bucket_id = 'playground-uploads'
    AND name LIKE '%/base-images/%'
    AND created_at < NOW() - INTERVAL '7 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a scheduled job to run cleanup daily (using pg_cron if available)
-- Note: pg_cron may need to be enabled first
-- If pg_cron is not available, this can be run manually or via a cron job

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION cleanup_old_playground_uploads() TO service_role;

-- Add a comment explaining the function
COMMENT ON FUNCTION cleanup_old_playground_uploads() IS 
  'Cleans up temporary reference images (base-images) older than 7 days from playground-uploads bucket. Does not delete saved generations.';

-- Optional: Create a manual trigger to test the cleanup
-- You can call this manually: SELECT cleanup_old_playground_uploads();


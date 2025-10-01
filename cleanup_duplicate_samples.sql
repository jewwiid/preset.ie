-- Clean up duplicate sample images
-- Remove the newer entries that have null titles (created by verification process)
-- Keep the original manually added samples with proper titles

DELETE FROM preset_images 
WHERE preset_id = '163c2edb-f4b3-4120-824f-e1d068379c3e'
  AND title IS NULL
  AND created_at > '2025-09-30T20:31:44.18082+00:00';

-- Verify the cleanup
SELECT 
  id,
  title,
  result_image_url,
  created_at,
  CASE 
    WHEN title IS NULL THEN 'NEW (should be deleted)'
    ELSE 'ORIGINAL (keep)'
  END as status
FROM preset_images 
WHERE preset_id = '163c2edb-f4b3-4120-824f-e1d068379c3e'
ORDER BY created_at;

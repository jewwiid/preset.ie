-- Set recommended modes for all existing presets
-- Default to 'flexible' for most, but we can set specific ones based on output type

-- Set all IMAGE presets to 'flexible' by default
UPDATE presets
SET technical_settings = jsonb_set(
  COALESCE(technical_settings, '{}'::jsonb),
  '{generation_mode}',
  '"flexible"'
)
WHERE technical_settings->>'generation_mode' IS NULL
  AND (generation_mode = 'image' OR generation_mode = 'both');

-- Set all VIDEO presets to 'text-to-image' (videos are typically text-to-video, no base video input)
UPDATE presets
SET technical_settings = jsonb_set(
  COALESCE(technical_settings, '{}'::jsonb),
  '{generation_mode}',
  '"text-to-image"'
)
WHERE technical_settings->>'generation_mode' IS NULL
  AND generation_mode = 'video';

-- Also update cinematic_presets table
UPDATE cinematic_presets
SET technical_settings = jsonb_set(
  COALESCE(technical_settings, '{}'::jsonb),
  '{generation_mode}',
  '"flexible"'
)
WHERE technical_settings->>'generation_mode' IS NULL
  AND (generation_mode = 'image' OR generation_mode = 'both');

UPDATE cinematic_presets
SET technical_settings = jsonb_set(
  COALESCE(technical_settings, '{}'::jsonb),
  '{generation_mode}',
  '"text-to-image"'
)
WHERE technical_settings->>'generation_mode' IS NULL
  AND generation_mode = 'video';

-- Verify the changes - Count by type
SELECT
    'regular_presets' as table_name,
    COUNT(*) as total_count,
    COUNT(CASE WHEN technical_settings->>'generation_mode' = 'flexible' THEN 1 END) as flexible_count,
    COUNT(CASE WHEN technical_settings->>'generation_mode' = 'text-to-image' THEN 1 END) as text_to_image_count,
    COUNT(CASE WHEN technical_settings->>'generation_mode' = 'image-to-image' THEN 1 END) as image_to_image_count,
    COUNT(CASE WHEN technical_settings->>'generation_mode' IS NULL THEN 1 END) as null_count
FROM presets

UNION ALL

SELECT
    'cinematic_presets' as table_name,
    COUNT(*) as total_count,
    COUNT(CASE WHEN technical_settings->>'generation_mode' = 'flexible' THEN 1 END) as flexible_count,
    COUNT(CASE WHEN technical_settings->>'generation_mode' = 'text-to-image' THEN 1 END) as text_to_image_count,
    COUNT(CASE WHEN technical_settings->>'generation_mode' = 'image-to-image' THEN 1 END) as image_to_image_count,
    COUNT(CASE WHEN technical_settings->>'generation_mode' IS NULL THEN 1 END) as null_count
FROM cinematic_presets;

-- Show ALL updated presets
SELECT
    id,
    name,
    generation_mode as output_type,
    technical_settings->>'generation_mode' as recommended_input_mode,
    category
FROM presets
ORDER BY name;

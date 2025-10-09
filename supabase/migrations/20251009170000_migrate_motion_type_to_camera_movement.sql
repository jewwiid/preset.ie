-- Migrate motionType to cameraMovement in existing presets
-- This updates the JSONB structure in cinematic_settings.video

-- Update presets that have video settings with motionType
UPDATE presets
SET cinematic_settings = jsonb_set(
  jsonb_set(
    cinematic_settings,
    '{video, cameraMovement}',
    CASE
      -- Map old motion types to valid camera movements from database
      WHEN cinematic_settings->'video'->>'motionType' = 'subtle' THEN '"smooth"'::jsonb
      WHEN cinematic_settings->'video'->>'motionType' = 'moderate' THEN '"floating"'::jsonb
      WHEN cinematic_settings->'video'->>'motionType' = 'dynamic' THEN '"tracking-forward"'::jsonb
      WHEN cinematic_settings->'video'->>'motionType' = 'camera_pan' THEN '"pan-right"'::jsonb
      WHEN cinematic_settings->'video'->>'motionType' = 'zoom' THEN '"zoom-in"'::jsonb
      -- Default to smooth if unknown
      ELSE '"smooth"'::jsonb
    END,
    true
  ),
  '{video}',
  (cinematic_settings->'video')::jsonb - 'motionType'::text,
  true
)
WHERE cinematic_settings->'video'->>'motionType' IS NOT NULL;

-- Also update any top-level motionType in cinematic_settings (from old migrations)
UPDATE presets
SET cinematic_settings = cinematic_settings::jsonb - 'motionType'::text
WHERE cinematic_settings->>'motionType' IS NOT NULL;

-- Update generation_metadata in playground_gallery to use camera_movement instead of motion_type
UPDATE playground_gallery
SET generation_metadata = jsonb_set(
  generation_metadata::jsonb - 'motion_type'::text,
  '{camera_movement}',
  CASE
    WHEN generation_metadata->>'motion_type' = 'subtle' THEN '"smooth"'::jsonb
    WHEN generation_metadata->>'motion_type' = 'moderate' THEN '"floating"'::jsonb
    WHEN generation_metadata->>'motion_type' = 'dynamic' THEN '"tracking-forward"'::jsonb
    WHEN generation_metadata->>'motion_type' = 'camera_pan' THEN '"pan-right"'::jsonb
    WHEN generation_metadata->>'motion_type' = 'zoom' THEN '"zoom-in"'::jsonb
    ELSE '"smooth"'::jsonb
  END,
  true
)
WHERE generation_metadata->>'motion_type' IS NOT NULL;

-- Log the changes
DO $$
DECLARE
  preset_count INTEGER;
  gallery_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO preset_count
  FROM presets
  WHERE cinematic_settings->'video'->>'cameraMovement' IS NOT NULL;

  SELECT COUNT(*) INTO gallery_count
  FROM playground_gallery
  WHERE generation_metadata->>'camera_movement' IS NOT NULL;

  RAISE NOTICE 'Migration complete:';
  RAISE NOTICE '  - % presets updated with cameraMovement', preset_count;
  RAISE NOTICE '  - % gallery items updated with camera_movement', gallery_count;
END $$;

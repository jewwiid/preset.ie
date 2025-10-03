-- Add video-specific prompt templates to presets
-- This allows presets to have different prompts for image vs video generation

-- Add new columns for video-specific templates
ALTER TABLE presets
ADD COLUMN IF NOT EXISTS prompt_template_video TEXT,
ADD COLUMN IF NOT EXISTS cinematic_settings JSONB DEFAULT '{}';

-- Add comment to explain the columns
COMMENT ON COLUMN presets.prompt_template IS 'Prompt template for image generation (text-to-image, image-to-image)';
COMMENT ON COLUMN presets.prompt_template_video IS 'Prompt template for video generation (text-to-video, image-to-video). Falls back to prompt_template if null.';
COMMENT ON COLUMN presets.cinematic_settings IS 'Video-specific cinematic settings (camera movements, motion type, etc.)';

-- Update existing presets to have video templates
-- Convert image templates to video-appropriate templates
UPDATE presets
SET prompt_template_video = CASE
  -- Convert "photograph" to "video" with proper word boundaries
  WHEN prompt_template LIKE '%photograph%' THEN
    REGEXP_REPLACE(
      REGEXP_REPLACE(prompt_template, 'photograph', 'video', 'g'),
      'photography', 'video', 'g'
    )
  -- Convert other image terms
  WHEN prompt_template LIKE '%image%' THEN
    REPLACE(prompt_template, 'image', 'video')
  -- If no image-specific terms, prepend with motion context
  ELSE
    'Add motion with ' || prompt_template
END
WHERE prompt_template_video IS NULL
  AND prompt_template IS NOT NULL;

-- Fix common video template issues
UPDATE presets
SET prompt_template_video = REPLACE(prompt_template_video, 'videoy', 'video')
WHERE prompt_template_video LIKE '%videoy%';

UPDATE presets
SET prompt_template_video = REPLACE(prompt_template_video, 'instant film video', 'instant film style video')
WHERE prompt_template_video LIKE '%instant film video%'
  AND prompt_template_video NOT LIKE '%instant film style video%';

-- Add default cinematic settings for instant film presets
UPDATE presets
SET cinematic_settings = jsonb_build_object(
  'enableCinematicMode', true,
  'cameraMovement', 'subtle-pan',
  'shotType', 'medium',
  'focusType', 'soft',
  'lighting', 'natural',
  'motionType', 'smooth'
)
WHERE category = 'style'
  AND (
    name LIKE '%Polaroid%' OR
    name LIKE '%Instax%' OR
    name LIKE '%Instant%' OR
    ai_metadata->>'preset_type' = 'instant_film'
  )
  AND (cinematic_settings IS NULL OR cinematic_settings = '{}');

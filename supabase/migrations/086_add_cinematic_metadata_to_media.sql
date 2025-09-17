-- Add cinematic metadata support to media table
-- This migration adds ai_metadata JSONB column to store cinematic parameters

-- Add ai_metadata column to media table
ALTER TABLE public.media 
ADD COLUMN IF NOT EXISTS ai_metadata JSONB DEFAULT '{}';

-- Add index for efficient querying of cinematic metadata
CREATE INDEX IF NOT EXISTS idx_media_ai_metadata_gin 
ON public.media USING GIN (ai_metadata);

-- Add specific indexes for common cinematic parameter queries using btree for text fields
CREATE INDEX IF NOT EXISTS idx_media_camera_angle 
ON public.media ((ai_metadata->>'cameraAngle'));

CREATE INDEX IF NOT EXISTS idx_media_director_style 
ON public.media ((ai_metadata->>'directorStyle'));

CREATE INDEX IF NOT EXISTS idx_media_lens_type 
ON public.media ((ai_metadata->>'lensType'));

CREATE INDEX IF NOT EXISTS idx_media_lighting_style 
ON public.media ((ai_metadata->>'lightingStyle'));

CREATE INDEX IF NOT EXISTS idx_media_color_palette 
ON public.media ((ai_metadata->>'colorPalette'));

CREATE INDEX IF NOT EXISTS idx_media_aspect_ratio 
ON public.media ((ai_metadata->>'aspectRatio'));

-- Create a function to extract cinematic tags from ai_metadata
CREATE OR REPLACE FUNCTION extract_cinematic_tags(metadata JSONB)
RETURNS TEXT[] AS $$
BEGIN
  RETURN ARRAY[
    metadata->>'cameraAngle',
    metadata->>'lensType',
    metadata->>'shotSize',
    metadata->>'lightingStyle',
    metadata->>'colorPalette',
    metadata->>'directorStyle',
    metadata->>'sceneMood',
    metadata->>'cameraMovement',
    metadata->>'aspectRatio'
  ]::TEXT[];
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add computed column for cinematic tags (for easier searching)
ALTER TABLE public.media 
ADD COLUMN IF NOT EXISTS cinematic_tags TEXT[] 
GENERATED ALWAYS AS (extract_cinematic_tags(ai_metadata)) STORED;

-- Create index on cinematic tags
CREATE INDEX IF NOT EXISTS idx_media_cinematic_tags_gin 
ON public.media USING GIN (cinematic_tags);

-- Add comment explaining the ai_metadata structure
COMMENT ON COLUMN public.media.ai_metadata IS 'JSONB field storing cinematic parameters and AI generation metadata including camera angle, lens type, lighting style, director style, etc.';

-- Example ai_metadata structure:
-- {
--   "cameraAngle": "low-angle",
--   "lensType": "35mm",
--   "shotSize": "medium-shot",
--   "depthOfField": "shallow-focus",
--   "compositionTechnique": "rule-of-thirds",
--   "lightingStyle": "chiaroscuro",
--   "colorPalette": "warm-golden",
--   "directorStyle": "wes-anderson",
--   "eraEmulation": "kodak-portra-400",
--   "sceneMood": "romantic",
--   "cameraMovement": "static",
--   "aspectRatio": "16:9",
--   "timeSetting": "dusk",
--   "weather": "overcast",
--   "location": "urban-street",
--   "enhancementType": "style",
--   "enhancementPrompt": "cinematic portrait with warm lighting",
--   "aiProvider": "nanobanana",
--   "generationCost": 0.025,
--   "generatedAt": "2024-01-15T10:30:00Z"
-- }

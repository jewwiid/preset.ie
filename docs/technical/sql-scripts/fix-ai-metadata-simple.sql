-- Fix Missing ai_metadata Column - Simple Version
-- This adds the missing ai_metadata column to the media table without generated columns

-- Add ai_metadata column to media table if it doesn't exist
ALTER TABLE media 
ADD COLUMN IF NOT EXISTS ai_metadata JSONB DEFAULT '{}';

-- Add index for efficient querying of ai_metadata
CREATE INDEX IF NOT EXISTS idx_media_ai_metadata_gin 
ON media USING GIN (ai_metadata);

-- Add specific indexes for common cinematic parameter queries
CREATE INDEX IF NOT EXISTS idx_media_camera_angle 
ON media ((ai_metadata->>'cameraAngle'));

CREATE INDEX IF NOT EXISTS idx_media_director_style 
ON media ((ai_metadata->>'directorStyle'));

CREATE INDEX IF NOT EXISTS idx_media_lens_type 
ON media ((ai_metadata->>'lensType'));

CREATE INDEX IF NOT EXISTS idx_media_lighting_style 
ON media ((ai_metadata->>'lightingStyle'));

CREATE INDEX IF NOT EXISTS idx_media_color_palette 
ON media ((ai_metadata->>'colorPalette'));

CREATE INDEX IF NOT EXISTS idx_media_aspect_ratio 
ON media ((ai_metadata->>'aspectRatio'));

-- Add comment explaining the ai_metadata structure
COMMENT ON COLUMN media.ai_metadata IS 'JSONB field storing cinematic parameters and AI generation metadata including camera angle, lens type, lighting style, director style, etc.';

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'media' 
AND column_name = 'ai_metadata'
ORDER BY column_name;

-- Fix Missing ai_metadata Column
-- This adds the missing ai_metadata column to the media table

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

-- Create a function to extract cinematic tags from ai_metadata
CREATE OR REPLACE FUNCTION extract_cinematic_tags(metadata JSONB)
RETURNS TEXT[] AS $$
DECLARE
    tags TEXT[] := '{}';
BEGIN
    -- Extract camera angle
    IF metadata->>'cameraAngle' IS NOT NULL THEN
        tags := array_append(tags, 'camera_' || (metadata->>'cameraAngle'));
    END IF;
    
    -- Extract lens type
    IF metadata->>'lensType' IS NOT NULL THEN
        tags := array_append(tags, 'lens_' || (metadata->>'lensType'));
    END IF;
    
    -- Extract lighting style
    IF metadata->>'lightingStyle' IS NOT NULL THEN
        tags := array_append(tags, 'lighting_' || (metadata->>'lightingStyle'));
    END IF;
    
    -- Extract director style
    IF metadata->>'directorStyle' IS NOT NULL THEN
        tags := array_append(tags, 'style_' || (metadata->>'directorStyle'));
    END IF;
    
    -- Extract color palette
    IF metadata->>'colorPalette' IS NOT NULL THEN
        tags := array_append(tags, 'color_' || (metadata->>'colorPalette'));
    END IF;
    
    -- Extract aspect ratio
    IF metadata->>'aspectRatio' IS NOT NULL THEN
        tags := array_append(tags, 'aspect_' || (metadata->>'aspectRatio'));
    END IF;
    
    RETURN tags;
END;
$$ LANGUAGE plpgsql;

-- Add regular column for cinematic tags (not generated)
ALTER TABLE media 
ADD COLUMN IF NOT EXISTS cinematic_tags TEXT[] DEFAULT '{}';

-- Create index on cinematic tags
CREATE INDEX IF NOT EXISTS idx_media_cinematic_tags_gin 
ON media USING GIN (cinematic_tags);

-- Create trigger to automatically update cinematic_tags when ai_metadata changes
CREATE OR REPLACE FUNCTION update_cinematic_tags()
RETURNS TRIGGER AS $$
BEGIN
    NEW.cinematic_tags := extract_cinematic_tags(NEW.ai_metadata);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic cinematic tags update
DROP TRIGGER IF EXISTS update_media_cinematic_tags ON media;
CREATE TRIGGER update_media_cinematic_tags
    BEFORE INSERT OR UPDATE OF ai_metadata ON media
    FOR EACH ROW
    EXECUTE FUNCTION update_cinematic_tags();

-- Add comment explaining the ai_metadata structure
COMMENT ON COLUMN media.ai_metadata IS 'JSONB field storing cinematic parameters and AI generation metadata including camera angle, lens type, lighting style, director style, etc.';
COMMENT ON COLUMN media.cinematic_tags IS 'Automatically generated tags from ai_metadata for efficient querying';

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'media' 
AND column_name = 'ai_metadata'
ORDER BY column_name;

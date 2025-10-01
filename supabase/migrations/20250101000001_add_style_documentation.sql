-- Documentation for available preset styles
-- This migration adds comments to document the available styles
-- No schema changes needed since ai_metadata and style_settings are JSONB

-- Add comment documenting available styles
COMMENT ON COLUMN presets.ai_metadata IS 'JSONB object containing AI-specific metadata including:
- style: One of the following values:
  Photographic Styles: Photorealistic, Cinematic, Portrait, Fashion, Editorial, Commercial, Lifestyle, Street, Architecture, Nature
  Artistic Styles: Impressionist, Renaissance, Baroque, Art Deco, Pop Art, Watercolor, Oil Painting, Sketch, Abstract, Surreal, Minimalist, Maximalist
  Digital/Modern Styles: Digital Art, Concept Art, Illustration, Cartoon, Fantasy, Sci-Fi, Cyberpunk
  Classic Styles: Vintage, Artistic, Painterly
- mood: Dramatic, Ethereal, Moody, Bright, Dark, Vibrant, Minimal, Maximal, Futuristic, Vintage, Natural, Surreal
- tags: Array of searchable tags
- subject: Optional default subject for the preset
';

COMMENT ON COLUMN presets.style_settings IS 'JSONB object containing style-related settings including:
- style: Style name (see ai_metadata.style for available values)
- resolution: Base resolution (1024, 2048)
- aspect_ratio: Image aspect ratio (1:1, 16:9, 9:16, 4:3, 3:4, 21:9)
- intensity: Style strength (0.1-2.0)
- consistency_level: Output consistency (low, medium, high)
';

COMMENT ON COLUMN presets.technical_settings IS 'JSONB object containing technical settings including:
- num_images: Number of images to generate (1-10)
- generation_mode: text-to-image or image-to-image
';

-- Optional: Create a function to validate style names
CREATE OR REPLACE FUNCTION validate_preset_style(style_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN style_name IN (
    -- Photographic Styles
    'Photorealistic', 'Cinematic', 'Portrait', 'Fashion', 'Editorial',
    'Commercial', 'Lifestyle', 'Street', 'Architecture', 'Nature',
    -- Artistic Styles
    'Impressionist', 'Renaissance', 'Baroque', 'Art Deco', 'Pop Art',
    'Watercolor', 'Oil Painting', 'Sketch', 'Abstract', 'Surreal',
    'Minimalist', 'Maximalist',
    -- Digital/Modern Styles
    'Digital Art', 'Concept Art', 'Illustration', 'Cartoon', 'Fantasy',
    'Sci-Fi', 'Cyberpunk',
    -- Classic Styles
    'Vintage', 'Artistic', 'Painterly'
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION validate_preset_style(TEXT) IS 'Validates if a style name is one of the approved preset styles';

-- Create an index on ai_metadata->>'style' for faster style-based queries
CREATE INDEX IF NOT EXISTS idx_presets_ai_metadata_style
ON presets ((ai_metadata->>'style'));

-- Create an index on style_settings->>'style' for faster queries
CREATE INDEX IF NOT EXISTS idx_presets_style_settings_style
ON presets ((style_settings->>'style'));

COMMENT ON INDEX idx_presets_ai_metadata_style IS 'Index for querying presets by style from ai_metadata';
COMMENT ON INDEX idx_presets_style_settings_style IS 'Index for querying presets by style from style_settings';

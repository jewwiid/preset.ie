-- Add columns for individual image showcases
ALTER TABLE showcases 
ADD COLUMN IF NOT EXISTS showcase_type VARCHAR(20) DEFAULT 'moodboard' CHECK (showcase_type IN ('moodboard', 'individual_image'));

ALTER TABLE showcases 
ADD COLUMN IF NOT EXISTS individual_image_url TEXT;

ALTER TABLE showcases 
ADD COLUMN IF NOT EXISTS individual_image_title TEXT;

ALTER TABLE showcases 
ADD COLUMN IF NOT EXISTS individual_image_description TEXT;

-- Note: width and height columns may already exist from migration 20250123000008
-- Adding them here with IF NOT EXISTS for completeness
ALTER TABLE showcases 
ADD COLUMN IF NOT EXISTS individual_image_width INTEGER;

ALTER TABLE showcases 
ADD COLUMN IF NOT EXISTS individual_image_height INTEGER;

-- Add index for filtering by showcase type
CREATE INDEX IF NOT EXISTS idx_showcases_type ON showcases(showcase_type);

-- Add comments for documentation
COMMENT ON COLUMN showcases.showcase_type IS 'Type of showcase: moodboard (collection) or individual_image (single image)';
COMMENT ON COLUMN showcases.individual_image_url IS 'Direct URL for single image showcases';
COMMENT ON COLUMN showcases.individual_image_title IS 'Title for individual image showcases';
COMMENT ON COLUMN showcases.individual_image_description IS 'Description for individual image showcases';
COMMENT ON COLUMN showcases.individual_image_width IS 'Width of individual image in pixels';
COMMENT ON COLUMN showcases.individual_image_height IS 'Height of individual image in pixels';


-- Add individual image dimensions to showcases table
ALTER TABLE showcases 
ADD COLUMN IF NOT EXISTS individual_image_width INTEGER,
ADD COLUMN IF NOT EXISTS individual_image_height INTEGER;

-- Add comments for documentation
COMMENT ON COLUMN showcases.individual_image_width IS 'Width of the individual image in pixels';
COMMENT ON COLUMN showcases.individual_image_height IS 'Height of the individual image in pixels';

-- Add generation_mode field to playground_style_presets table
-- This field indicates whether the custom prompt was written for text-to-image or image-to-image generation

ALTER TABLE playground_style_presets 
ADD COLUMN generation_mode VARCHAR(20) DEFAULT 'text-to-image' 
CHECK (generation_mode IN ('text-to-image', 'image-to-image'));

-- Add comment to explain the field
COMMENT ON COLUMN playground_style_presets.generation_mode IS 'Indicates whether the prompt template was written for text-to-image or image-to-image generation context';

-- Update existing records to have a default generation mode
UPDATE playground_style_presets 
SET generation_mode = 'text-to-image' 
WHERE generation_mode IS NULL;

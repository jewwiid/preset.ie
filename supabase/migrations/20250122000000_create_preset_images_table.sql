-- Create preset_images table for storing sample images
-- This ensures presets always have working sample images regardless of gallery deletions

CREATE TABLE IF NOT EXISTS preset_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    preset_id UUID NOT NULL REFERENCES presets(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    image_type VARCHAR(20) NOT NULL CHECK (image_type IN ('before', 'after')),
    original_gallery_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_preset_images_preset_id ON preset_images(preset_id);
CREATE INDEX IF NOT EXISTS idx_preset_images_type ON preset_images(image_type);
CREATE INDEX IF NOT EXISTS idx_preset_images_gallery_id ON preset_images(original_gallery_id);

-- Enable RLS
ALTER TABLE preset_images ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "Users can manage preset images for their presets" ON preset_images
    FOR ALL USING (
        auth.uid() = (SELECT user_id FROM presets WHERE id = preset_images.preset_id)
    );

-- Add comment for documentation
COMMENT ON TABLE preset_images IS 'Stores sample images for presets, copied from gallery to ensure persistence';
COMMENT ON COLUMN preset_images.image_type IS 'Type of sample image: before (input) or after (generated)';
COMMENT ON COLUMN preset_images.original_gallery_id IS 'Reference to original gallery image (for tracking purposes)';

-- Migration: 080_enhance_playground_metadata.sql
-- Enhanced Image Metadata System for Playground Gallery

-- Add metadata field to playground_gallery table
ALTER TABLE playground_gallery 
ADD COLUMN IF NOT EXISTS generation_metadata JSONB DEFAULT '{}';

-- Add index for metadata queries
CREATE INDEX IF NOT EXISTS idx_playground_gallery_metadata 
ON playground_gallery USING GIN (generation_metadata);

-- Add comment explaining the metadata structure
COMMENT ON COLUMN playground_gallery.generation_metadata IS 'Stores complete generation parameters including prompt, style, resolution, aspect_ratio, consistency_level, custom_style_preset, and other generation settings for full reuse functionality';

-- Update the playground_projects table to include more detailed metadata
ALTER TABLE playground_projects 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Add index for metadata queries on projects
CREATE INDEX IF NOT EXISTS idx_playground_projects_metadata 
ON playground_projects USING GIN (metadata);

-- Add comment explaining the project metadata structure
COMMENT ON COLUMN playground_projects.metadata IS 'Stores enhanced generation metadata including enhanced_prompt, style_applied, style_prompt, consistency_level, custom_style_preset, and other generation settings';

-- Create a view for easy access to complete image metadata
CREATE OR REPLACE VIEW playground_images_with_metadata AS
SELECT 
    pg.id,
    pg.user_id,
    pg.image_url,
    pg.thumbnail_url,
    pg.title,
    pg.description,
    pg.tags,
    pg.width,
    pg.height,
    pg.format,
    pg.created_at,
    pg.generation_metadata,
    pp.prompt,
    pp.style,
    pp.aspect_ratio,
    pp.resolution,
    pp.metadata as project_metadata,
    pp.credits_used,
    pp.last_generated_at
FROM playground_gallery pg
LEFT JOIN playground_projects pp ON pg.project_id = pp.id;

-- Enable RLS on the base tables (if not already enabled)
ALTER TABLE playground_gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE playground_projects ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for the base tables
CREATE POLICY "Users can view own gallery images" ON playground_gallery
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own projects" ON playground_projects
    FOR SELECT USING (auth.uid() = user_id);

-- Grant permissions on the view
GRANT SELECT ON playground_images_with_metadata TO authenticated;

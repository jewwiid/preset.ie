-- Add missing generation_metadata column to playground_gallery table
-- This column is required by the gallery API but was missing from the production table

ALTER TABLE playground_gallery 
ADD COLUMN IF NOT EXISTS generation_metadata JSONB DEFAULT '{}';

-- Add comment for documentation
COMMENT ON COLUMN playground_gallery.generation_metadata IS 'Stores generation parameters and metadata for AI-generated content';

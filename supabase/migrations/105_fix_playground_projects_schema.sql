-- Fix playground_projects table schema to match API expectations
-- Add missing columns that the API is trying to use

-- Add missing columns to playground_projects table
ALTER TABLE playground_projects 
ADD COLUMN IF NOT EXISTS aspect_ratio VARCHAR(20) DEFAULT '1:1',
ADD COLUMN IF NOT EXISTS resolution VARCHAR(20) DEFAULT '1024x1024',
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'generated' CHECK (status IN ('draft', 'generated', 'saved', 'published', 'processing')),
ADD COLUMN IF NOT EXISTS last_generated_at TIMESTAMPTZ;

-- Add comment for documentation
COMMENT ON COLUMN playground_projects.aspect_ratio IS 'Aspect ratio used for image generation (e.g., 1:1, 16:9, 4:3)';
COMMENT ON COLUMN playground_projects.resolution IS 'Resolution used for image generation (e.g., 1024x1024, 2048x2048)';
COMMENT ON COLUMN playground_projects.status IS 'Current status of the playground project';
COMMENT ON COLUMN playground_projects.last_generated_at IS 'Timestamp of the last image generation';

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_playground_projects_status ON playground_projects(status);
CREATE INDEX IF NOT EXISTS idx_playground_projects_last_generated ON playground_projects(last_generated_at);

-- Fix playground_projects status constraint to include 'processing'
-- The original constraint only allowed ('draft', 'generated', 'saved', 'published')
-- but the API tries to use 'processing' for async tasks

-- Drop the existing status constraint
ALTER TABLE playground_projects DROP CONSTRAINT IF EXISTS playground_projects_status_check;

-- Add the updated constraint that includes 'processing'
ALTER TABLE playground_projects ADD CONSTRAINT playground_projects_status_check 
  CHECK (status IN ('draft', 'generated', 'saved', 'published', 'processing'));

-- Add comment for documentation
COMMENT ON CONSTRAINT playground_projects_status_check ON playground_projects 
  IS 'Allows draft, generated, saved, published, and processing status values';

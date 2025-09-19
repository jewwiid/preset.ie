-- Add missing metadata column to playground_projects table
-- This column stores preset capture and reuse data for AI generations

ALTER TABLE playground_projects 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Add comment for documentation
COMMENT ON COLUMN playground_projects.metadata IS 'Stores preset capture data, generation parameters, and reuse metadata for AI-generated content';

-- Add index for better query performance on metadata
CREATE INDEX IF NOT EXISTS idx_playground_projects_metadata 
ON playground_projects USING GIN (metadata);

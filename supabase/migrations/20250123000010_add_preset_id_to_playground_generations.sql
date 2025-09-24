-- Add preset_id to playground_projects table to track which preset was used
-- This will enable the Examples tab functionality

-- Add preset_id column to playground_projects table
ALTER TABLE playground_projects 
ADD COLUMN IF NOT EXISTS preset_id UUID REFERENCES presets(id) ON DELETE SET NULL;

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_playground_projects_preset_id ON playground_projects(preset_id);

-- Add comment for documentation
COMMENT ON COLUMN playground_projects.preset_id IS 'Reference to the preset that was used for this generation';

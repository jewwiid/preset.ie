-- Add template support to moodboards table
ALTER TABLE moodboards 
ADD COLUMN is_template BOOLEAN DEFAULT FALSE,
ADD COLUMN template_name VARCHAR(255),
ADD COLUMN template_description TEXT;

-- Create index for template queries
CREATE INDEX idx_moodboards_template ON moodboards(is_template, owner_user_id);

-- Add comment explaining the schema
COMMENT ON COLUMN moodboards.is_template IS 'Whether this moodboard is saved as a reusable template';
COMMENT ON COLUMN moodboards.template_name IS 'Name of the template (only used when is_template = true)';
COMMENT ON COLUMN moodboards.template_description IS 'Description of the template (only used when is_template = true)';
COMMENT ON COLUMN moodboards.gig_id IS 'Associated gig ID (NULL for templates and temporary moodboards)';

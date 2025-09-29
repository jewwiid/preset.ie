-- Create missing playground_projects table
-- This table is used for the playground/generation feature to store user-generated images

-- Playground projects table for user-created images
CREATE TABLE IF NOT EXISTS playground_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Generation settings
    prompt TEXT NOT NULL,
    negative_prompt TEXT,
    style VARCHAR(50) DEFAULT 'realistic',
    aspect_ratio VARCHAR(20) DEFAULT '1:1',
    resolution VARCHAR(20) DEFAULT '1024x1024',
    
    -- Generated content
    generated_images JSONB DEFAULT '[]',
    selected_image_url TEXT,
    
    -- Metadata and tracking
    metadata JSONB DEFAULT '{}',
    credits_used INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'generated', 'saved', 'published', 'processing')),
    preset_id UUID REFERENCES presets(id) ON DELETE SET NULL,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_generated_at TIMESTAMPTZ
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_playground_projects_user_id ON playground_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_playground_projects_status ON playground_projects(status);
CREATE INDEX IF NOT EXISTS idx_playground_projects_created_at ON playground_projects(created_at);
CREATE INDEX IF NOT EXISTS idx_playground_projects_last_generated ON playground_projects(last_generated_at);
CREATE INDEX IF NOT EXISTS idx_playground_projects_preset_id ON playground_projects(preset_id);

-- Enable RLS
ALTER TABLE playground_projects ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own playground projects" ON playground_projects
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own playground projects" ON playground_projects
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own playground projects" ON playground_projects
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own playground projects" ON playground_projects
    FOR DELETE USING (auth.uid() = user_id);

-- Add comments for documentation
COMMENT ON TABLE playground_projects IS 'Stores user-generated images from the playground feature';
COMMENT ON COLUMN playground_projects.prompt IS 'The text prompt used for image generation';
COMMENT ON COLUMN playground_projects.generated_images IS 'JSON array of generated image URLs and metadata';
COMMENT ON COLUMN playground_projects.status IS 'Current status: draft, generated, saved, published, or processing';
COMMENT ON COLUMN playground_projects.credits_used IS 'Number of credits consumed for this generation';
COMMENT ON COLUMN playground_projects.preset_id IS 'Reference to the preset that was used for this generation';

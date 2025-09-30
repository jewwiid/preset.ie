-- Create playground_projects table if it doesn't exist
CREATE TABLE IF NOT EXISTS playground_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    prompt TEXT NOT NULL,
    negative_prompt TEXT,
    style VARCHAR(50) DEFAULT 'realistic',
    aspect_ratio VARCHAR(20) DEFAULT '1:1',
    resolution VARCHAR(20) DEFAULT '1024x1024',
    generated_images JSONB DEFAULT '[]',
    selected_image_url TEXT,
    metadata JSONB DEFAULT '{}',
    credits_used INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'generated', 'saved', 'published', 'processing')),
    preset_id UUID REFERENCES presets(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_generated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create playground_gallery table if it doesn't exist
CREATE TABLE IF NOT EXISTS playground_gallery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES playground_projects(id) ON DELETE SET NULL,
    edit_id UUID,
    image_url TEXT NOT NULL,
    thumbnail_url TEXT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    tags TEXT[],
    width INTEGER DEFAULT 1024,
    height INTEGER DEFAULT 1024,
    file_size INTEGER DEFAULT 0,
    format VARCHAR(10) DEFAULT 'jpg',
    generation_metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_playground_projects_user_id ON playground_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_playground_projects_status ON playground_projects(status);
CREATE INDEX IF NOT EXISTS idx_playground_projects_created_at ON playground_projects(created_at);
CREATE INDEX IF NOT EXISTS idx_playground_projects_preset_id ON playground_projects(preset_id);

CREATE INDEX IF NOT EXISTS idx_playground_gallery_user_id ON playground_gallery(user_id);
CREATE INDEX IF NOT EXISTS idx_playground_gallery_project_id ON playground_gallery(project_id);
CREATE INDEX IF NOT EXISTS idx_playground_gallery_created_at ON playground_gallery(created_at);
CREATE INDEX IF NOT EXISTS idx_playground_gallery_image_url ON playground_gallery(image_url);

-- Enable RLS
ALTER TABLE playground_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE playground_gallery ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can view their own playground projects" ON playground_projects;
DROP POLICY IF EXISTS "Users can create their own playground projects" ON playground_projects;
DROP POLICY IF EXISTS "Users can update their own playground projects" ON playground_projects;
DROP POLICY IF EXISTS "Users can delete their own playground projects" ON playground_projects;

CREATE POLICY "Users can view their own playground projects" ON playground_projects
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own playground projects" ON playground_projects
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own playground projects" ON playground_projects
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own playground projects" ON playground_projects
    FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own gallery items" ON playground_gallery;
DROP POLICY IF EXISTS "Users can create their own gallery items" ON playground_gallery;
DROP POLICY IF EXISTS "Users can update their own gallery items" ON playground_gallery;
DROP POLICY IF EXISTS "Users can delete their own gallery items" ON playground_gallery;

CREATE POLICY "Users can view their own gallery items" ON playground_gallery
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own gallery items" ON playground_gallery
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own gallery items" ON playground_gallery
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own gallery items" ON playground_gallery
    FOR DELETE USING (auth.uid() = user_id);

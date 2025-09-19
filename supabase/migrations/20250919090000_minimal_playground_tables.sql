-- Minimal playground tables for production
-- Only the essential tables needed for past generations feature

-- Playground projects table
CREATE TABLE IF NOT EXISTS playground_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    prompt TEXT NOT NULL,
    style VARCHAR(50) DEFAULT 'realistic',
    generated_images JSONB DEFAULT '[]',
    credits_used INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_generated_at TIMESTAMPTZ
);

-- Playground gallery table
CREATE TABLE IF NOT EXISTS playground_gallery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES playground_projects(id) ON DELETE SET NULL,
    image_url TEXT NOT NULL,
    title VARCHAR(255),
    media_type VARCHAR(20) DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
    video_url TEXT,
    video_duration INTEGER,
    video_resolution VARCHAR(20),
    video_format VARCHAR(10) DEFAULT 'mp4',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Playground image edits table
CREATE TABLE IF NOT EXISTS playground_image_edits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES playground_projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    edit_type VARCHAR(50) NOT NULL,
    edit_prompt TEXT,
    original_image_url TEXT NOT NULL,
    edited_image_url TEXT NOT NULL,
    credits_used INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Video generations table
CREATE TABLE IF NOT EXISTS playground_video_generations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES playground_projects(id) ON DELETE SET NULL,
    video_url TEXT NOT NULL,
    duration INTEGER NOT NULL,
    resolution VARCHAR(20) NOT NULL,
    generation_metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Basic indexes
CREATE INDEX IF NOT EXISTS idx_playground_projects_user_id ON playground_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_playground_gallery_user_id ON playground_gallery(user_id);
CREATE INDEX IF NOT EXISTS idx_playground_image_edits_user_id ON playground_image_edits(user_id);
CREATE INDEX IF NOT EXISTS idx_playground_video_generations_user_id ON playground_video_generations(user_id);

-- RLS Policies
ALTER TABLE playground_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE playground_gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE playground_image_edits ENABLE ROW LEVEL SECURITY;
ALTER TABLE playground_video_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own playground projects" ON playground_projects
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own gallery" ON playground_gallery
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own image edits" ON playground_image_edits
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own video generations" ON playground_video_generations
    FOR ALL USING (auth.uid() = user_id);

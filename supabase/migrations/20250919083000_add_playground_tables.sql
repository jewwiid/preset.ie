-- Add playground tables to production database
-- This migration creates the essential playground tables needed for the past generations feature

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
    
    -- Generated images
    generated_images JSONB DEFAULT '[]', -- Array of image URLs and metadata
    selected_image_url TEXT, -- Currently selected image for editing
    
    -- Status and metadata
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'generated', 'saved', 'published')),
    credits_used INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_generated_at TIMESTAMPTZ
);

-- Playground image edits table for modification history
CREATE TABLE IF NOT EXISTS playground_image_edits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES playground_projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Edit details
    edit_type VARCHAR(50) NOT NULL, -- 'enhance', 'modify', 'upscale', 'style_transfer'
    edit_prompt TEXT,
    original_image_url TEXT NOT NULL,
    edited_image_url TEXT NOT NULL,
    
    -- Edit settings
    strength DECIMAL(3,2) DEFAULT 0.8,
    style_preset VARCHAR(50),
    
    -- Metadata
    credits_used INTEGER DEFAULT 1,
    processing_time_ms INTEGER,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User playground gallery for saved images
CREATE TABLE IF NOT EXISTS playground_gallery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES playground_projects(id) ON DELETE SET NULL,
    edit_id UUID REFERENCES playground_image_edits(id) ON DELETE SET NULL,
    
    -- Image data
    image_url TEXT NOT NULL,
    thumbnail_url TEXT,
    title VARCHAR(255),
    description TEXT,
    tags TEXT[] DEFAULT '{}',
    
    -- Metadata
    width INTEGER,
    height INTEGER,
    file_size INTEGER,
    format VARCHAR(10),
    
    -- Usage tracking
    used_in_moodboard BOOLEAN DEFAULT FALSE,
    used_in_showcase BOOLEAN DEFAULT FALSE,
    
    -- Video support
    media_type VARCHAR(20) DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
    video_url TEXT,
    video_duration INTEGER, -- Duration in seconds
    video_resolution VARCHAR(20), -- e.g., '480p', '720p'
    video_format VARCHAR(10) DEFAULT 'mp4', -- e.g., 'mp4', 'webm'
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Video generations table
CREATE TABLE IF NOT EXISTS playground_video_generations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES playground_projects(id) ON DELETE SET NULL,
    
    -- Video data
    video_url TEXT NOT NULL,
    thumbnail_url TEXT,
    title VARCHAR(255),
    description TEXT,
    tags TEXT[] DEFAULT '{}',
    
    -- Video metadata
    duration INTEGER NOT NULL, -- Duration in seconds
    resolution VARCHAR(20) NOT NULL, -- e.g., '480p', '720p'
    format VARCHAR(10) DEFAULT 'mp4', -- e.g., 'mp4', 'webm'
    aspect_ratio VARCHAR(20), -- e.g., '16:9', '1:1'
    
    -- Generation metadata
    generation_metadata JSONB DEFAULT '{}',
    
    -- File info
    file_size BIGINT DEFAULT 0,
    
    -- Status and timestamps
    status VARCHAR(50) DEFAULT 'completed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_playground_projects_user_id ON playground_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_playground_projects_status ON playground_projects(status);
CREATE INDEX IF NOT EXISTS idx_playground_image_edits_project_id ON playground_image_edits(project_id);
CREATE INDEX IF NOT EXISTS idx_playground_image_edits_user_id ON playground_image_edits(user_id);
CREATE INDEX IF NOT EXISTS idx_playground_gallery_user_id ON playground_gallery(user_id);
CREATE INDEX IF NOT EXISTS idx_playground_gallery_used ON playground_gallery(used_in_moodboard, used_in_showcase);
CREATE INDEX IF NOT EXISTS idx_playground_video_generations_user_id ON playground_video_generations(user_id);
CREATE INDEX IF NOT EXISTS idx_playground_video_generations_project_id ON playground_video_generations(project_id);
CREATE INDEX IF NOT EXISTS idx_playground_video_generations_created_at ON playground_video_generations(created_at);

-- RLS Policies
ALTER TABLE playground_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE playground_image_edits ENABLE ROW LEVEL SECURITY;
ALTER TABLE playground_gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE playground_video_generations ENABLE ROW LEVEL SECURITY;

-- Users can manage their own playground projects
CREATE POLICY "Users can manage own playground projects" ON playground_projects
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own image edits" ON playground_image_edits
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own gallery" ON playground_gallery
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own video generations" ON playground_video_generations
    FOR ALL USING (auth.uid() = user_id);

-- Update timestamp triggers
CREATE TRIGGER update_playground_projects_updated_at
    BEFORE UPDATE ON playground_projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_playground_gallery_updated_at
    BEFORE UPDATE ON playground_gallery
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_playground_video_generations_updated_at
    BEFORE UPDATE ON playground_video_generations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

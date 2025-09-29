-- Quick fix: Create missing playground_gallery table
-- Run this directly in Supabase SQL Editor

-- Create playground_gallery table if it doesn't exist
CREATE TABLE IF NOT EXISTS playground_gallery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES playground_projects(id) ON DELETE SET NULL,
    edit_id UUID,
    image_url TEXT NOT NULL,
    thumbnail_url TEXT,
    title VARCHAR(255) NOT NULL DEFAULT 'Untitled',
    description TEXT,
    tags TEXT[] DEFAULT '{}',
    width INTEGER DEFAULT 1024,
    height INTEGER DEFAULT 1024,
    file_size INTEGER DEFAULT 0,
    format VARCHAR(10) DEFAULT 'jpg',
    generation_metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE playground_gallery ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_playground_gallery_user_id ON playground_gallery(user_id);
CREATE INDEX IF NOT EXISTS idx_playground_gallery_project_id ON playground_gallery(project_id);
CREATE INDEX IF NOT EXISTS idx_playground_gallery_created_at ON playground_gallery(created_at);

-- Create RLS policies (drop existing first)
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

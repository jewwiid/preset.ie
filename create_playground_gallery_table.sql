-- Create playground_gallery table for storing AI-generated images and videos
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS playground_gallery (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    image_url TEXT,
    thumbnail_url TEXT,
    title VARCHAR(255),
    description TEXT,
    tags TEXT[], -- Array of tags
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    width INTEGER,
    height INTEGER,
    format VARCHAR(50), -- e.g., 'jpeg', 'png', 'webp'
    project_id UUID, -- Reference to a project if applicable
    used_in_moodboard BOOLEAN DEFAULT FALSE,
    used_in_showcase BOOLEAN DEFAULT FALSE,
    media_type VARCHAR(20) DEFAULT 'image', -- 'image' or 'video'
    video_url TEXT,
    video_duration INTEGER, -- Duration in seconds
    video_resolution VARCHAR(20), -- e.g., '1920x1080'
    video_format VARCHAR(20), -- e.g., 'mp4', 'webm'
    generation_metadata JSONB, -- Store AI generation parameters and metadata
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_playground_gallery_user_id ON playground_gallery(user_id);
CREATE INDEX IF NOT EXISTS idx_playground_gallery_created_at ON playground_gallery(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_playground_gallery_project_id ON playground_gallery(project_id);
CREATE INDEX IF NOT EXISTS idx_playground_gallery_media_type ON playground_gallery(media_type);
CREATE INDEX IF NOT EXISTS idx_playground_gallery_used_in_moodboard ON playground_gallery(used_in_moodboard);
CREATE INDEX IF NOT EXISTS idx_playground_gallery_used_in_showcase ON playground_gallery(used_in_showcase);

-- Enable Row Level Security
ALTER TABLE playground_gallery ENABLE ROW LEVEL SECURITY;

-- RLS Policies for playground_gallery
-- Users can view their own gallery items
CREATE POLICY "Users can view their own gallery items" ON playground_gallery
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own gallery items
CREATE POLICY "Users can insert their own gallery items" ON playground_gallery
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own gallery items
CREATE POLICY "Users can update their own gallery items" ON playground_gallery
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own gallery items
CREATE POLICY "Users can delete their own gallery items" ON playground_gallery
    FOR DELETE USING (auth.uid() = user_id);

-- Create updated_at trigger function (if not already created)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at trigger for playground_gallery
DROP TRIGGER IF EXISTS update_playground_gallery_updated_at ON playground_gallery;
CREATE TRIGGER update_playground_gallery_updated_at
    BEFORE UPDATE ON playground_gallery
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Verify the table and policies
SELECT 'playground_gallery table created and configured successfully' as status;

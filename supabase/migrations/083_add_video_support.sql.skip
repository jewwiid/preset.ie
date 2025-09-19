-- Add video support to playground_gallery table
ALTER TABLE playground_gallery 
ADD COLUMN IF NOT EXISTS media_type VARCHAR(20) DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS video_duration INTEGER, -- Duration in seconds
ADD COLUMN IF NOT EXISTS video_resolution VARCHAR(20), -- e.g., '480p', '720p'
ADD COLUMN IF NOT EXISTS video_format VARCHAR(10) DEFAULT 'mp4'; -- e.g., 'mp4', 'webm'

-- Update existing records to have media_type = 'image'
UPDATE playground_gallery 
SET media_type = 'image' 
WHERE media_type IS NULL;

-- Create video generations table
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

-- Add indexes for video generations
CREATE INDEX idx_playground_video_generations_user_id ON playground_video_generations(user_id);
CREATE INDEX idx_playground_video_generations_project_id ON playground_video_generations(project_id);
CREATE INDEX idx_playground_video_generations_created_at ON playground_video_generations(created_at);
CREATE INDEX idx_playground_video_generations_metadata ON playground_video_generations USING GIN (generation_metadata);

-- Enable RLS on video generations table
ALTER TABLE playground_video_generations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for video generations
CREATE POLICY "Users can manage own video generations" ON playground_video_generations
    FOR ALL USING (auth.uid() = user_id);

-- Update timestamp trigger for video generations
CREATE TRIGGER update_playground_video_generations_updated_at
    BEFORE UPDATE ON playground_video_generations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Add comment explaining the video generations table
COMMENT ON TABLE playground_video_generations IS 'Stores user-generated videos from the playground with metadata';
COMMENT ON COLUMN playground_video_generations.generation_metadata IS 'Stores complete video generation parameters including prompt, duration, resolution, aspect_ratio, motion_type, and other settings';

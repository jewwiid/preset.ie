-- Create playground_generations table for tracking individual generation tasks
-- This table is needed for NanoBanana callback-based generations

CREATE TABLE IF NOT EXISTS playground_generations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES playground_projects(id) ON DELETE SET NULL,
    
    -- Generation details
    prompt TEXT NOT NULL,
    style VARCHAR(50) DEFAULT 'photorealistic',
    resolution VARCHAR(20) DEFAULT '1024*1024',
    aspect_ratio VARCHAR(20) DEFAULT '1:1',
    consistency_level VARCHAR(20) DEFAULT 'high',
    num_images INTEGER DEFAULT 1,
    
    -- Generated images (will be populated by callback)
    generated_images JSONB DEFAULT '[]',
    
    -- Generation metadata
    generation_metadata JSONB DEFAULT '{}',
    
    -- Credits and status
    credits_used INTEGER DEFAULT 2,
    status VARCHAR(20) DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_playground_generations_user_id ON playground_generations(user_id);
CREATE INDEX IF NOT EXISTS idx_playground_generations_project_id ON playground_generations(project_id);
CREATE INDEX IF NOT EXISTS idx_playground_generations_status ON playground_generations(status);
CREATE INDEX IF NOT EXISTS idx_playground_generations_created_at ON playground_generations(created_at);

-- RLS Policy
ALTER TABLE playground_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own generations" ON playground_generations
    FOR ALL USING (auth.uid() = user_id);

-- Update timestamp trigger
CREATE TRIGGER update_playground_generations_updated_at
    BEFORE UPDATE ON playground_generations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Migration: 083_enhanced_playground_system.sql
-- Enhanced Playground System for Advanced Seedream Features

-- Add missing columns to playground_projects for advanced features
ALTER TABLE playground_projects 
ADD COLUMN IF NOT EXISTS generation_type VARCHAR(50) DEFAULT 'single' CHECK (generation_type IN ('single', 'sequential', 'batch', 'style_variations')),
ADD COLUMN IF NOT EXISTS batch_size INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS style_presets TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS processing_status VARCHAR(20) DEFAULT 'idle' CHECK (processing_status IN ('idle', 'processing', 'completed', 'failed')),
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Add missing columns to playground_image_edits for advanced features
ALTER TABLE playground_image_edits
ADD COLUMN IF NOT EXISTS batch_index INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS style_name VARCHAR(50),
ADD COLUMN IF NOT EXISTS source_images TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS processing_time_ms INTEGER,
ADD COLUMN IF NOT EXISTS api_response JSONB;

-- Create playground_batch_jobs table for tracking batch operations
CREATE TABLE IF NOT EXISTS playground_batch_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES playground_projects(id) ON DELETE CASCADE,
    
    -- Batch configuration
    job_type VARCHAR(50) NOT NULL CHECK (job_type IN ('batch_edit', 'style_variations', 'sequential_generation')),
    total_items INTEGER NOT NULL,
    processed_items INTEGER DEFAULT 0,
    failed_items INTEGER DEFAULT 0,
    
    -- Status tracking
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    progress_percentage DECIMAL(5,2) DEFAULT 0,
    
    -- Results
    results JSONB DEFAULT '[]',
    errors JSONB DEFAULT '[]',
    
    -- Timestamps
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create playground_style_presets table for managing style configurations
CREATE TABLE IF NOT EXISTS playground_style_presets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Style configuration
    name VARCHAR(100) NOT NULL,
    description TEXT,
    style_type VARCHAR(50) NOT NULL CHECK (style_type IN ('photorealistic', 'artistic', 'cartoon', 'vintage', 'cyberpunk', 'watercolor', 'sketch', 'oil_painting')),
    prompt_template TEXT NOT NULL,
    intensity DECIMAL(3,2) DEFAULT 1.0,
    
    -- Usage tracking
    usage_count INTEGER DEFAULT 0,
    is_public BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create playground_usage_analytics table for tracking usage patterns
CREATE TABLE IF NOT EXISTS playground_usage_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Usage metrics
    feature_type VARCHAR(50) NOT NULL,
    credits_used INTEGER NOT NULL,
    processing_time_ms INTEGER,
    success BOOLEAN NOT NULL,
    
    -- Context
    project_id UUID REFERENCES playground_projects(id) ON DELETE SET NULL,
    batch_job_id UUID REFERENCES playground_batch_jobs(id) ON DELETE SET NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_playground_projects_generation_type ON playground_projects(generation_type);
CREATE INDEX IF NOT EXISTS idx_playground_projects_processing_status ON playground_projects(processing_status);
CREATE INDEX IF NOT EXISTS idx_playground_image_edits_batch_index ON playground_image_edits(batch_index);
CREATE INDEX IF NOT EXISTS idx_playground_image_edits_style_name ON playground_image_edits(style_name);
CREATE INDEX IF NOT EXISTS idx_playground_batch_jobs_user_id ON playground_batch_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_playground_batch_jobs_status ON playground_batch_jobs(status);
CREATE INDEX IF NOT EXISTS idx_playground_style_presets_user_id ON playground_style_presets(user_id);
CREATE INDEX IF NOT EXISTS idx_playground_style_presets_public ON playground_style_presets(is_public);
CREATE INDEX IF NOT EXISTS idx_playground_usage_analytics_user_id ON playground_usage_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_playground_usage_analytics_feature_type ON playground_usage_analytics(feature_type);

-- Enable RLS on new tables
ALTER TABLE playground_batch_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE playground_style_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE playground_usage_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for new tables
CREATE POLICY "Users can manage own batch jobs" ON playground_batch_jobs
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own style presets" ON playground_style_presets
    FOR ALL USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can view own usage analytics" ON playground_usage_analytics
    FOR SELECT USING (auth.uid() = user_id);

-- Update triggers
CREATE TRIGGER update_playground_style_presets_updated_at
    BEFORE UPDATE ON playground_style_presets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Insert default style presets
INSERT INTO playground_style_presets (name, description, style_type, prompt_template, is_public) VALUES
('Photorealistic', 'Generate photorealistic images with natural lighting and realistic textures', 'photorealistic', 'Transform this image into a photorealistic style with natural lighting and realistic textures', true),
('Artistic', 'Apply an artistic painting style with bold brushstrokes and vibrant colors', 'artistic', 'Apply an artistic painting style to this image with bold brushstrokes and vibrant colors', true),
('Cartoon', 'Convert to cartoon/anime style with simplified features and bright colors', 'cartoon', 'Convert this image to a cartoon/anime style with simplified features and bright colors', true),
('Vintage', 'Give a vintage film photography look with warm tones and slight grain', 'vintage', 'Give this image a vintage film photography look with warm tones and slight grain', true),
('Cyberpunk', 'Transform into cyberpunk style with neon colors and futuristic elements', 'cyberpunk', 'Transform this image into a cyberpunk style with neon colors and futuristic elements', true),
('Watercolor', 'Apply watercolor painting style with soft edges and translucent colors', 'watercolor', 'Apply a watercolor painting style to this image with soft edges and translucent colors', true);

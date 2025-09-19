-- Create comprehensive presets table
-- This table consolidates all preset functionality into a unified system

CREATE TABLE IF NOT EXISTS presets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Basic preset information
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50) DEFAULT 'style',
    
    -- Prompt configuration
    prompt_template TEXT,
    negative_prompt TEXT,
    
    -- Style and technical settings (JSONB for flexibility)
    style_settings JSONB DEFAULT '{}',
    technical_settings JSONB DEFAULT '{}',
    
    -- AI metadata
    ai_metadata JSONB DEFAULT '{}',
    
    -- Seedream configuration
    seedream_config JSONB DEFAULT '{}',
    
    -- Generation mode
    generation_mode VARCHAR(20) DEFAULT 'image' CHECK (generation_mode IN ('image', 'video', 'both')),
    
    -- Visibility and sharing
    is_public BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    
    -- Usage tracking
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_category CHECK (category IN ('style', 'cinematic', 'technical', 'custom')),
    CONSTRAINT valid_usage_count CHECK (usage_count >= 0)
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_presets_user_id ON presets(user_id);
CREATE INDEX IF NOT EXISTS idx_presets_category ON presets(category);
CREATE INDEX IF NOT EXISTS idx_presets_is_public ON presets(is_public);
CREATE INDEX IF NOT EXISTS idx_presets_is_featured ON presets(is_featured);
CREATE INDEX IF NOT EXISTS idx_presets_usage_count ON presets(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_presets_created_at ON presets(created_at DESC);

-- Create GIN indexes for JSONB columns
CREATE INDEX IF NOT EXISTS idx_presets_style_settings ON presets USING GIN(style_settings);
CREATE INDEX IF NOT EXISTS idx_presets_technical_settings ON presets USING GIN(technical_settings);
CREATE INDEX IF NOT EXISTS idx_presets_ai_metadata ON presets USING GIN(ai_metadata);
CREATE INDEX IF NOT EXISTS idx_presets_seedream_config ON presets USING GIN(seedream_config);

-- Enable RLS
ALTER TABLE presets ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view public presets" ON presets
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view their own presets" ON presets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own presets" ON presets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own presets" ON presets
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own presets" ON presets
    FOR DELETE USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_presets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_presets_updated_at
    BEFORE UPDATE ON presets
    FOR EACH ROW
    EXECUTE FUNCTION update_presets_updated_at();

-- Add comment
COMMENT ON TABLE presets IS 'Comprehensive presets table for managing all types of presets in the system';
COMMENT ON COLUMN presets.style_settings IS 'JSONB object containing style-related settings';
COMMENT ON COLUMN presets.technical_settings IS 'JSONB object containing technical settings like resolution, quality, etc.';
COMMENT ON COLUMN presets.ai_metadata IS 'JSONB object containing AI-specific metadata';
COMMENT ON COLUMN presets.seedream_config IS 'JSONB object containing Seedream-specific configuration';

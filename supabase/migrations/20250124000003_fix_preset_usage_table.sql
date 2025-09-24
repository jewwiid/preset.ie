-- Fix preset_usage table creation
-- Drop and recreate the table to ensure proper structure

-- Drop existing table if it exists
DROP TABLE IF EXISTS preset_usage CASCADE;

-- Create preset_usage table with correct structure
CREATE TABLE preset_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    preset_id UUID NOT NULL REFERENCES presets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    usage_type TEXT NOT NULL CHECK (usage_type IN ('playground_generation', 'showcase_creation', 'sample_verification')),
    usage_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_preset_usage_preset_id ON preset_usage(preset_id);
CREATE INDEX idx_preset_usage_user_id ON preset_usage(user_id);
CREATE INDEX idx_preset_usage_created_at ON preset_usage(created_at);

-- Create unique index to prevent duplicate daily usage tracking
CREATE UNIQUE INDEX idx_preset_usage_daily_unique 
ON preset_usage(preset_id, user_id, usage_type, DATE(created_at));

-- Enable RLS
ALTER TABLE preset_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies for preset_usage
CREATE POLICY "Users can view their own usage" ON preset_usage
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Preset creators can view usage of their presets" ON preset_usage
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM presets 
            WHERE id = preset_id 
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Authenticated users can insert usage" ON preset_usage
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Add comment for documentation
COMMENT ON TABLE preset_usage IS 'Tracks when presets are used by users';

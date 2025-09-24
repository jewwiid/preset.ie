-- Add comprehensive preset usage tracking
-- This migration completes the preset usage tracking system

-- Create preset_usage table for individual usage tracking
CREATE TABLE IF NOT EXISTS preset_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    preset_id UUID NOT NULL REFERENCES presets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
    used_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
    
    -- Ensure we can track multiple uses by the same user (no unique constraint)
    -- This allows analytics on usage patterns
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_preset_usage_preset_id ON preset_usage(preset_id);
CREATE INDEX IF NOT EXISTS idx_preset_usage_user_id ON preset_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_preset_usage_used_at ON preset_usage(used_at DESC);
CREATE INDEX IF NOT EXISTS idx_preset_usage_preset_user ON preset_usage(preset_id, user_id);

-- Enable RLS
ALTER TABLE preset_usage ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for preset_usage
CREATE POLICY "Users can view their own preset usage" ON preset_usage
    FOR SELECT USING (auth.uid() = (SELECT user_id FROM users_profile WHERE id = preset_usage.user_id));

CREATE POLICY "Users can track their own preset usage" ON preset_usage
    FOR INSERT WITH CHECK (
        auth.uid() = (SELECT user_id FROM users_profile WHERE id = preset_usage.user_id)
    );

-- Create function to increment preset usage count
CREATE OR REPLACE FUNCTION increment_preset_usage(preset_id UUID)
RETURNS void AS $$
BEGIN
    -- Increment the usage_count and update last_used_at
    UPDATE presets 
    SET usage_count = usage_count + 1,
        last_used_at = NOW(),
        updated_at = NOW()
    WHERE id = preset_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get preset usage statistics
CREATE OR REPLACE FUNCTION get_preset_usage_stats(preset_uuid UUID)
RETURNS TABLE (
    total_uses INTEGER,
    unique_users INTEGER,
    recent_uses INTEGER,
    last_used_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(p.usage_count, 0)::INTEGER as total_uses,
        COALESCE(COUNT(DISTINCT pu.user_id), 0)::INTEGER as unique_users,
        COALESCE(COUNT(CASE WHEN pu.used_at > NOW() - INTERVAL '7 days' THEN 1 END), 0)::INTEGER as recent_uses,
        p.last_used_at
    FROM presets p
    LEFT JOIN preset_usage pu ON p.id = pu.preset_id
    WHERE p.id = preset_uuid
    GROUP BY p.id, p.usage_count, p.last_used_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get trending presets based on recent usage
CREATE OR REPLACE FUNCTION get_trending_presets_by_usage(
    days_back INTEGER DEFAULT 7,
    limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
    preset_id UUID,
    preset_name VARCHAR,
    usage_count INTEGER,
    recent_uses INTEGER,
    unique_users INTEGER,
    trending_score NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id as preset_id,
        p.name as preset_name,
        p.usage_count,
        COALESCE(recent_usage.recent_uses, 0)::INTEGER as recent_uses,
        COALESCE(recent_usage.unique_users, 0)::INTEGER as unique_users,
        -- Calculate trending score: recent uses weighted by recency
        COALESCE(
            SUM(
                CASE 
                    WHEN pu.used_at > NOW() - INTERVAL '1 day' THEN 10
                    WHEN pu.used_at > NOW() - INTERVAL '3 days' THEN 7
                    WHEN pu.used_at > NOW() - INTERVAL '7 days' THEN 5
                    ELSE 1
                END
            ) / GREATEST(EXTRACT(EPOCH FROM (NOW() - MIN(pu.used_at))) / 3600, 1), -- Hours since first use
            0
        ) as trending_score
    FROM presets p
    LEFT JOIN preset_usage pu ON p.id = pu.preset_id 
        AND pu.used_at > NOW() - (days_back || ' days')::INTERVAL
    LEFT JOIN (
        SELECT 
            preset_id,
            COUNT(*) as recent_uses,
            COUNT(DISTINCT user_id) as unique_users
        FROM preset_usage 
        WHERE used_at > NOW() - (days_back || ' days')::INTERVAL
        GROUP BY preset_id
    ) recent_usage ON p.id = recent_usage.preset_id
    WHERE p.is_public = true
    GROUP BY p.id, p.name, p.usage_count, recent_usage.recent_uses, recent_usage.unique_users
    HAVING COALESCE(recent_usage.recent_uses, 0) > 0
    ORDER BY trending_score DESC, p.usage_count DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for updated_at on preset_usage
CREATE OR REPLACE FUNCTION update_preset_usage_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.created_at = COALESCE(NEW.created_at, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_preset_usage_updated_at
    BEFORE INSERT ON preset_usage
    FOR EACH ROW
    EXECUTE FUNCTION update_preset_usage_updated_at();

-- Add comments
COMMENT ON TABLE preset_usage IS 'Tracks individual usage events for presets by users';
COMMENT ON COLUMN preset_usage.preset_id IS 'Reference to the preset that was used';
COMMENT ON COLUMN preset_usage.user_id IS 'Reference to the user who used the preset';
COMMENT ON COLUMN preset_usage.used_at IS 'When the preset was used';
COMMENT ON FUNCTION increment_preset_usage(UUID) IS 'Increments the usage count for a preset';
COMMENT ON FUNCTION get_preset_usage_stats(UUID) IS 'Returns usage statistics for a specific preset';
COMMENT ON FUNCTION get_trending_presets_by_usage(INTEGER, INTEGER) IS 'Returns trending presets based on recent usage patterns';

-- Update existing presets to have correct usage_count (should be 0 for existing presets)
UPDATE presets SET usage_count = 0 WHERE usage_count IS NULL;
UPDATE presets SET last_used_at = NULL WHERE last_used_at IS NULL;

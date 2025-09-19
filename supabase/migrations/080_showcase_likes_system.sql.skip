-- Migration: 080_showcase_likes_system.sql
-- Showcase Likes System - Core Infrastructure

-- Likes table for showcases
CREATE TABLE IF NOT EXISTS showcase_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    showcase_id UUID NOT NULL REFERENCES showcases(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Prevent duplicate likes
    UNIQUE(showcase_id, user_id)
);

-- Like counts cache table for performance
CREATE TABLE IF NOT EXISTS showcase_like_counts (
    showcase_id UUID PRIMARY KEY REFERENCES showcases(id) ON DELETE CASCADE,
    likes_count INTEGER DEFAULT 0,
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_showcase_likes_showcase_id ON showcase_likes(showcase_id);
CREATE INDEX idx_showcase_likes_user_id ON showcase_likes(user_id);
CREATE INDEX idx_showcase_likes_created_at ON showcase_likes(created_at);

-- RLS Policies
ALTER TABLE showcase_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE showcase_like_counts ENABLE ROW LEVEL SECURITY;

-- Users can like/unlike showcases
CREATE POLICY "Users can like showcases" ON showcase_likes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike showcases" ON showcase_likes
    FOR DELETE USING (auth.uid() = user_id);

-- Anyone can view like counts
CREATE POLICY "Anyone can view like counts" ON showcase_like_counts
    FOR SELECT USING (true);

-- System can update like counts
CREATE POLICY "System can update like counts" ON showcase_like_counts
    FOR ALL USING (true);

-- Function to update showcase like counts
CREATE OR REPLACE FUNCTION update_showcase_like_count(p_showcase_id UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO showcase_like_counts (showcase_id, likes_count, last_updated)
    SELECT 
        p_showcase_id,
        COUNT(*),
        NOW()
    FROM showcase_likes
    WHERE showcase_id = p_showcase_id
    ON CONFLICT (showcase_id) DO UPDATE SET
        likes_count = EXCLUDED.likes_count,
        last_updated = EXCLUDED.last_updated;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update like counts
CREATE OR REPLACE FUNCTION trigger_update_like_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'DELETE' THEN
        PERFORM update_showcase_like_count(COALESCE(NEW.showcase_id, OLD.showcase_id));
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_like_count_trigger
    AFTER INSERT OR DELETE ON showcase_likes
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_like_count();

-- Add preset likes functionality
-- This migration adds the ability for users to like/favorite presets

-- Add likes_count column to presets table
ALTER TABLE presets ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;

-- Create preset_likes table
CREATE TABLE IF NOT EXISTS preset_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    preset_id UUID NOT NULL REFERENCES presets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure a user can only like a preset once
    UNIQUE(preset_id, user_id)
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_preset_likes_preset_id ON preset_likes(preset_id);
CREATE INDEX IF NOT EXISTS idx_preset_likes_user_id ON preset_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_preset_likes_created_at ON preset_likes(created_at DESC);

-- Enable RLS
ALTER TABLE preset_likes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for preset_likes
CREATE POLICY "Users can view all preset likes" ON preset_likes
    FOR SELECT USING (true);

CREATE POLICY "Users can like presets" ON preset_likes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike their own likes" ON preset_likes
    FOR DELETE USING (auth.uid() = user_id);

-- Create function to update likes_count when likes are added/removed
CREATE OR REPLACE FUNCTION update_preset_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Increment likes_count when a like is added
        UPDATE presets 
        SET likes_count = likes_count + 1,
            updated_at = NOW()
        WHERE id = NEW.preset_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Decrement likes_count when a like is removed
        UPDATE presets 
        SET likes_count = GREATEST(likes_count - 1, 0),
            updated_at = NOW()
        WHERE id = OLD.preset_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update likes_count
CREATE TRIGGER trigger_update_preset_likes_count_insert
    AFTER INSERT ON preset_likes
    FOR EACH ROW
    EXECUTE FUNCTION update_preset_likes_count();

CREATE TRIGGER trigger_update_preset_likes_count_delete
    AFTER DELETE ON preset_likes
    FOR EACH ROW
    EXECUTE FUNCTION update_preset_likes_count();

-- Create trigger for updated_at on preset_likes
CREATE OR REPLACE FUNCTION update_preset_likes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_preset_likes_updated_at
    BEFORE UPDATE ON preset_likes
    FOR EACH ROW
    EXECUTE FUNCTION update_preset_likes_updated_at();

-- Add comments
COMMENT ON TABLE preset_likes IS 'Tracks which users have liked which presets';
COMMENT ON COLUMN preset_likes.preset_id IS 'Reference to the liked preset';
COMMENT ON COLUMN preset_likes.user_id IS 'Reference to the user who liked the preset';
COMMENT ON COLUMN presets.likes_count IS 'Cached count of total likes for this preset';

-- Update existing presets to have correct likes_count (should be 0 for existing presets)
UPDATE presets SET likes_count = 0 WHERE likes_count IS NULL;

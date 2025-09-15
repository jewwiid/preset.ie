-- Migration: 081_enhanced_showcase_media.sql
-- Enhanced Showcase Media System - Bridge moodboard items and showcases

-- Create showcase_media table to bridge moodboard items and showcases
CREATE TABLE IF NOT EXISTS showcase_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    showcase_id UUID NOT NULL REFERENCES showcases(id) ON DELETE CASCADE,
    moodboard_item_id UUID REFERENCES moodboard_items(id) ON DELETE SET NULL,
    media_id UUID REFERENCES media(id) ON DELETE SET NULL,
    
    -- Enhanced photo data
    enhanced_url TEXT,
    original_url TEXT,
    thumbnail_url TEXT,
    
    -- Metadata
    width INTEGER,
    height INTEGER,
    caption TEXT,
    position INTEGER DEFAULT 0,
    
    -- Source tracking
    source VARCHAR(20) DEFAULT 'moodboard' CHECK (source IN ('moodboard', 'upload', 'enhanced', 'playground')),
    enhancement_type VARCHAR(50),
    enhancement_prompt TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_showcase_media_showcase_id ON showcase_media(showcase_id);
CREATE INDEX idx_showcase_media_moodboard_item ON showcase_media(moodboard_item_id);
CREATE INDEX idx_showcase_media_position ON showcase_media(showcase_id, position);

-- RLS Policies
ALTER TABLE showcase_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view showcase media" ON showcase_media
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM showcases 
            WHERE id = showcase_media.showcase_id 
            AND visibility = 'PUBLIC'
        )
    );

CREATE POLICY "Showcase creators can manage media" ON showcase_media
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM showcases 
            WHERE id = showcase_media.showcase_id 
            AND (creator_user_id = (SELECT id FROM users_profile WHERE user_id = auth.uid())
                 OR talent_user_id = (SELECT id FROM users_profile WHERE user_id = auth.uid()))
        )
    );

-- Update showcases table to support moodboard-based showcases
ALTER TABLE showcases 
ADD COLUMN IF NOT EXISTS title VARCHAR(255),
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS moodboard_id UUID REFERENCES moodboards(id),
ADD COLUMN IF NOT EXISTS created_from_moodboard BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS created_from_playground BOOLEAN DEFAULT FALSE;

-- Update constraint to allow moodboard-based showcases
ALTER TABLE showcases DROP CONSTRAINT IF EXISTS media_count;
ALTER TABLE showcases ADD CONSTRAINT showcase_media_count CHECK (
    (array_length(media_ids, 1) BETWEEN 3 AND 6) OR 
    (created_from_moodboard = true AND moodboard_id IS NOT NULL) OR
    (created_from_playground = true)
);

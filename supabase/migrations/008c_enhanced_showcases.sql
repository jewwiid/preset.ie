-- Enhanced showcases system for user-created content
-- This migration adds support for showcases that aren't tied to gigs

-- Add new columns to showcases table
ALTER TABLE showcases 
ADD COLUMN IF NOT EXISTS title VARCHAR(255),
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'individual_image',
ADD COLUMN IF NOT EXISTS moodboard_summary TEXT,
ADD COLUMN IF NOT EXISTS moodboard_palette JSONB;

-- Make gig_id optional for user-created showcases
ALTER TABLE showcases ALTER COLUMN gig_id DROP NOT NULL;
ALTER TABLE showcases ALTER COLUMN talent_user_id DROP NOT NULL;

-- Create showcase_media table for better media management
CREATE TABLE IF NOT EXISTS showcase_media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    showcase_id UUID NOT NULL REFERENCES showcases(id) ON DELETE CASCADE,
    media_id UUID NOT NULL REFERENCES media(id) ON DELETE CASCADE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(showcase_id, media_id)
);

-- Create showcase_likes table
CREATE TABLE IF NOT EXISTS showcase_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    showcase_id UUID NOT NULL REFERENCES showcases(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(showcase_id, user_id)
);

-- Create showcase_comments table
CREATE TABLE IF NOT EXISTS showcase_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    showcase_id UUID NOT NULL REFERENCES showcases(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    parent_id UUID REFERENCES showcase_comments(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_showcase_media_showcase ON showcase_media(showcase_id);
CREATE INDEX IF NOT EXISTS idx_showcase_media_sort ON showcase_media(showcase_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_showcase_likes_showcase ON showcase_likes(showcase_id);
CREATE INDEX IF NOT EXISTS idx_showcase_likes_user ON showcase_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_showcase_comments_showcase ON showcase_comments(showcase_id);
CREATE INDEX IF NOT EXISTS idx_showcase_comments_parent ON showcase_comments(parent_id);

-- Update RLS policies for showcase_media
CREATE POLICY "Anyone can view showcase media for public showcases" ON showcase_media
    FOR SELECT USING (
        showcase_id IN (
            SELECT id FROM showcases WHERE visibility = 'PUBLIC'
        )
    );

CREATE POLICY "Showcase creators can manage showcase media" ON showcase_media
    FOR ALL USING (
        showcase_id IN (
            SELECT id FROM showcases WHERE creator_user_id = (
                SELECT id FROM users_profile WHERE user_id = auth.uid()
            )
        )
    );

-- Update RLS policies for showcase_likes
CREATE POLICY "Anyone can view showcase likes" ON showcase_likes
    FOR SELECT USING (
        showcase_id IN (
            SELECT id FROM showcases WHERE visibility = 'PUBLIC'
        )
    );

CREATE POLICY "Authenticated users can like showcases" ON showcase_likes
    FOR INSERT WITH CHECK (
        user_id = (SELECT id FROM users_profile WHERE user_id = auth.uid())
        AND showcase_id IN (
            SELECT id FROM showcases WHERE visibility = 'PUBLIC'
        )
    );

CREATE POLICY "Users can unlike their own likes" ON showcase_likes
    FOR DELETE USING (
        user_id = (SELECT id FROM users_profile WHERE user_id = auth.uid())
    );

-- Update RLS policies for showcase_comments
CREATE POLICY "Anyone can view comments on public showcases" ON showcase_comments
    FOR SELECT USING (
        showcase_id IN (
            SELECT id FROM showcases WHERE visibility = 'PUBLIC'
        )
    );

CREATE POLICY "Authenticated users can comment on public showcases" ON showcase_comments
    FOR INSERT WITH CHECK (
        user_id = (SELECT id FROM users_profile WHERE user_id = auth.uid())
        AND showcase_id IN (
            SELECT id FROM showcases WHERE visibility = 'PUBLIC'
        )
    );

CREATE POLICY "Users can update their own comments" ON showcase_comments
    FOR UPDATE USING (
        user_id = (SELECT id FROM users_profile WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can delete their own comments" ON showcase_comments
    FOR DELETE USING (
        user_id = (SELECT id FROM users_profile WHERE user_id = auth.uid())
    );

-- Update existing showcases RLS policies to allow user-created showcases
DROP POLICY IF EXISTS "Participants can create showcases" ON showcases;
CREATE POLICY "Users can create showcases" ON showcases
    FOR INSERT WITH CHECK (
        creator_user_id = (SELECT id FROM users_profile WHERE user_id = auth.uid())
    );

-- Add function to update showcase updated_at timestamp
CREATE OR REPLACE FUNCTION update_showcase_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for showcases updated_at
DROP TRIGGER IF EXISTS trigger_update_showcase_updated_at ON showcases;
CREATE TRIGGER trigger_update_showcase_updated_at
    BEFORE UPDATE ON showcases
    FOR EACH ROW
    EXECUTE FUNCTION update_showcase_updated_at();

-- Add function to update showcase_comments updated_at timestamp
CREATE OR REPLACE FUNCTION update_showcase_comment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for showcase_comments updated_at
DROP TRIGGER IF EXISTS trigger_update_showcase_comment_updated_at ON showcase_comments;
CREATE TRIGGER trigger_update_showcase_comment_updated_at
    BEFORE UPDATE ON showcase_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_showcase_comment_updated_at();

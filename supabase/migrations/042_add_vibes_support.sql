-- Add vibes support to user profiles
-- This migration adds vibe_tags field and updates existing records

-- Add vibe_tags column to users_profile table
ALTER TABLE users_profile 
ADD COLUMN vibe_tags text[] DEFAULT '{}';

-- Add comment to document the field
COMMENT ON COLUMN users_profile.vibe_tags IS 'Array of vibe tags that describe user personality/aesthetic (max 3)';

-- Create index for efficient vibe-based queries
CREATE INDEX idx_users_profile_vibe_tags ON users_profile USING GIN(vibe_tags);

-- Update existing profiles to have empty vibe arrays (they're already defaulted but let's be explicit)
UPDATE users_profile SET vibe_tags = '{}' WHERE vibe_tags IS NULL;

-- Add constraint to limit vibe tags to reasonable number
ALTER TABLE users_profile 
ADD CONSTRAINT check_vibe_tags_count 
CHECK (array_length(vibe_tags, 1) IS NULL OR array_length(vibe_tags, 1) <= 5);

-- Add vibe_tags to gigs table as well for gig-specific vibes
ALTER TABLE gigs 
ADD COLUMN vibe_tags text[] DEFAULT '{}';

COMMENT ON COLUMN gigs.vibe_tags IS 'Array of vibe tags that describe the desired aesthetic for this gig';

-- Create index for gigs vibe tags
CREATE INDEX idx_gigs_vibe_tags ON gigs USING GIN(vibe_tags);

-- Add constraint for gigs vibe tags
ALTER TABLE gigs 
ADD CONSTRAINT check_gig_vibe_tags_count 
CHECK (array_length(vibe_tags, 1) IS NULL OR array_length(vibe_tags, 1) <= 5);

-- Function to search profiles by vibes (for future matching algorithms)
CREATE OR REPLACE FUNCTION find_profiles_by_vibes(search_vibes text[])
RETURNS TABLE (
    user_id uuid,
    display_name text,
    handle text,
    style_tags text[],
    vibe_tags text[],
    match_score numeric
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.user_id,
        p.display_name,
        p.handle,
        p.style_tags,
        p.vibe_tags,
        -- Calculate match score based on overlapping vibes
        CASE 
            WHEN array_length(p.vibe_tags, 1) IS NULL THEN 0
            ELSE (
                SELECT COUNT(*) * 1.0 / GREATEST(array_length(search_vibes, 1), array_length(p.vibe_tags, 1))
                FROM unnest(search_vibes) AS search_vibe
                WHERE search_vibe = ANY(p.vibe_tags)
            )::numeric
        END as match_score
    FROM users_profile p
    WHERE p.vibe_tags && search_vibes -- overlapping arrays
    ORDER BY match_score DESC, p.display_name;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION find_profiles_by_vibes(text[]) TO authenticated;
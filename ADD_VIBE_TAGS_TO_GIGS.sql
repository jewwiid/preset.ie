-- Add vibe_tags and style_tags columns to gigs table
-- Run this in the Supabase Dashboard > SQL Editor

-- Add the missing columns
ALTER TABLE gigs ADD COLUMN IF NOT EXISTS style_tags TEXT[] DEFAULT '{}';
ALTER TABLE gigs ADD COLUMN IF NOT EXISTS vibe_tags TEXT[] DEFAULT '{}';
ALTER TABLE gigs ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE gigs ADD COLUMN IF NOT EXISTS country VARCHAR(100);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_gigs_style_tags ON gigs USING GIN(style_tags);
CREATE INDEX IF NOT EXISTS idx_gigs_vibe_tags ON gigs USING GIN(vibe_tags);
CREATE INDEX IF NOT EXISTS idx_gigs_city ON gigs(city);
CREATE INDEX IF NOT EXISTS idx_gigs_country ON gigs(country);

-- Add constraints to limit tags per gig
ALTER TABLE gigs 
ADD CONSTRAINT IF NOT EXISTS check_gig_style_tags_count 
CHECK (array_length(style_tags, 1) IS NULL OR array_length(style_tags, 1) <= 10);

ALTER TABLE gigs 
ADD CONSTRAINT IF NOT EXISTS check_gig_vibe_tags_count 
CHECK (array_length(vibe_tags, 1) IS NULL OR array_length(vibe_tags, 1) <= 10);

-- Add helpful comments
COMMENT ON COLUMN gigs.style_tags IS 'Array of style/aesthetic tags for this gig (fashion, portrait, etc.)';
COMMENT ON COLUMN gigs.vibe_tags IS 'Array of vibe tags for this gig (moody, bright, minimalist, etc.)';
COMMENT ON COLUMN gigs.city IS 'City where the gig takes place';
COMMENT ON COLUMN gigs.country IS 'Country where the gig takes place';

-- Test that columns were added successfully
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'gigs' 
AND column_name IN ('vibe_tags', 'style_tags', 'city', 'country');
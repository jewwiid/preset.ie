-- Add vibe_tags and style_tags columns to gigs table
-- Run this in your Supabase SQL Editor

-- Add vibe_tags column to gigs table
ALTER TABLE gigs ADD COLUMN IF NOT EXISTS vibe_tags TEXT[] DEFAULT '{}';

-- Add style_tags column to gigs table  
ALTER TABLE gigs ADD COLUMN IF NOT EXISTS style_tags TEXT[] DEFAULT '{}';

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_gigs_vibe_tags ON gigs USING GIN (vibe_tags);
CREATE INDEX IF NOT EXISTS idx_gigs_style_tags ON gigs USING GIN (style_tags);

-- Add comments
COMMENT ON COLUMN gigs.vibe_tags IS 'Array of vibe tags for this gig (e.g., moody, bright, ethereal)';
COMMENT ON COLUMN gigs.style_tags IS 'Array of style tags for this gig (e.g., portrait, fashion, editorial)';

-- Verify the columns were added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'gigs' 
AND column_name IN ('vibe_tags', 'style_tags')
ORDER BY column_name;
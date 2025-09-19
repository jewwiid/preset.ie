-- Add vibe_tags and style_tags columns, then populate with sample data
-- Copy and paste this ENTIRE content into Supabase Dashboard > SQL Editor

-- Step 1: Add the missing columns to gigs table
ALTER TABLE gigs ADD COLUMN IF NOT EXISTS style_tags TEXT[] DEFAULT '{}';
ALTER TABLE gigs ADD COLUMN IF NOT EXISTS vibe_tags TEXT[] DEFAULT '{}';

-- Step 2: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_gigs_style_tags ON gigs USING GIN(style_tags);
CREATE INDEX IF NOT EXISTS idx_gigs_vibe_tags ON gigs USING GIN(vibe_tags);

-- Step 3: Add sample vibe/style data to existing PUBLISHED gigs
UPDATE gigs 
SET 
    vibe_tags = CASE 
        WHEN title ILIKE '%fashion%' THEN ARRAY['edgy', 'bold', 'modern', 'stylish']
        WHEN title ILIKE '%portrait%' THEN ARRAY['moody', 'cinematic', 'dramatic'] 
        WHEN title ILIKE '%lifestyle%' THEN ARRAY['bright', 'cheerful', 'natural', 'warm']
        WHEN title ILIKE '%wedding%' THEN ARRAY['romantic', 'ethereal', 'timeless']
        WHEN title ILIKE '%commercial%' THEN ARRAY['clean', 'minimalist', 'professional']
        WHEN title ILIKE '%street%' THEN ARRAY['urban', 'gritty', 'authentic']
        ELSE ARRAY['creative', 'artistic', 'unique']
    END,
    style_tags = CASE 
        WHEN title ILIKE '%fashion%' THEN ARRAY['editorial', 'fashion', 'commercial']
        WHEN title ILIKE '%portrait%' THEN ARRAY['portrait', 'headshots']
        WHEN title ILIKE '%lifestyle%' THEN ARRAY['lifestyle', 'natural', 'candid']
        WHEN title ILIKE '%wedding%' THEN ARRAY['wedding', 'event', 'documentary'] 
        WHEN title ILIKE '%commercial%' THEN ARRAY['product', 'commercial', 'brand']
        WHEN title ILIKE '%street%' THEN ARRAY['street', 'urban', 'documentary']
        ELSE ARRAY['conceptual', 'creative']
    END
WHERE status = 'PUBLISHED' AND (vibe_tags IS NULL OR vibe_tags = '{}');

-- Step 4: Verify the data was added
SELECT 
    title,
    status,
    vibe_tags,
    style_tags
FROM gigs 
WHERE status = 'PUBLISHED'
ORDER BY created_at DESC;
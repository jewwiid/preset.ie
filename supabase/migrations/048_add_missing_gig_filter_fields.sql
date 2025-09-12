-- Add missing filter fields to gigs table that the frontend expects
-- This ensures all the Browse Gigs filters work properly

-- Add style_tags array to gigs table (similar to users_profile)
ALTER TABLE gigs 
ADD COLUMN IF NOT EXISTS style_tags TEXT[] DEFAULT '{}';

-- Add city/country fields for location filtering
ALTER TABLE gigs
ADD COLUMN IF NOT EXISTS city VARCHAR(100),
ADD COLUMN IF NOT EXISTS country VARCHAR(100);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_gigs_style_tags ON gigs USING GIN(style_tags);
CREATE INDEX IF NOT EXISTS idx_gigs_city ON gigs(city);
CREATE INDEX IF NOT EXISTS idx_gigs_country ON gigs(country);

-- Add constraint to limit style tags per gig
ALTER TABLE gigs 
ADD CONSTRAINT IF NOT EXISTS check_gig_style_tags_count 
CHECK (array_length(style_tags, 1) IS NULL OR array_length(style_tags, 1) <= 10);

-- Add comments
COMMENT ON COLUMN gigs.style_tags IS 'Array of style/aesthetic tags for this gig (fashion, portrait, etc.)';
COMMENT ON COLUMN gigs.city IS 'City where the gig takes place';
COMMENT ON COLUMN gigs.country IS 'Country where the gig takes place';

-- Update existing gigs to extract city from location_text where possible
UPDATE gigs 
SET 
  city = CASE 
    WHEN location_text ILIKE '%dublin%' THEN 'Dublin'
    WHEN location_text ILIKE '%cork%' THEN 'Cork'
    WHEN location_text ILIKE '%galway%' THEN 'Galway'
    WHEN location_text ILIKE '%limerick%' THEN 'Limerick'
    WHEN location_text ILIKE '%waterford%' THEN 'Waterford'
    WHEN location_text ILIKE '%london%' THEN 'London'
    WHEN location_text ILIKE '%manchester%' THEN 'Manchester'
    WHEN location_text ILIKE '%birmingham%' THEN 'Birmingham'
    WHEN location_text ILIKE '%new york%' THEN 'New York'
    WHEN location_text ILIKE '%los angeles%' THEN 'Los Angeles'
    WHEN location_text ILIKE '%san francisco%' THEN 'San Francisco'
    ELSE NULL
  END,
  country = CASE 
    WHEN location_text ILIKE '%dublin%' OR location_text ILIKE '%cork%' OR location_text ILIKE '%galway%' OR location_text ILIKE '%limerick%' OR location_text ILIKE '%waterford%' OR location_text ILIKE '%ireland%' THEN 'Ireland'
    WHEN location_text ILIKE '%london%' OR location_text ILIKE '%manchester%' OR location_text ILIKE '%birmingham%' OR location_text ILIKE '%uk%' OR location_text ILIKE '%united kingdom%' THEN 'United Kingdom'
    WHEN location_text ILIKE '%new york%' OR location_text ILIKE '%los angeles%' OR location_text ILIKE '%san francisco%' OR location_text ILIKE '%usa%' OR location_text ILIKE '%united states%' THEN 'United States'
    ELSE NULL
  END
WHERE city IS NULL AND country IS NULL;
-- Add looking_for_types column to gigs table
-- This helps categorize what type of talent/roles the gig is seeking
-- Supports multiple selections (e.g., ["MODELS", "MAKEUP_ARTISTS"])
-- Expanded from 11 to 51 talent categories for better matching

-- Add looking_for_types array column to gigs table
ALTER TABLE gigs
ADD COLUMN IF NOT EXISTS looking_for_types TEXT[] DEFAULT '{}';

-- Create GIN index for array operations (faster filtering)
CREATE INDEX IF NOT EXISTS idx_gigs_looking_for_types
ON gigs USING GIN (looking_for_types)
WHERE looking_for_types IS NOT NULL AND looking_for_types != '{}';

-- Add comment to document the column purpose
COMMENT ON COLUMN gigs.looking_for_types IS 
'Array of role types this gig is looking for (e.g., [''MODELS'', ''MAKEUP_ARTISTS'']). 
Supports multiple selections for gigs needing various roles.
Valid values: MODELS, MODELS_FASHION, MODELS_COMMERCIAL, MODELS_FITNESS, ACTORS, DANCERS, 
PHOTOGRAPHERS, VIDEOGRAPHERS, MAKEUP_ARTISTS, HAIR_STYLISTS, FASHION_STYLISTS, 
PRODUCTION_CREW, PRODUCERS, DIRECTORS, EDITORS, VFX_ARTISTS, DESIGNERS, CONTENT_CREATORS, 
INFLUENCERS, AGENCIES, BRAND_MANAGERS, WRITERS, and more.
See gig-form-persistence.ts for complete list of 51 types.';

-- Update existing gigs with intelligent defaults based on title/description
-- This helps migrate existing gigs to use the new system
UPDATE gigs
SET looking_for_types = 
  CASE 
    -- Check for multiple types first
    WHEN (title ILIKE '%model%' OR description ILIKE '%model%') 
         AND (title ILIKE '%makeup%' OR description ILIKE '%makeup%')
      THEN ARRAY['MODELS', 'MAKEUP_ARTISTS']
    
    WHEN (title ILIKE '%photo%' OR description ILIKE '%photo%')
         AND (title ILIKE '%model%' OR description ILIKE '%model%')
      THEN ARRAY['PHOTOGRAPHERS', 'MODELS']
    
    -- Single type matches
    WHEN title ILIKE '%model%' OR description ILIKE '%model%' 
      THEN ARRAY['MODELS']
    WHEN title ILIKE '%photographer%' OR description ILIKE '%photo%'
      THEN ARRAY['PHOTOGRAPHERS']
    WHEN title ILIKE '%videographer%' OR description ILIKE '%video%'
      THEN ARRAY['VIDEOGRAPHERS']
    WHEN title ILIKE '%makeup%' OR description ILIKE '%MUA%'
      THEN ARRAY['MAKEUP_ARTISTS']
    WHEN title ILIKE '%hair%stylist%' OR description ILIKE '%hair%'
      THEN ARRAY['HAIR_STYLISTS']
    WHEN title ILIKE '%fashion%stylist%' OR description ILIKE '%styling%'
      THEN ARRAY['FASHION_STYLISTS']
    WHEN title ILIKE '%actor%' OR description ILIKE '%acting%'
      THEN ARRAY['ACTORS']
    WHEN title ILIKE '%dancer%' OR description ILIKE '%dance%'
      THEN ARRAY['DANCERS']
    WHEN title ILIKE '%influencer%' OR description ILIKE '%influencer%'
      THEN ARRAY['INFLUENCERS']
    WHEN title ILIKE '%content%creator%' OR description ILIKE '%content%'
      THEN ARRAY['CONTENT_CREATORS']
    
    -- Default for unclear gigs
    ELSE ARRAY['OTHER']
  END
WHERE looking_for_types = '{}' OR looking_for_types IS NULL;

-- Grant necessary permissions
GRANT SELECT, UPDATE ON gigs TO authenticated;

-- Create helper function to check if a gig is looking for a specific role
CREATE OR REPLACE FUNCTION gig_is_looking_for(
  gig_types TEXT[],
  search_type TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN search_type = ANY(gig_types);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create helper function to check if any of the user's roles match the gig
CREATE OR REPLACE FUNCTION user_matches_gig_types(
  user_primary_role TEXT,
  user_categories TEXT[],
  gig_looking_for TEXT[]
) RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user's primary role matches any gig type
  IF user_primary_role = ANY(gig_looking_for) THEN
    RETURN TRUE;
  END IF;
  
  -- Check if any user category matches any gig type
  IF user_categories && gig_looking_for THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add validation constraint (optional - prevents invalid data)
ALTER TABLE gigs
ADD CONSTRAINT valid_looking_for_types CHECK (
  array_length(looking_for_types, 1) IS NULL OR 
  array_length(looking_for_types, 1) BETWEEN 1 AND 10
);

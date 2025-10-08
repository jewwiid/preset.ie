-- Improve gig location structure
-- Populate city and country fields from location_text where possible
-- Update existing gigs to have structured location data

-- First, let's add comments to clarify the fields
COMMENT ON COLUMN gigs.location_text IS 'Free-text location description (legacy field, prefer city/country)';
COMMENT ON COLUMN gigs.city IS 'City name for structured location data';
COMMENT ON COLUMN gigs.country IS 'Country name for structured location data';
COMMENT ON COLUMN gigs.location IS 'PostGIS geography point for map coordinates';

-- Try to parse existing location_text into city/country
-- This is a best-effort migration for existing data
UPDATE gigs
SET 
  city = CASE
    WHEN location_text ILIKE '%Manchester%' THEN 'Manchester'
    WHEN location_text ILIKE '%London%' THEN 'London'
    WHEN location_text ILIKE '%Dublin%' THEN 'Dublin'
    WHEN location_text ILIKE '%Paris%' THEN 'Paris'
    WHEN location_text ILIKE '%New York%' THEN 'New York'
    WHEN location_text ILIKE '%Los Angeles%' THEN 'Los Angeles'
    -- Add more common cities as needed
    ELSE NULL
  END,
  country = CASE
    WHEN location_text ILIKE '%UK%' OR location_text ILIKE '%United Kingdom%' OR 
         location_text ILIKE '%Manchester%' OR location_text ILIKE '%London%' OR 
         location_text ILIKE '%Birmingham%' OR location_text ILIKE '%Leeds%' 
      THEN 'United Kingdom'
    WHEN location_text ILIKE '%Ireland%' OR location_text ILIKE '%Dublin%' 
      THEN 'Ireland'
    WHEN location_text ILIKE '%France%' OR location_text ILIKE '%Paris%' 
      THEN 'France'
    WHEN location_text ILIKE '%USA%' OR location_text ILIKE '%United States%' OR
         location_text ILIKE '%New York%' OR location_text ILIKE '%Los Angeles%' OR
         location_text ILIKE '%Chicago%'
      THEN 'United States'
    -- Add more countries as needed
    ELSE NULL
  END
WHERE city IS NULL OR country IS NULL;

-- Update Manchester gig specifically
UPDATE gigs
SET 
  city = 'Manchester',
  country = 'United Kingdom'
WHERE location_text = 'Manchester';

-- Create indexes for city/country filtering
CREATE INDEX IF NOT EXISTS idx_gigs_city ON gigs(city) WHERE city IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_gigs_country ON gigs(country) WHERE country IS NOT NULL;

-- Create a helper function to format location consistently
CREATE OR REPLACE FUNCTION format_gig_location(
  p_city TEXT,
  p_country TEXT,
  p_location_text TEXT
) RETURNS TEXT AS $$
BEGIN
  -- If we have both city and country, use structured format
  IF p_city IS NOT NULL AND p_country IS NOT NULL THEN
    RETURN p_city || ', ' || p_country;
  -- If we only have city, return it
  ELSIF p_city IS NOT NULL THEN
    RETURN p_city;
  -- Fall back to location_text
  ELSE
    RETURN p_location_text;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Verify the changes
SELECT 
  id,
  title,
  location_text,
  city,
  country,
  format_gig_location(city, country, location_text) as formatted_location
FROM gigs
ORDER BY created_at DESC;


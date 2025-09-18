-- Check if gig_purpose enum exists, if not create it
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gig_purpose') THEN
    CREATE TYPE gig_purpose AS ENUM (
        'PORTFOLIO',
        'COMMERCIAL',
        'EDITORIAL',
        'FASHION',
        'BEAUTY',
        'LIFESTYLE',
        'WEDDING',
        'EVENT',
        'PRODUCT',
        'ARCHITECTURE',
        'STREET',
        'CONCEPTUAL',
        'OTHER'
    );
  END IF;
END $$;

-- Add purpose column to gigs table with the enum type
ALTER TABLE gigs ADD COLUMN IF NOT EXISTS purpose gig_purpose;

-- Update any existing gigs with a default value
UPDATE gigs SET purpose = 'PORTFOLIO' WHERE purpose IS NULL;

-- Add a comment to the column for documentation
COMMENT ON COLUMN gigs.purpose IS 'The purpose/category of the photography shoot';

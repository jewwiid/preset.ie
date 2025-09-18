-- Create purpose enum type for gigs
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

-- Add purpose column to gigs table with the enum type
ALTER TABLE gigs ADD COLUMN IF NOT EXISTS purpose gig_purpose;

-- Update any existing gigs with a default value
UPDATE gigs SET purpose = 'PORTFOLIO' WHERE purpose IS NULL;

-- Add a comment to the column for documentation
COMMENT ON COLUMN gigs.purpose IS 'The purpose/category of the photography shoot';

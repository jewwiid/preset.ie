-- Add purpose column to gigs table
ALTER TABLE gigs ADD COLUMN IF NOT EXISTS purpose TEXT;

-- Update any existing gigs with a default value
UPDATE gigs SET purpose = 'Not specified' WHERE purpose IS NULL;
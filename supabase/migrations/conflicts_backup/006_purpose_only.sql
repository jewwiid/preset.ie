-- Only add purpose column and enum, skip if already exists
DO $$ 
BEGIN
  -- Create enum type if it doesn't exist
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
  
  -- Add purpose column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'gigs' AND column_name = 'purpose'
  ) THEN
    ALTER TABLE gigs ADD COLUMN purpose gig_purpose;
    UPDATE gigs SET purpose = 'PORTFOLIO' WHERE purpose IS NULL;
    COMMENT ON COLUMN gigs.purpose IS 'The purpose/category of the photography shoot';
  END IF;
END $$;

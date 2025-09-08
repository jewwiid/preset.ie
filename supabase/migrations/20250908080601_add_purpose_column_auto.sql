-- Add purpose column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'gigs' AND column_name = 'purpose'
  ) THEN
    ALTER TABLE public.gigs ADD COLUMN purpose TEXT;
  END IF;
END $$;
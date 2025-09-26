-- Setup Listing Images System for Remote Database
-- Run this on your remote Supabase database

-- 1. Create listing_images table if it doesn't exist
CREATE TABLE IF NOT EXISTS listing_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  path TEXT NOT NULL,
  url TEXT NOT NULL,
  alt_text TEXT,
  sort_order INTEGER DEFAULT 0,
  file_size BIGINT,
  mime_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_listing_images_listing_id ON listing_images(listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_images_sort_order ON listing_images(listing_id, sort_order);

-- 3. Enable RLS
ALTER TABLE listing_images ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view listing images" ON listing_images;
DROP POLICY IF EXISTS "Users can insert listing images" ON listing_images;
DROP POLICY IF EXISTS "Users can update listing images" ON listing_images;
DROP POLICY IF EXISTS "Users can delete listing images" ON listing_images;

-- 5. Create RLS policies
CREATE POLICY "Users can view listing images" ON listing_images
  FOR SELECT USING (true);

CREATE POLICY "Users can insert listing images" ON listing_images
  FOR INSERT WITH CHECK (
    auth.uid()::text IN (
      SELECT user_id::text 
      FROM users_profile up 
      JOIN listings l ON l.owner_id = up.id 
      WHERE l.id = listing_id
    )
  );

CREATE POLICY "Users can update listing images" ON listing_images
  FOR UPDATE USING (
    auth.uid()::text IN (
      SELECT user_id::text 
      FROM users_profile up 
      JOIN listings l ON l.owner_id = up.id 
      WHERE l.id = listing_id
    )
  );

CREATE POLICY "Users can delete listing images" ON listing_images
  FOR DELETE USING (
    auth.uid()::text IN (
      SELECT user_id::text 
      FROM users_profile up 
      JOIN listings l ON l.owner_id = up.id 
      WHERE l.id = listing_id
    )
  );

-- 6. Create or replace the update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_listing_images_updated_at ON listing_images;

-- 8. Create trigger for updated_at
CREATE TRIGGER update_listing_images_updated_at
  BEFORE UPDATE ON listing_images
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 9. Insert sample image data for existing listings (if you want to test)
-- Replace the listing_id with your actual listing ID from the listings_rows.sql file
-- Replace the path and url with your actual image paths from the marketplace-images bucket

-- Example for listing '11282a83-c665-4a55-bdf5-67c733ab8bc6':
-- INSERT INTO listing_images (listing_id, path, url, alt_text, sort_order, file_size, mime_type)
-- VALUES (
--   '11282a83-c665-4a55-bdf5-67c733ab8bc6',
--   'd6953adb-9c93-4d17-92f5-268990b6650f/11282a83-c665-4a55-bdf5-67c733ab8bc6/1758830803140-0.jpg',
--   'https://your-supabase-url.supabase.co/storage/v1/object/public/marketplace-images/d6953adb-9c93-4d17-92f5-268990b6650f/11282a83-c665-4a55-bdf5-67c733ab8bc6/1758830803140-0.jpg',
--   'Canon (peak design Everyday Backpack)',
--   0,
--   2200000, -- 2.2MB
--   'image/jpeg'
-- );

-- 10. Verify the setup
SELECT 'Setup complete! Listing images table created successfully.' as status;

-- 11. Check if there are any existing images
SELECT COUNT(*) as existing_images FROM listing_images;

-- 12. Show the table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'listing_images' 
ORDER BY ordinal_position;

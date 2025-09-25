-- Create listing_images table for storing image metadata
CREATE TABLE IF NOT EXISTS listing_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  path TEXT NOT NULL, -- Storage path in Supabase Storage
  url TEXT NOT NULL, -- Public URL
  alt_text TEXT, -- Alt text for accessibility
  sort_order INTEGER DEFAULT 0, -- For ordering images
  file_size INTEGER, -- File size in bytes
  mime_type TEXT, -- MIME type (image/jpeg, image/png, etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_listing_images_listing_id ON listing_images(listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_images_sort_order ON listing_images(listing_id, sort_order);

-- Enable RLS
ALTER TABLE listing_images ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (using DROP IF EXISTS to avoid conflicts)
DROP POLICY IF EXISTS "Anyone can view images for published listings" ON listing_images;
DROP POLICY IF EXISTS "Listing owners can manage their own images" ON listing_images;
DROP POLICY IF EXISTS "Admins can manage all images" ON listing_images;

-- Anyone can view images for published listings
CREATE POLICY "Anyone can view images for published listings" ON listing_images
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM listings 
      WHERE listings.id = listing_images.listing_id 
      AND listings.status = 'published'
    )
  );

-- Listing owners can manage their own images
CREATE POLICY "Listing owners can manage their own images" ON listing_images
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM listings 
      WHERE listings.id = listing_images.listing_id 
      AND listings.owner_id = auth.uid()
    )
  );

-- Admins can manage all images
CREATE POLICY "Admins can manage all images" ON listing_images
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users_profile 
      WHERE users_profile.user_id = auth.uid() 
      AND 'ADMIN' = ANY(users_profile.role_flags)
    )
  );

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_listing_images_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_listing_images_updated_at ON listing_images;
CREATE TRIGGER trigger_update_listing_images_updated_at
  BEFORE UPDATE ON listing_images
  FOR EACH ROW
  EXECUTE FUNCTION update_listing_images_updated_at();

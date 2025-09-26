-- Create listing_images table for storing image metadata
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_listing_images_listing_id ON listing_images(listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_images_sort_order ON listing_images(listing_id, sort_order);

-- Enable RLS
ALTER TABLE listing_images ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
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

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_listing_images_updated_at
  BEFORE UPDATE ON listing_images
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
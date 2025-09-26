-- Create listings table
CREATE TABLE IF NOT EXISTS listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,              -- e.g., camera, lens, lighting, audio, accessories
  condition TEXT CHECK (condition IN ('new', 'like_new', 'good', 'fair', 'poor')) DEFAULT 'good',
  mode TEXT CHECK (mode IN ('rent','sale','both')) NOT NULL DEFAULT 'rent',
  rent_day_cents INTEGER,         -- null if not for rent
  rent_week_cents INTEGER,        -- optional weekly price
  sale_price_cents INTEGER,       -- null if not for sale
  retainer_mode TEXT CHECK (retainer_mode IN ('none','credit_hold','card_hold')) NOT NULL DEFAULT 'none',
  retainer_cents INTEGER DEFAULT 0,
  deposit_cents INTEGER DEFAULT 0,
  borrow_ok BOOLEAN NOT NULL DEFAULT false,
  quantity INTEGER NOT NULL DEFAULT 1,
  location_city TEXT,
  location_country TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  verified_only BOOLEAN NOT NULL DEFAULT false, -- only verified can book
  status TEXT CHECK (status IN ('active','paused','archived')) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_rent_pricing CHECK (
    (mode IN ('rent', 'both') AND rent_day_cents IS NOT NULL AND rent_day_cents > 0) OR
    (mode = 'sale')
  ),
  CONSTRAINT valid_sale_pricing CHECK (
    (mode IN ('sale', 'both') AND sale_price_cents IS NOT NULL AND sale_price_cents > 0) OR
    (mode = 'rent')
  ),
  CONSTRAINT valid_location CHECK (
    (latitude IS NULL AND longitude IS NULL) OR
    (latitude IS NOT NULL AND longitude IS NOT NULL)
  )
);

-- Create indexes for listings table
CREATE INDEX IF NOT EXISTS idx_listings_owner_id ON listings(owner_id);
CREATE INDEX IF NOT EXISTS idx_listings_category ON listings(category);
CREATE INDEX IF NOT EXISTS idx_listings_mode ON listings(mode);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_location_city ON listings(location_city);
CREATE INDEX IF NOT EXISTS idx_listings_location_country ON listings(location_country);
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON listings(created_at);

-- Create RLS policies for listings table
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view active listings
CREATE POLICY "Users can view active listings" ON listings
  FOR SELECT USING (status = 'active');

-- Policy: Owners can view their own listings
CREATE POLICY "Owners can view their own listings" ON listings
  FOR SELECT USING (auth.uid()::text = owner_id::text);

-- Policy: Owners can insert their own listings
CREATE POLICY "Owners can insert their own listings" ON listings
  FOR INSERT WITH CHECK (auth.uid()::text = owner_id::text);

-- Policy: Owners can update their own listings
CREATE POLICY "Owners can update their own listings" ON listings
  FOR UPDATE USING (auth.uid()::text = owner_id::text);

-- Policy: Owners can delete their own listings
CREATE POLICY "Owners can delete their own listings" ON listings
  FOR DELETE USING (auth.uid()::text = owner_id::text);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_listings_updated_at BEFORE UPDATE ON listings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

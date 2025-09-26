-- Drop existing tables if they exist (to avoid conflicts)
DROP TABLE IF EXISTS rental_requests CASCADE;
DROP TABLE IF EXISTS offers CASCADE;

-- Create rental_requests table
CREATE TABLE rental_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  message TEXT,
  total_amount_cents INTEGER NOT NULL CHECK (total_amount_cents >= 0),
  status TEXT CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled', 'completed')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_rental_dates CHECK (end_date > start_date),
  CONSTRAINT valid_rental_amount CHECK (total_amount_cents >= 0)
);

-- Create offers table
CREATE TABLE offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  offerer_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
  offer_amount_cents INTEGER NOT NULL CHECK (offer_amount_cents > 0),
  message TEXT,
  contact_preference TEXT CHECK (contact_preference IN ('message', 'phone', 'email')) DEFAULT 'message',
  status TEXT CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn', 'expired')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_offer_amount CHECK (offer_amount_cents > 0)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_rental_requests_listing_id ON rental_requests(listing_id);
CREATE INDEX IF NOT EXISTS idx_rental_requests_requester_id ON rental_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_rental_requests_owner_id ON rental_requests(owner_id);
CREATE INDEX IF NOT EXISTS idx_rental_requests_status ON rental_requests(status);
CREATE INDEX IF NOT EXISTS idx_rental_requests_dates ON rental_requests(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_offers_listing_id ON offers(listing_id);
CREATE INDEX IF NOT EXISTS idx_offers_offerer_id ON offers(offerer_id);
CREATE INDEX IF NOT EXISTS idx_offers_owner_id ON offers(owner_id);
CREATE INDEX IF NOT EXISTS idx_offers_status ON offers(status);

-- Enable RLS
ALTER TABLE rental_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view rental requests for their listings" ON rental_requests;
DROP POLICY IF EXISTS "Users can create rental requests" ON rental_requests;
DROP POLICY IF EXISTS "Owners can update rental request status" ON rental_requests;
DROP POLICY IF EXISTS "Requesters can cancel their rental requests" ON rental_requests;

DROP POLICY IF EXISTS "Users can view offers for their listings" ON offers;
DROP POLICY IF EXISTS "Users can create offers" ON offers;
DROP POLICY IF EXISTS "Owners can update offer status" ON offers;
DROP POLICY IF EXISTS "Offerers can withdraw their offers" ON offers;

-- RLS Policies for rental_requests
CREATE POLICY "Users can view rental requests for their listings" ON rental_requests
  FOR SELECT USING (
    auth.uid()::text = owner_id::text OR 
    auth.uid()::text = requester_id::text
  );

CREATE POLICY "Users can create rental requests" ON rental_requests
  FOR INSERT WITH CHECK (auth.uid()::text = requester_id::text);

CREATE POLICY "Owners can update rental request status" ON rental_requests
  FOR UPDATE USING (auth.uid()::text = owner_id::text);

CREATE POLICY "Requesters can cancel their rental requests" ON rental_requests
  FOR UPDATE USING (
    auth.uid()::text = requester_id::text AND 
    status = 'pending'
  );

-- RLS Policies for offers
CREATE POLICY "Users can view offers for their listings" ON offers
  FOR SELECT USING (
    auth.uid()::text = owner_id::text OR 
    auth.uid()::text = offerer_id::text
  );

CREATE POLICY "Users can create offers" ON offers
  FOR INSERT WITH CHECK (auth.uid()::text = offerer_id::text);

CREATE POLICY "Owners can update offer status" ON offers
  FOR UPDATE USING (auth.uid()::text = owner_id::text);

CREATE POLICY "Offerers can withdraw their offers" ON offers
  FOR UPDATE USING (
    auth.uid()::text = offerer_id::text AND 
    status = 'pending'
  );

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_rental_requests_updated_at ON rental_requests;
CREATE TRIGGER update_rental_requests_updated_at
  BEFORE UPDATE ON rental_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_offers_updated_at ON offers;
CREATE TRIGGER update_offers_updated_at
  BEFORE UPDATE ON offers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE rental_requests IS 'Rental requests for equipment listings';
COMMENT ON TABLE offers IS 'Purchase offers for equipment listings';

COMMENT ON COLUMN rental_requests.total_amount_cents IS 'Total cost including rental, deposit, and retainer';
COMMENT ON COLUMN offers.offer_amount_cents IS 'Offer amount in cents';
COMMENT ON COLUMN offers.contact_preference IS 'Preferred contact method for negotiation';

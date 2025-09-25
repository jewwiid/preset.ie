-- Create offers table for marketplace functionality
CREATE TABLE IF NOT EXISTS offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL,
  from_user UUID NOT NULL,
  to_user UUID NOT NULL,
  context TEXT CHECK (context IN ('rent','sale')) NOT NULL,
  payload JSONB NOT NULL,      -- {price_cents, start_date, end_date, quantity, message}
  status TEXT CHECK (status IN ('open','countered','accepted','declined','expired','cancelled')) NOT NULL DEFAULT 'open',
  expires_at TIMESTAMPTZ,     -- when offer expires
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT different_users CHECK (from_user != to_user),
  CONSTRAINT valid_payload CHECK (payload ? 'price_cents')
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_offers_listing_id ON offers(listing_id);
CREATE INDEX IF NOT EXISTS idx_offers_from_user ON offers(from_user);
CREATE INDEX IF NOT EXISTS idx_offers_to_user ON offers(to_user);
CREATE INDEX IF NOT EXISTS idx_offers_status ON offers(status);
CREATE INDEX IF NOT EXISTS idx_offers_created_at ON offers(created_at);

-- Enable RLS
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view offers they sent or received" ON offers
  FOR SELECT USING (
    auth.uid() = from_user OR auth.uid() = to_user
  );

CREATE POLICY "Users can create offers" ON offers
  FOR INSERT WITH CHECK (
    auth.uid() = from_user
  );

CREATE POLICY "Users can update offers they sent" ON offers
  FOR UPDATE USING (
    auth.uid() = from_user
  );

CREATE POLICY "Users can delete offers they sent" ON offers
  FOR DELETE USING (
    auth.uid() = from_user
  );

-- Add comments
COMMENT ON TABLE offers IS 'Marketplace offers for equipment rental and sales';
COMMENT ON COLUMN offers.payload IS 'JSON payload containing offer details like price_cents, start_date, end_date, quantity, message';
COMMENT ON COLUMN offers.context IS 'Whether this is a rent or sale offer';
COMMENT ON COLUMN offers.status IS 'Current status of the offer: open, countered, accepted, declined, expired, cancelled';

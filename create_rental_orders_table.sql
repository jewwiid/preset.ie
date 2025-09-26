-- Create rental_orders table
CREATE TABLE IF NOT EXISTS rental_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
  renter_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  day_rate_cents INTEGER NOT NULL,
  calculated_total_cents INTEGER NOT NULL,
  retainer_mode TEXT NOT NULL,
  retainer_cents INTEGER NOT NULL DEFAULT 0,
  deposit_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'EUR',
  status TEXT CHECK (status IN (
    'requested','accepted','rejected','paid','in_progress','completed','cancelled','refunded','disputed'
  )) NOT NULL DEFAULT 'requested',
  credits_tx_id UUID,          -- if using credits marketplace
  stripe_pi_id TEXT,           -- PaymentIntent id for card hold/capture
  pickup_location TEXT,        -- where equipment will be picked up
  return_location TEXT,        -- where equipment will be returned
  special_instructions TEXT,    -- any special instructions
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_rental_dates CHECK (end_date > start_date),
  CONSTRAINT valid_rental_amounts CHECK (
    day_rate_cents > 0 AND 
    calculated_total_cents > 0 AND 
    retainer_cents >= 0 AND 
    deposit_cents >= 0
  ),
  CONSTRAINT different_users CHECK (owner_id != renter_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_rental_orders_listing_id ON rental_orders(listing_id);
CREATE INDEX IF NOT EXISTS idx_rental_orders_owner_id ON rental_orders(owner_id);
CREATE INDEX IF NOT EXISTS idx_rental_orders_renter_id ON rental_orders(renter_id);
CREATE INDEX IF NOT EXISTS idx_rental_orders_status ON rental_orders(status);
CREATE INDEX IF NOT EXISTS idx_rental_orders_dates ON rental_orders(start_date, end_date);

-- Enable RLS
ALTER TABLE rental_orders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "rental_orders_read_own" ON rental_orders 
  FOR SELECT USING (auth.uid() = owner_id OR auth.uid() = renter_id);

CREATE POLICY "rental_orders_insert_as_renter" ON rental_orders 
  FOR INSERT WITH CHECK (auth.uid() = renter_id);

CREATE POLICY "rental_orders_update_own" ON rental_orders 
  FOR UPDATE USING (auth.uid() = owner_id OR auth.uid() = renter_id);

-- Create trigger for updated_at
CREATE TRIGGER update_rental_orders_updated_at
    BEFORE UPDATE ON rental_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

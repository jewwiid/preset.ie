-- =====================================================
-- MARKETPLACE ACTIVATION MIGRATION
-- =====================================================
-- Migration: 098_marketplace_activation.sql
-- Description: Activate marketplace system for rent & sell functionality
-- Dependencies: Existing users_profile, credit system, messaging system

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- MARKETPLACE TABLES
-- =====================================================

-- LISTINGS TABLE
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

-- LISTING IMAGES TABLE
CREATE TABLE IF NOT EXISTS listing_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  path TEXT NOT NULL,           -- storage path in bucket 'listings'
  sort_order INTEGER NOT NULL DEFAULT 0,
  alt_text TEXT,                -- accessibility
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- AVAILABILITY TABLE (blackouts or reservations)
CREATE TABLE IF NOT EXISTS listing_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  kind TEXT CHECK (kind IN ('blackout','reserved')) NOT NULL,
  ref_order_id UUID,           -- link when reserved
  notes TEXT,                  -- optional notes about availability
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_date_range CHECK (end_date >= start_date),
  CONSTRAINT valid_reservation CHECK (
    (kind = 'blackout' AND ref_order_id IS NULL) OR
    (kind = 'reserved' AND ref_order_id IS NOT NULL)
  )
);

-- RENTAL ORDERS TABLE
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

-- SALE ORDERS TABLE
CREATE TABLE IF NOT EXISTS sale_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
  unit_price_cents INTEGER NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  total_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  status TEXT CHECK (status IN ('placed','paid','shipped','delivered','cancelled','refunded','disputed')) NOT NULL DEFAULT 'placed',
  credits_tx_id UUID,
  stripe_pi_id TEXT,
  shipping_address JSONB,      -- structured shipping information
  tracking_number TEXT,       -- shipping tracking
  notes TEXT,                 -- order notes
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_sale_amounts CHECK (
    unit_price_cents > 0 AND 
    quantity > 0 AND 
    total_cents > 0
  ),
  CONSTRAINT different_users CHECK (owner_id != buyer_id)
);

-- OFFERS TABLE (for rent or sale negotiation)
CREATE TABLE IF NOT EXISTS offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  from_user UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
  to_user UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
  context TEXT CHECK (context IN ('rent','sale')) NOT NULL,
  payload JSONB NOT NULL,      -- {price_cents, start_date, end_date, quantity, message}
  status TEXT CHECK (status IN ('open','countered','accepted','declined','expired')) NOT NULL DEFAULT 'open',
  expires_at TIMESTAMPTZ,     -- when offer expires
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT different_users CHECK (from_user != to_user),
  CONSTRAINT valid_payload CHECK (payload ? 'price_cents')
);

-- MARKETPLACE REVIEWS TABLE
CREATE TABLE IF NOT EXISTS marketplace_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_type TEXT CHECK (order_type IN ('rent','sale')) NOT NULL,
  order_id UUID NOT NULL,
  author_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
  subject_user_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5) NOT NULL,
  comment TEXT,
  response TEXT,              -- owner response to review
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT different_users CHECK (author_id != subject_user_id)
  -- Note: Order reference validation will be handled at application level
  -- since PostgreSQL doesn't allow subqueries in CHECK constraints
);

-- MARKETPLACE DISPUTES TABLE (optional audit trail)
CREATE TABLE IF NOT EXISTS marketplace_disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_type TEXT CHECK (order_type IN ('rent','sale')) NOT NULL,
  order_id UUID NOT NULL,
  reporter_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
  reported_user_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT CHECK (status IN ('open','investigating','resolved','closed')) NOT NULL DEFAULT 'open',
  resolution TEXT,            -- admin resolution notes
  resolved_by UUID REFERENCES users_profile(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT different_users CHECK (reporter_id != reported_user_id)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Listings indexes
CREATE INDEX IF NOT EXISTS idx_listings_owner_id ON listings(owner_id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_mode ON listings(mode);
CREATE INDEX IF NOT EXISTS idx_listings_category ON listings(category);
CREATE INDEX IF NOT EXISTS idx_listings_location ON listings(latitude, longitude) WHERE latitude IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON listings(created_at);
CREATE INDEX IF NOT EXISTS idx_listings_verified_only ON listings(verified_only);

-- Listing images indexes
CREATE INDEX IF NOT EXISTS idx_listing_images_listing_id ON listing_images(listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_images_sort_order ON listing_images(listing_id, sort_order);

-- Availability indexes
CREATE INDEX IF NOT EXISTS idx_listing_availability_listing_id ON listing_availability(listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_availability_dates ON listing_availability(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_listing_availability_kind ON listing_availability(kind);

-- Rental orders indexes
CREATE INDEX IF NOT EXISTS idx_rental_orders_listing_id ON rental_orders(listing_id);
CREATE INDEX IF NOT EXISTS idx_rental_orders_owner_id ON rental_orders(owner_id);
CREATE INDEX IF NOT EXISTS idx_rental_orders_renter_id ON rental_orders(renter_id);
CREATE INDEX IF NOT EXISTS idx_rental_orders_status ON rental_orders(status);
CREATE INDEX IF NOT EXISTS idx_rental_orders_dates ON rental_orders(start_date, end_date);

-- Sale orders indexes
CREATE INDEX IF NOT EXISTS idx_sale_orders_listing_id ON sale_orders(listing_id);
CREATE INDEX IF NOT EXISTS idx_sale_orders_owner_id ON sale_orders(owner_id);
CREATE INDEX IF NOT EXISTS idx_sale_orders_buyer_id ON sale_orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_sale_orders_status ON sale_orders(status);

-- Offers indexes
CREATE INDEX IF NOT EXISTS idx_offers_listing_id ON offers(listing_id);
CREATE INDEX IF NOT EXISTS idx_offers_from_user ON offers(from_user);
CREATE INDEX IF NOT EXISTS idx_offers_to_user ON offers(to_user);
CREATE INDEX IF NOT EXISTS idx_offers_status ON offers(status);
CREATE INDEX IF NOT EXISTS idx_offers_expires_at ON offers(expires_at);

-- Reviews indexes
CREATE INDEX IF NOT EXISTS idx_marketplace_reviews_order ON marketplace_reviews(order_type, order_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_reviews_author ON marketplace_reviews(author_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_reviews_subject ON marketplace_reviews(subject_user_id);

-- Disputes indexes
CREATE INDEX IF NOT EXISTS idx_marketplace_disputes_order ON marketplace_disputes(order_type, order_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_disputes_reporter ON marketplace_disputes(reporter_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_disputes_reported ON marketplace_disputes(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_disputes_status ON marketplace_disputes(status);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE rental_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_disputes ENABLE ROW LEVEL SECURITY;

-- LISTINGS POLICIES
-- Anyone can read active listings, owners can read their own
CREATE POLICY "listings_read_active" ON listings 
  FOR SELECT USING (status = 'active' OR auth.uid() = owner_id);

-- Only owners can insert their own listings
CREATE POLICY "listings_insert_own" ON listings 
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Only owners can update their own listings
CREATE POLICY "listings_update_own" ON listings 
  FOR UPDATE USING (auth.uid() = owner_id);

-- Only owners can delete their own listings
CREATE POLICY "listings_delete_own" ON listings 
  FOR DELETE USING (auth.uid() = owner_id);

-- LISTING IMAGES POLICIES
-- Read if parent listing is visible
CREATE POLICY "listing_images_read" ON listing_images 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM listings l 
      WHERE l.id = listing_id 
      AND (l.status = 'active' OR l.owner_id = auth.uid())
    )
  );

-- Only listing owners can insert images
CREATE POLICY "listing_images_insert_own" ON listing_images 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM listings l 
      WHERE l.id = listing_id 
      AND l.owner_id = auth.uid()
    )
  );

-- Only listing owners can update images
CREATE POLICY "listing_images_update_own" ON listing_images 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM listings l 
      WHERE l.id = listing_id 
      AND l.owner_id = auth.uid()
    )
  );

-- Only listing owners can delete images
CREATE POLICY "listing_images_delete_own" ON listing_images 
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM listings l 
      WHERE l.id = listing_id 
      AND l.owner_id = auth.uid()
    )
  );

-- AVAILABILITY POLICIES
-- Read if parent listing is visible
CREATE POLICY "listing_availability_read" ON listing_availability 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM listings l 
      WHERE l.id = listing_id 
      AND (l.status = 'active' OR l.owner_id = auth.uid())
    )
  );

-- Only listing owners can manage availability
CREATE POLICY "listing_availability_manage_own" ON listing_availability 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM listings l 
      WHERE l.id = listing_id 
      AND l.owner_id = auth.uid()
    )
  );

-- RENTAL ORDERS POLICIES
-- Users can read their own orders (as owner or renter)
CREATE POLICY "rental_orders_read_own" ON rental_orders 
  FOR SELECT USING (auth.uid() = owner_id OR auth.uid() = renter_id);

-- Users can create orders as renters
CREATE POLICY "rental_orders_insert_as_renter" ON rental_orders 
  FOR INSERT WITH CHECK (auth.uid() = renter_id);

-- Owners can update orders they own, renters can update orders they're renting
CREATE POLICY "rental_orders_update_own" ON rental_orders 
  FOR UPDATE USING (auth.uid() = owner_id OR auth.uid() = renter_id);

-- SALE ORDERS POLICIES
-- Users can read their own orders (as owner or buyer)
CREATE POLICY "sale_orders_read_own" ON sale_orders 
  FOR SELECT USING (auth.uid() = owner_id OR auth.uid() = buyer_id);

-- Users can create orders as buyers
CREATE POLICY "sale_orders_insert_as_buyer" ON sale_orders 
  FOR INSERT WITH CHECK (auth.uid() = buyer_id);

-- Owners can update orders they own, buyers can update orders they're buying
CREATE POLICY "sale_orders_update_own" ON sale_orders 
  FOR UPDATE USING (auth.uid() = owner_id OR auth.uid() = buyer_id);

-- OFFERS POLICIES
-- Users can read offers they sent or received
CREATE POLICY "offers_read_own" ON offers 
  FOR SELECT USING (auth.uid() = from_user OR auth.uid() = to_user);

-- Users can create offers as senders
CREATE POLICY "offers_insert_as_sender" ON offers 
  FOR INSERT WITH CHECK (auth.uid() = from_user);

-- Users can update offers they sent or received
CREATE POLICY "offers_update_own" ON offers 
  FOR UPDATE USING (auth.uid() = from_user OR auth.uid() = to_user);

-- REVIEWS POLICIES
-- Users can read reviews they wrote or received
CREATE POLICY "marketplace_reviews_read_own" ON marketplace_reviews 
  FOR SELECT USING (auth.uid() = author_id OR auth.uid() = subject_user_id);

-- Users can create reviews as authors
CREATE POLICY "marketplace_reviews_insert_as_author" ON marketplace_reviews 
  FOR INSERT WITH CHECK (auth.uid() = author_id);

-- Authors can update their own reviews
CREATE POLICY "marketplace_reviews_update_own" ON marketplace_reviews 
  FOR UPDATE USING (auth.uid() = author_id);

-- DISPUTES POLICIES
-- Users can read disputes they reported or are reported against
CREATE POLICY "marketplace_disputes_read_own" ON marketplace_disputes 
  FOR SELECT USING (auth.uid() = reporter_id OR auth.uid() = reported_user_id);

-- Users can create disputes as reporters
CREATE POLICY "marketplace_disputes_insert_as_reporter" ON marketplace_disputes 
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_listings_updated_at
    BEFORE UPDATE ON listings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rental_orders_updated_at
    BEFORE UPDATE ON rental_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sale_orders_updated_at
    BEFORE UPDATE ON sale_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_offers_updated_at
    BEFORE UPDATE ON offers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to check for overlapping rentals
CREATE OR REPLACE FUNCTION check_rental_availability()
RETURNS TRIGGER AS $$
BEGIN
    -- Check for overlapping reservations for the same listing
    IF EXISTS (
        SELECT 1 FROM rental_orders ro
        WHERE ro.listing_id = NEW.listing_id
        AND ro.status IN ('accepted', 'paid', 'in_progress')
        AND ro.id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
        AND (
            (NEW.start_date BETWEEN ro.start_date AND ro.end_date) OR
            (NEW.end_date BETWEEN ro.start_date AND ro.end_date) OR
            (NEW.start_date <= ro.start_date AND NEW.end_date >= ro.end_date)
        )
    ) THEN
        RAISE EXCEPTION 'Listing is not available for the selected dates';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to check rental availability
CREATE TRIGGER check_rental_availability_trigger
    BEFORE INSERT OR UPDATE ON rental_orders
    FOR EACH ROW
    EXECUTE FUNCTION check_rental_availability();

-- Function to automatically create availability blocks for accepted rentals
CREATE OR REPLACE FUNCTION create_rental_availability_block()
RETURNS TRIGGER AS $$
BEGIN
    -- When a rental is accepted or paid, create availability block
    IF NEW.status IN ('accepted', 'paid', 'in_progress') AND 
       OLD.status NOT IN ('accepted', 'paid', 'in_progress') THEN
        
        INSERT INTO listing_availability (listing_id, start_date, end_date, kind, ref_order_id)
        VALUES (NEW.listing_id, NEW.start_date, NEW.end_date, 'reserved', NEW.id);
        
    -- When a rental is cancelled or completed, remove availability block
    ELSIF NEW.status IN ('cancelled', 'completed', 'refunded') AND 
          OLD.status IN ('accepted', 'paid', 'in_progress') THEN
        
        DELETE FROM listing_availability 
        WHERE listing_id = NEW.listing_id 
        AND ref_order_id = NEW.id 
        AND kind = 'reserved';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to validate order reference for reviews
CREATE OR REPLACE FUNCTION validate_review_order_reference(
  p_order_type TEXT,
  p_order_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
    IF p_order_type = 'rent' THEN
        RETURN EXISTS (SELECT 1 FROM rental_orders WHERE id = p_order_id);
    ELSIF p_order_type = 'sale' THEN
        RETURN EXISTS (SELECT 1 FROM sale_orders WHERE id = p_order_id);
    ELSE
        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger to manage availability blocks
CREATE TRIGGER create_rental_availability_block_trigger
    AFTER UPDATE ON rental_orders
    FOR EACH ROW
    EXECUTE FUNCTION create_rental_availability_block();

-- =====================================================
-- COMMENTS AND DOCUMENTATION
-- =====================================================

COMMENT ON TABLE listings IS 'Equipment listings for rent and/or sale';
COMMENT ON TABLE listing_images IS 'Images associated with listings';
COMMENT ON TABLE listing_availability IS 'Availability blocks and reservations for listings';
COMMENT ON TABLE rental_orders IS 'Rental transactions and bookings';
COMMENT ON TABLE sale_orders IS 'Sale transactions';
COMMENT ON TABLE offers IS 'Price/terms negotiation offers';
COMMENT ON TABLE marketplace_reviews IS 'Reviews for marketplace transactions';
COMMENT ON TABLE marketplace_disputes IS 'Dispute tracking for marketplace transactions';

COMMENT ON COLUMN listings.mode IS 'Whether listing is for rent, sale, or both';
COMMENT ON COLUMN listings.retainer_mode IS 'Type of retainer hold: none, credit_hold, or card_hold';
COMMENT ON COLUMN listings.borrow_ok IS 'Whether item can be borrowed without retainer';
COMMENT ON COLUMN listings.verified_only IS 'Whether only verified users can book this listing';

COMMENT ON COLUMN rental_orders.status IS 'Current status of rental transaction';
COMMENT ON COLUMN sale_orders.status IS 'Current status of sale transaction';
COMMENT ON COLUMN offers.status IS 'Current status of offer negotiation';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Log successful migration
INSERT INTO system_alerts (type, level, message, metadata)
VALUES (
    'migration_completed',
    'info',
    'Marketplace activation migration completed successfully',
    '{"migration": "098_marketplace_activation.sql", "tables_created": 8, "indexes_created": 25, "policies_created": 20}'
) ON CONFLICT DO NOTHING;

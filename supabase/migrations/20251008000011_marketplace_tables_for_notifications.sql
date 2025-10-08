-- Create Essential Marketplace Tables for Notifications
-- Simplified version focused on enabling notification system
-- Run this to activate marketplace notifications

-- ============================================
-- 1. ADD MARKETPLACE COLUMNS TO PRESETS
-- ============================================

ALTER TABLE presets ADD COLUMN IF NOT EXISTS is_for_sale BOOLEAN DEFAULT false;
ALTER TABLE presets ADD COLUMN IF NOT EXISTS sale_price INTEGER DEFAULT 0;
ALTER TABLE presets ADD COLUMN IF NOT EXISTS marketplace_status VARCHAR(20) DEFAULT 'private'
  CHECK (marketplace_status IN ('private', 'pending_review', 'approved', 'rejected', 'sold_out'));
ALTER TABLE presets ADD COLUMN IF NOT EXISTS total_sales INTEGER DEFAULT 0;
ALTER TABLE presets ADD COLUMN IF NOT EXISTS revenue_earned INTEGER DEFAULT 0;


-- ============================================
-- 2. PRESET MARKETPLACE LISTINGS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS preset_marketplace_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  preset_id UUID NOT NULL REFERENCES presets(id) ON DELETE CASCADE,
  seller_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sale_price INTEGER NOT NULL CHECK (sale_price > 0),

  -- Listing details
  marketplace_title VARCHAR(150) NOT NULL,
  marketplace_description TEXT,
  tags TEXT[] DEFAULT '{}',

  -- Sales tracking
  total_sales INTEGER DEFAULT 0,
  revenue_earned INTEGER DEFAULT 0,

  -- Status and approval
  status VARCHAR(20) DEFAULT 'pending_review'
    CHECK (status IN ('pending_review', 'approved', 'rejected', 'paused', 'sold_out')),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,

  -- Visibility
  is_featured BOOLEAN DEFAULT false,
  featured_until TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(preset_id)
);


-- ============================================
-- 3. PRESET PURCHASES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS preset_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  preset_id UUID NOT NULL REFERENCES presets(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES preset_marketplace_listings(id) ON DELETE CASCADE,
  buyer_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Purchase details
  purchase_price INTEGER NOT NULL,
  platform_fee INTEGER DEFAULT 0,
  seller_payout INTEGER NOT NULL,

  -- Transaction tracking
  credit_transaction_id UUID,
  payment_status VARCHAR(20) DEFAULT 'completed'
    CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),

  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  refunded_at TIMESTAMPTZ,
  refund_reason TEXT,

  UNIQUE(preset_id, buyer_user_id)
);


-- ============================================
-- 4. PRESET REVIEWS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS preset_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  preset_id UUID NOT NULL REFERENCES presets(id) ON DELETE CASCADE,
  purchase_id UUID NOT NULL REFERENCES preset_purchases(id) ON DELETE CASCADE,
  reviewer_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Review content
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title VARCHAR(100),
  comment TEXT,

  -- Helpful votes
  helpful_votes INTEGER DEFAULT 0,

  -- Status
  is_verified_purchase BOOLEAN DEFAULT true,
  is_visible BOOLEAN DEFAULT true,
  moderated_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(purchase_id)
);


-- ============================================
-- 5. INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_marketplace_listings_seller ON preset_marketplace_listings(seller_user_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_status ON preset_marketplace_listings(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_featured ON preset_marketplace_listings(is_featured) WHERE is_featured = true;

CREATE INDEX IF NOT EXISTS idx_preset_purchases_buyer ON preset_purchases(buyer_user_id);
CREATE INDEX IF NOT EXISTS idx_preset_purchases_seller ON preset_purchases(seller_user_id);
CREATE INDEX IF NOT EXISTS idx_preset_purchases_preset ON preset_purchases(preset_id);
CREATE INDEX IF NOT EXISTS idx_preset_purchases_status ON preset_purchases(payment_status);

CREATE INDEX IF NOT EXISTS idx_preset_reviews_preset ON preset_reviews(preset_id);
CREATE INDEX IF NOT EXISTS idx_preset_reviews_reviewer ON preset_reviews(reviewer_user_id);
CREATE INDEX IF NOT EXISTS idx_preset_reviews_rating ON preset_reviews(rating);


-- ============================================
-- 6. ROW LEVEL SECURITY
-- ============================================

ALTER TABLE preset_marketplace_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE preset_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE preset_reviews ENABLE ROW LEVEL SECURITY;

-- Listings: Everyone can view approved listings
CREATE POLICY "Anyone can view approved listings" ON preset_marketplace_listings
  FOR SELECT USING (status = 'approved');

-- Listings: Sellers can view their own listings
CREATE POLICY "Sellers can view own listings" ON preset_marketplace_listings
  FOR SELECT USING (auth.uid() = seller_user_id);

-- Purchases: Buyers and sellers can view their purchases
CREATE POLICY "Users can view their purchases" ON preset_purchases
  FOR SELECT USING (
    auth.uid() = buyer_user_id OR
    auth.uid() = seller_user_id
  );

-- Reviews: Everyone can view visible reviews
CREATE POLICY "Anyone can view visible reviews" ON preset_reviews
  FOR SELECT USING (is_visible = true);

-- Reviews: Reviewers can view their own reviews
CREATE POLICY "Reviewers can view own reviews" ON preset_reviews
  FOR SELECT USING (auth.uid() = reviewer_user_id);


-- ============================================
-- 7. COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE preset_marketplace_listings IS
  'Tracks preset listings in the marketplace with approval workflow';

COMMENT ON TABLE preset_purchases IS
  'Records all preset purchases with credit transaction details';

COMMENT ON TABLE preset_reviews IS
  'User reviews for purchased presets with ratings';


-- ============================================
-- 8. AUTO-ACTIVATE NOTIFICATION TRIGGERS
-- ============================================

-- Now that tables exist, create the notification triggers
-- Preset Purchase Trigger
DROP TRIGGER IF EXISTS trigger_notify_preset_purchased ON preset_purchases;
CREATE TRIGGER trigger_notify_preset_purchased
  AFTER INSERT ON preset_purchases
  FOR EACH ROW
  EXECUTE FUNCTION notify_preset_purchased();

-- Listing Status Trigger
DROP TRIGGER IF EXISTS trigger_notify_listing_status ON preset_marketplace_listings;
CREATE TRIGGER trigger_notify_listing_status
  AFTER UPDATE OF status ON preset_marketplace_listings
  FOR EACH ROW
  EXECUTE FUNCTION notify_listing_status();

-- Preset Review Trigger
DROP TRIGGER IF EXISTS trigger_notify_preset_review ON preset_reviews;
CREATE TRIGGER trigger_notify_preset_review
  AFTER INSERT ON preset_reviews
  FOR EACH ROW
  EXECUTE FUNCTION notify_preset_review();


-- ============================================
-- VERIFICATION
-- ============================================

DO $$
DECLARE
  trigger_count INTEGER;
BEGIN
  -- Count marketplace notification triggers
  SELECT COUNT(*) INTO trigger_count
  FROM information_schema.triggers
  WHERE trigger_schema = 'public'
  AND event_object_table IN ('preset_purchases', 'preset_marketplace_listings', 'preset_reviews')
  AND trigger_name LIKE 'trigger_notify_%';

  RAISE NOTICE '✅ Marketplace tables created successfully';
  RAISE NOTICE '✅ % marketplace notification triggers activated', trigger_count;
END $$;

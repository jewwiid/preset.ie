-- Migration to create preset marketplace functionality
-- This adds the ability for users to sell presets using credits

-- First, add marketplace-specific columns to the presets table
ALTER TABLE presets ADD COLUMN IF NOT EXISTS is_for_sale BOOLEAN DEFAULT false;
ALTER TABLE presets ADD COLUMN IF NOT EXISTS sale_price INTEGER DEFAULT 0; -- Price in credits
ALTER TABLE presets ADD COLUMN IF NOT EXISTS seller_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE presets ADD COLUMN IF NOT EXISTS marketplace_status VARCHAR(20) DEFAULT 'private' CHECK (marketplace_status IN ('private', 'pending_review', 'approved', 'rejected', 'sold_out'));
ALTER TABLE presets ADD COLUMN IF NOT EXISTS total_sales INTEGER DEFAULT 0;
ALTER TABLE presets ADD COLUMN IF NOT EXISTS revenue_earned INTEGER DEFAULT 0; -- Total credits earned from sales

-- Create preset marketplace listings table for better tracking
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
  status VARCHAR(20) DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'approved', 'rejected', 'paused', 'sold_out')),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  -- Visibility and promotion
  is_featured BOOLEAN DEFAULT false,
  featured_until TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(preset_id) -- One listing per preset
);

-- Create preset purchases table to track who bought what
CREATE TABLE IF NOT EXISTS preset_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  preset_id UUID NOT NULL REFERENCES presets(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES preset_marketplace_listings(id) ON DELETE CASCADE,
  buyer_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Purchase details
  purchase_price INTEGER NOT NULL,
  platform_fee INTEGER DEFAULT 0, -- Optional platform fee
  seller_payout INTEGER NOT NULL, -- Amount seller receives
  
  -- Transaction tracking
  credit_transaction_id UUID, -- Link to credit_transactions table
  payment_status VARCHAR(20) DEFAULT 'completed' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  
  -- Metadata
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  refunded_at TIMESTAMPTZ,
  refund_reason TEXT,
  
  -- Prevent duplicate purchases by same user
  UNIQUE(preset_id, buyer_user_id)
);

-- Create preset reviews table for marketplace feedback
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
  
  UNIQUE(purchase_id) -- One review per purchase
);

-- Create marketplace analytics table for tracking performance
CREATE TABLE IF NOT EXISTS marketplace_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  
  -- Sales metrics
  total_sales INTEGER DEFAULT 0,
  total_revenue INTEGER DEFAULT 0, -- Total credits transacted
  total_platform_fees INTEGER DEFAULT 0,
  unique_buyers INTEGER DEFAULT 0,
  unique_sellers INTEGER DEFAULT 0,
  
  -- Listing metrics
  new_listings INTEGER DEFAULT 0,
  approved_listings INTEGER DEFAULT 0,
  rejected_listings INTEGER DEFAULT 0,
  
  -- Popular categories
  top_category VARCHAR(50),
  top_category_sales INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(date)
);

-- Create preset collections table for curated marketplace collections
CREATE TABLE IF NOT EXISTS preset_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  creator_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Collection settings
  is_public BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  
  -- Collection image/branding
  cover_image_url TEXT,
  color_theme JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create many-to-many relationship for presets in collections
CREATE TABLE IF NOT EXISTS preset_collection_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES preset_collections(id) ON DELETE CASCADE,
  preset_id UUID NOT NULL REFERENCES presets(id) ON DELETE CASCADE,
  position INTEGER DEFAULT 0,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(collection_id, preset_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_presets_marketplace_status ON presets(marketplace_status) WHERE is_for_sale = true;
CREATE INDEX IF NOT EXISTS idx_presets_sale_price ON presets(sale_price) WHERE is_for_sale = true;
CREATE INDEX IF NOT EXISTS idx_presets_seller ON presets(seller_user_id) WHERE is_for_sale = true;
CREATE INDEX IF NOT EXISTS idx_presets_total_sales ON presets(total_sales) WHERE is_for_sale = true;

CREATE INDEX IF NOT EXISTS idx_marketplace_listings_status ON preset_marketplace_listings(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_seller ON preset_marketplace_listings(seller_user_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_price ON preset_marketplace_listings(sale_price);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_sales ON preset_marketplace_listings(total_sales);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_featured ON preset_marketplace_listings(is_featured) WHERE is_featured = true;

CREATE INDEX IF NOT EXISTS idx_preset_purchases_buyer ON preset_purchases(buyer_user_id);
CREATE INDEX IF NOT EXISTS idx_preset_purchases_seller ON preset_purchases(seller_user_id);
CREATE INDEX IF NOT EXISTS idx_preset_purchases_date ON preset_purchases(purchased_at);
CREATE INDEX IF NOT EXISTS idx_preset_purchases_status ON preset_purchases(payment_status);

CREATE INDEX IF NOT EXISTS idx_preset_reviews_preset ON preset_reviews(preset_id);
CREATE INDEX IF NOT EXISTS idx_preset_reviews_rating ON preset_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_preset_reviews_verified ON preset_reviews(is_verified_purchase) WHERE is_verified_purchase = true;

CREATE INDEX IF NOT EXISTS idx_marketplace_analytics_date ON marketplace_analytics(date);
CREATE INDEX IF NOT EXISTS idx_preset_collections_featured ON preset_collections(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_preset_collection_items_collection ON preset_collection_items(collection_id, position);

-- Enable RLS on all new tables
ALTER TABLE preset_marketplace_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE preset_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE preset_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE preset_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE preset_collection_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for preset_marketplace_listings
CREATE POLICY "Anyone can view approved marketplace listings" ON preset_marketplace_listings
  FOR SELECT USING (status = 'approved');

CREATE POLICY "Sellers can manage their own listings" ON preset_marketplace_listings
  FOR ALL USING (auth.uid() = seller_user_id);

CREATE POLICY "Admins can manage all listings" ON preset_marketplace_listings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users_profile 
      WHERE user_id = auth.uid() 
      AND 'ADMIN' = ANY(role_flags)
    )
  );

-- RLS Policies for preset_purchases
CREATE POLICY "Users can view their own purchases" ON preset_purchases
  FOR SELECT USING (auth.uid() = buyer_user_id);

CREATE POLICY "Sellers can view their sales" ON preset_purchases
  FOR SELECT USING (auth.uid() = seller_user_id);

CREATE POLICY "Users can make purchases" ON preset_purchases
  FOR INSERT WITH CHECK (auth.uid() = buyer_user_id);

CREATE POLICY "Admins can view all purchases" ON preset_purchases
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users_profile 
      WHERE user_id = auth.uid() 
      AND 'ADMIN' = ANY(role_flags)
    )
  );

-- RLS Policies for preset_reviews
CREATE POLICY "Anyone can view visible reviews" ON preset_reviews
  FOR SELECT USING (is_visible = true);

CREATE POLICY "Users can create reviews for their purchases" ON preset_reviews
  FOR INSERT WITH CHECK (
    auth.uid() = reviewer_user_id 
    AND EXISTS (
      SELECT 1 FROM preset_purchases 
      WHERE id = preset_reviews.purchase_id 
      AND buyer_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own reviews" ON preset_reviews
  FOR UPDATE USING (auth.uid() = reviewer_user_id);

CREATE POLICY "Admins can moderate reviews" ON preset_reviews
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users_profile 
      WHERE user_id = auth.uid() 
      AND 'ADMIN' = ANY(role_flags)
    )
  );

-- RLS Policies for marketplace_analytics (admin only)
CREATE POLICY "Admins can view analytics" ON marketplace_analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users_profile 
      WHERE user_id = auth.uid() 
      AND 'ADMIN' = ANY(role_flags)
    )
  );

-- RLS Policies for preset_collections
CREATE POLICY "Anyone can view public collections" ON preset_collections
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can manage their own collections" ON preset_collections
  FOR ALL USING (auth.uid() = creator_user_id);

CREATE POLICY "Admins can manage all collections" ON preset_collections
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users_profile 
      WHERE user_id = auth.uid() 
      AND 'ADMIN' = ANY(role_flags)
    )
  );

-- RLS Policies for preset_collection_items
CREATE POLICY "Anyone can view items in public collections" ON preset_collection_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM preset_collections 
      WHERE id = preset_collection_items.collection_id 
      AND is_public = true
    )
  );

CREATE POLICY "Collection creators can manage items" ON preset_collection_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM preset_collections 
      WHERE id = preset_collection_items.collection_id 
      AND creator_user_id = auth.uid()
    )
  );

-- Update presets table RLS to handle marketplace functionality
CREATE POLICY "Anyone can view marketplace presets" ON presets
  FOR SELECT USING (
    is_public = true 
    OR (is_for_sale = true AND marketplace_status = 'approved')
    OR auth.uid() = user_id
    OR auth.uid() = seller_user_id
  );

-- Add comments for documentation
COMMENT ON TABLE preset_marketplace_listings IS 'Marketplace listings for presets that are for sale';
COMMENT ON TABLE preset_purchases IS 'Track preset purchases and credit transfers';
COMMENT ON TABLE preset_reviews IS 'User reviews and ratings for marketplace presets';
COMMENT ON TABLE marketplace_analytics IS 'Daily analytics for marketplace performance';
COMMENT ON TABLE preset_collections IS 'Curated collections of presets';
COMMENT ON TABLE preset_collection_items IS 'Many-to-many relationship for presets in collections';

-- Insert some sample collections
INSERT INTO preset_collections (name, description, is_public, is_featured, sort_order) VALUES
('Featured Headshots', 'Professional headshot presets perfect for LinkedIn and business portraits', true, true, 1),
('Product Photography', 'Clean, professional product photography presets for e-commerce', true, true, 2),
('Artistic Styles', 'Creative and artistic presets for unique visual expression', true, false, 3),
('Cinematic Looks', 'Dramatic cinematic presets for movie-quality visuals', true, false, 4)
ON CONFLICT DO NOTHING;

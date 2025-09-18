-- =====================================================
-- Marketplace Listing Enhancements System
-- =====================================================
-- Migration: 095_marketplace_enhancements.sql
-- Description: Complete marketplace listing enhancement system with subscription benefits
-- Dependencies: Existing listings, users_profile, subscriptions tables

-- =====================================================
-- MARKETPLACE ENHANCEMENTS TABLES
-- =====================================================

-- Listing enhancements table
CREATE TABLE IF NOT EXISTS listing_enhancements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
  enhancement_type VARCHAR(20) NOT NULL CHECK (enhancement_type IN ('basic_bump', 'priority_bump', 'premium_bump')),
  payment_intent_id VARCHAR(255), -- Stripe payment intent ID
  amount_cents INTEGER NOT NULL DEFAULT 0,
  duration_days INTEGER NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_duration CHECK (duration_days > 0),
  CONSTRAINT valid_amount CHECK (amount_cents >= 0),
  CONSTRAINT valid_date_range CHECK (expires_at > starts_at)
);

-- Subscription benefits tracking
CREATE TABLE IF NOT EXISTS subscription_benefits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
  subscription_tier VARCHAR(20) NOT NULL,
  benefit_type VARCHAR(50) NOT NULL, -- 'monthly_bump', 'unlimited_bumps', etc.
  benefit_value JSONB NOT NULL DEFAULT '{}', -- Flexible benefit data
  used_this_month INTEGER DEFAULT 0,
  monthly_limit INTEGER DEFAULT 0,
  last_reset_at TIMESTAMPTZ DEFAULT DATE_TRUNC('month', NOW()),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_user_benefit UNIQUE(user_id, benefit_type),
  CONSTRAINT valid_usage CHECK (used_this_month >= 0),
  CONSTRAINT valid_limit CHECK (monthly_limit >= 0)
);

-- =====================================================
-- ENHANCE EXISTING TABLES
-- =====================================================

-- Add enhancement fields to listings table
ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS current_enhancement_type VARCHAR(20),
ADD COLUMN IF NOT EXISTS enhancement_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS boost_level INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS premium_badge BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS verified_badge BOOLEAN DEFAULT FALSE;

-- Add constraints for enhancement fields
ALTER TABLE listings 
ADD CONSTRAINT IF NOT EXISTS valid_enhancement_type 
CHECK (current_enhancement_type IS NULL OR current_enhancement_type IN ('basic_bump', 'priority_bump', 'premium_bump'));

ALTER TABLE listings 
ADD CONSTRAINT IF NOT EXISTS valid_boost_level 
CHECK (boost_level >= 0 AND boost_level <= 3);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Listing enhancements indexes
CREATE INDEX IF NOT EXISTS idx_listing_enhancements_listing_id ON listing_enhancements(listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_enhancements_user_id ON listing_enhancements(user_id);
CREATE INDEX IF NOT EXISTS idx_listing_enhancements_expires_at ON listing_enhancements(expires_at);
CREATE INDEX IF NOT EXISTS idx_listing_enhancements_status ON listing_enhancements(status);
CREATE INDEX IF NOT EXISTS idx_listing_enhancements_type ON listing_enhancements(enhancement_type);
CREATE INDEX IF NOT EXISTS idx_listing_enhancements_active ON listing_enhancements(listing_id, status, expires_at) 
WHERE status = 'active';

-- Subscription benefits indexes
CREATE INDEX IF NOT EXISTS idx_subscription_benefits_user_id ON subscription_benefits(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_benefits_tier ON subscription_benefits(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_subscription_benefits_type ON subscription_benefits(benefit_type);
CREATE INDEX IF NOT EXISTS idx_subscription_benefits_reset ON subscription_benefits(last_reset_at);

-- Enhanced listings indexes
CREATE INDEX IF NOT EXISTS idx_listings_enhancement_expires ON listings(enhancement_expires_at) 
WHERE enhancement_expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_listings_boost_level ON listings(boost_level);
CREATE INDEX IF NOT EXISTS idx_listings_premium_badge ON listings(premium_badge) 
WHERE premium_badge = true;
CREATE INDEX IF NOT EXISTS idx_listings_verified_badge ON listings(verified_badge) 
WHERE verified_badge = true;

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on new tables
ALTER TABLE listing_enhancements ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_benefits ENABLE ROW LEVEL SECURITY;

-- Listing enhancements policies
CREATE POLICY "Users can view their own enhancements" ON listing_enhancements 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create enhancements for their listings" ON listing_enhancements 
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND 
    EXISTS (
      SELECT 1 FROM listings l 
      WHERE l.id = listing_id AND l.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own enhancements" ON listing_enhancements 
  FOR UPDATE USING (auth.uid() = user_id);

-- Subscription benefits policies
CREATE POLICY "Users can view their own benefits" ON subscription_benefits 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own benefits" ON subscription_benefits 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own benefits" ON subscription_benefits 
  FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update listing enhancement status
CREATE OR REPLACE FUNCTION update_listing_enhancement_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Update listing when enhancement is created
    IF TG_OP = 'INSERT' THEN
        UPDATE listings 
        SET 
            current_enhancement_type = NEW.enhancement_type,
            enhancement_expires_at = NEW.expires_at,
            premium_badge = (NEW.enhancement_type = 'premium_bump'),
            boost_level = CASE 
                WHEN NEW.enhancement_type = 'premium_bump' THEN 3
                WHEN NEW.enhancement_type = 'priority_bump' THEN 2
                WHEN NEW.enhancement_type = 'basic_bump' THEN 1
                ELSE 0
            END,
            updated_at = NOW()
        WHERE id = NEW.listing_id;
        
        RETURN NEW;
    END IF;
    
    -- Update listing when enhancement expires
    IF TG_OP = 'UPDATE' AND OLD.status = 'active' AND NEW.status = 'expired' THEN
        UPDATE listings 
        SET 
            current_enhancement_type = NULL,
            enhancement_expires_at = NULL,
            premium_badge = FALSE,
            boost_level = 0,
            updated_at = NOW()
        WHERE id = NEW.listing_id;
        
        RETURN NEW;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update listing enhancement status
CREATE TRIGGER update_listing_enhancement_status_trigger
    AFTER INSERT OR UPDATE ON listing_enhancements
    FOR EACH ROW
    EXECUTE FUNCTION update_listing_enhancement_status();

-- Function to expire enhancements automatically
CREATE OR REPLACE FUNCTION expire_listing_enhancements()
RETURNS INTEGER AS $$
DECLARE
    expired_count INTEGER;
BEGIN
    -- Mark expired enhancements
    UPDATE listing_enhancements 
    SET status = 'expired', updated_at = NOW()
    WHERE status = 'active' 
    AND expires_at < NOW();
    
    GET DIAGNOSTICS expired_count = ROW_COUNT;
    
    -- Update listings to remove expired enhancements
    UPDATE listings 
    SET 
        current_enhancement_type = NULL,
        enhancement_expires_at = NULL,
        premium_badge = FALSE,
        boost_level = 0,
        updated_at = NOW()
    WHERE id IN (
        SELECT listing_id 
        FROM listing_enhancements 
        WHERE status = 'expired' 
        AND expires_at < NOW()
    );
    
    RETURN expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset monthly subscription benefits
CREATE OR REPLACE FUNCTION reset_monthly_subscription_benefits()
RETURNS INTEGER AS $$
DECLARE
    reset_count INTEGER;
BEGIN
    -- Reset monthly usage for all benefits
    UPDATE subscription_benefits 
    SET 
        used_this_month = 0,
        last_reset_at = DATE_TRUNC('month', NOW()),
        updated_at = NOW()
    WHERE DATE_TRUNC('month', last_reset_at) < DATE_TRUNC('month', NOW());
    
    GET DIAGNOSTICS reset_count = ROW_COUNT;
    
    RETURN reset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's subscription benefits
CREATE OR REPLACE FUNCTION get_user_subscription_benefits(p_user_id UUID)
RETURNS TABLE(
    benefit_type VARCHAR(50),
    monthly_limit INTEGER,
    used_this_month INTEGER,
    remaining INTEGER,
    benefit_value JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sb.benefit_type,
        sb.monthly_limit,
        sb.used_this_month,
        GREATEST(0, sb.monthly_limit - sb.used_this_month) as remaining,
        sb.benefit_value
    FROM subscription_benefits sb
    WHERE sb.user_id = p_user_id
    ORDER BY sb.benefit_type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can use monthly bump
CREATE OR REPLACE FUNCTION can_use_monthly_bump(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_tier VARCHAR(20);
    benefit_record RECORD;
BEGIN
    -- Get user's subscription tier
    SELECT subscription_tier INTO user_tier
    FROM users_profile
    WHERE id = p_user_id;
    
    -- Check if user has monthly bump benefit
    SELECT * INTO benefit_record
    FROM subscription_benefits
    WHERE user_id = p_user_id 
    AND benefit_type = 'monthly_bump';
    
    -- If no benefit record exists, create one based on tier
    IF NOT FOUND THEN
        INSERT INTO subscription_benefits (user_id, subscription_tier, benefit_type, benefit_value, monthly_limit)
        VALUES (
            p_user_id,
            user_tier,
            'monthly_bump',
            jsonb_build_object('type', 'monthly_bump'),
            CASE user_tier
                WHEN 'FREE' THEN 0
                WHEN 'PLUS' THEN 1
                WHEN 'PRO' THEN 3
                ELSE 0
            END
        );
        
        -- Return eligibility based on tier
        RETURN CASE user_tier
            WHEN 'FREE' THEN FALSE
            WHEN 'PLUS' THEN TRUE
            WHEN 'PRO' THEN TRUE
            ELSE FALSE
        END;
    END IF;
    
    -- Reset monthly usage if new month
    IF DATE_TRUNC('month', benefit_record.last_reset_at) < DATE_TRUNC('month', NOW()) THEN
        UPDATE subscription_benefits 
        SET 
            used_this_month = 0,
            last_reset_at = DATE_TRUNC('month', NOW())
        WHERE id = benefit_record.id;
        
        RETURN benefit_record.monthly_limit > 0;
    END IF;
    
    -- Check if user has remaining bumps
    RETURN benefit_record.used_this_month < benefit_record.monthly_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON listing_enhancements TO authenticated;
GRANT SELECT, INSERT, UPDATE ON subscription_benefits TO authenticated;
GRANT EXECUTE ON FUNCTION expire_listing_enhancements() TO authenticated;
GRANT EXECUTE ON FUNCTION reset_monthly_subscription_benefits() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_subscription_benefits(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION can_use_monthly_bump(UUID) TO authenticated;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE listing_enhancements IS 'Tracks marketplace listing enhancements (bumps) with payment and expiration data';
COMMENT ON TABLE subscription_benefits IS 'Tracks subscription-based benefits and monthly usage limits';

COMMENT ON COLUMN listing_enhancements.enhancement_type IS 'Type of enhancement: basic_bump, priority_bump, or premium_bump';
COMMENT ON COLUMN listing_enhancements.payment_intent_id IS 'Stripe payment intent ID for paid enhancements';
COMMENT ON COLUMN listing_enhancements.amount_cents IS 'Amount paid in cents (0 for subscription benefits)';
COMMENT ON COLUMN listing_enhancements.duration_days IS 'How many days the enhancement lasts';

COMMENT ON COLUMN subscription_benefits.benefit_type IS 'Type of benefit: monthly_bump, unlimited_bumps, etc.';
COMMENT ON COLUMN subscription_benefits.benefit_value IS 'Flexible JSON data for benefit-specific information';
COMMENT ON COLUMN subscription_benefits.monthly_limit IS 'Maximum uses per month for this benefit';
COMMENT ON COLUMN subscription_benefits.used_this_month IS 'Number of times used this month';

COMMENT ON COLUMN listings.current_enhancement_type IS 'Currently active enhancement type';
COMMENT ON COLUMN listings.enhancement_expires_at IS 'When the current enhancement expires';
COMMENT ON COLUMN listings.boost_level IS 'Boost level: 0=none, 1=basic, 2=priority, 3=premium';
COMMENT ON COLUMN listings.premium_badge IS 'Whether listing has premium badge';
COMMENT ON COLUMN listings.verified_badge IS 'Whether listing owner is verified';

COMMENT ON FUNCTION expire_listing_enhancements() IS 'Expires all listing enhancements that have passed their expiration date';
COMMENT ON FUNCTION reset_monthly_subscription_benefits() IS 'Resets monthly usage counters for subscription benefits';
COMMENT ON FUNCTION get_user_subscription_benefits(UUID) IS 'Returns all subscription benefits for a user';
COMMENT ON FUNCTION can_use_monthly_bump(UUID) IS 'Checks if user can use their monthly bump benefit';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Marketplace Enhancements System Complete!';
    RAISE NOTICE '📊 Created: listing_enhancements table';
    RAISE NOTICE '📊 Created: subscription_benefits table';
    RAISE NOTICE '📊 Enhanced: listings table with enhancement fields';
    RAISE NOTICE '⚙️  Created: enhancement management functions';
    RAISE NOTICE '🔔 Added: automatic enhancement expiration';
    RAISE NOTICE '🎯 Ready for: Marketplace listing enhancements with subscription benefits';
END $$;

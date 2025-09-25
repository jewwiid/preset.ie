-- Boost/Enhancement System for Marketplace Listings
-- This migration creates the tables and functions needed for the boost functionality

-- Create listing_enhancements table
CREATE TABLE IF NOT EXISTS listing_enhancements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enhancement_type TEXT NOT NULL CHECK (enhancement_type IN ('basic_bump', 'priority_bump', 'premium_bump')),
  payment_intent_id TEXT,
  amount_cents INTEGER NOT NULL,
  duration_days INTEGER NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_listing_enhancements_listing_id ON listing_enhancements(listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_enhancements_user_id ON listing_enhancements(user_id);
CREATE INDEX IF NOT EXISTS idx_listing_enhancements_expires_at ON listing_enhancements(expires_at);
CREATE INDEX IF NOT EXISTS idx_listing_enhancements_status ON listing_enhancements(status);

-- Add enhancement fields to listings table if they don't exist
DO $$ 
BEGIN
  -- Add current_enhancement_type column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'current_enhancement_type') THEN
    ALTER TABLE listings ADD COLUMN current_enhancement_type TEXT CHECK (current_enhancement_type IN ('basic_bump', 'priority_bump', 'premium_bump'));
  END IF;
  
  -- Add enhancement_expires_at column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'enhancement_expires_at') THEN
    ALTER TABLE listings ADD COLUMN enhancement_expires_at TIMESTAMPTZ;
  END IF;
  
  -- Add premium_badge column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'premium_badge') THEN
    ALTER TABLE listings ADD COLUMN premium_badge BOOLEAN DEFAULT FALSE;
  END IF;
  
  -- Add boost_level column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'boost_level') THEN
    ALTER TABLE listings ADD COLUMN boost_level INTEGER DEFAULT 0;
  END IF;
END $$;

-- Create indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_listings_current_enhancement_type ON listings(current_enhancement_type);
CREATE INDEX IF NOT EXISTS idx_listings_enhancement_expires_at ON listings(enhancement_expires_at);
CREATE INDEX IF NOT EXISTS idx_listings_boost_level ON listings(boost_level);

-- Function to get boost level from enhancement type
DROP FUNCTION IF EXISTS get_boost_level(TEXT);

CREATE OR REPLACE FUNCTION get_boost_level(enhancement_type TEXT)
RETURNS INTEGER AS $$
BEGIN
  CASE enhancement_type
    WHEN 'premium_bump' THEN RETURN 3;
    WHEN 'priority_bump' THEN RETURN 2;
    WHEN 'basic_bump' THEN RETURN 1;
    ELSE RETURN 0;
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Function to apply enhancement to a listing
DROP FUNCTION IF EXISTS apply_listing_enhancement(UUID, UUID, TEXT, TEXT, INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION apply_listing_enhancement(
  p_listing_id UUID,
  p_user_id UUID,
  p_enhancement_type TEXT,
  p_payment_intent_id TEXT DEFAULT NULL,
  p_amount_cents INTEGER DEFAULT 0,
  p_duration_days INTEGER DEFAULT 1
) RETURNS TABLE(success BOOLEAN, message TEXT, enhancement_id UUID) AS $$
DECLARE
  v_enhancement_id UUID;
  v_expires_at TIMESTAMPTZ;
  v_boost_level INTEGER;
BEGIN
  -- Validate enhancement type
  IF p_enhancement_type NOT IN ('basic_bump', 'priority_bump', 'premium_bump') THEN
    RETURN QUERY SELECT false, 'Invalid enhancement type', NULL::UUID;
    RETURN;
  END IF;
  
  -- Calculate expiration time
  v_expires_at := NOW() + (p_duration_days || ' days')::INTERVAL;
  
  -- Get boost level
  v_boost_level := get_boost_level(p_enhancement_type);
  
  -- Create enhancement record
  INSERT INTO listing_enhancements (
    listing_id,
    user_id,
    enhancement_type,
    payment_intent_id,
    amount_cents,
    duration_days,
    expires_at
  ) VALUES (
    p_listing_id,
    p_user_id,
    p_enhancement_type,
    p_payment_intent_id,
    p_amount_cents,
    p_duration_days,
    v_expires_at
  ) RETURNING id INTO v_enhancement_id;
  
  -- Update listing with enhancement
  UPDATE listings SET
    current_enhancement_type = p_enhancement_type,
    enhancement_expires_at = v_expires_at,
    premium_badge = (p_enhancement_type = 'premium_bump'),
    boost_level = v_boost_level,
    updated_at = NOW()
  WHERE id = p_listing_id;
  
  RETURN QUERY SELECT true, 'Enhancement applied successfully', v_enhancement_id;
END;
$$ LANGUAGE plpgsql;

-- Function to expire enhancements
DROP FUNCTION IF EXISTS expire_listing_enhancements();

CREATE OR REPLACE FUNCTION expire_listing_enhancements()
RETURNS INTEGER AS $$
DECLARE
  v_expired_count INTEGER := 0;
BEGIN
  -- Update expired enhancements
  UPDATE listing_enhancements 
  SET status = 'expired', updated_at = NOW()
  WHERE expires_at < NOW() AND status = 'active';
  
  GET DIAGNOSTICS v_expired_count = ROW_COUNT;
  
  -- Update listings to remove expired enhancements
  UPDATE listings SET
    current_enhancement_type = NULL,
    enhancement_expires_at = NULL,
    premium_badge = FALSE,
    boost_level = 0,
    updated_at = NOW()
  WHERE enhancement_expires_at < NOW() AND current_enhancement_type IS NOT NULL;
  
  RETURN v_expired_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's subscription benefits
-- Drop existing function if it exists to avoid type conflicts
DROP FUNCTION IF EXISTS get_user_subscription_benefits(UUID);

CREATE OR REPLACE FUNCTION get_user_subscription_benefits(p_user_id UUID)
RETURNS TABLE(
  subscription_tier TEXT,
  monthly_bumps INTEGER,
  bump_type TEXT,
  bumps_used_this_month INTEGER,
  bumps_remaining INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(up.subscription_tier, 'FREE')::TEXT as subscription_tier,
    CASE 
      WHEN up.subscription_tier = 'PLUS' THEN 1
      WHEN up.subscription_tier = 'PRO' THEN 3
      ELSE 0
    END::INTEGER as monthly_bumps,
    CASE 
      WHEN up.subscription_tier = 'PLUS' THEN 'priority_bump'
      WHEN up.subscription_tier = 'PRO' THEN 'premium_bump'
      ELSE 'basic_bump'
    END::TEXT as bump_type,
    COALESCE(
      (SELECT COUNT(*)::INTEGER 
       FROM listing_enhancements le
       WHERE le.user_id = p_user_id 
       AND le.created_at >= date_trunc('month', NOW())
       AND le.status = 'active'), 
      0
    ) as bumps_used_this_month,
    CASE 
      WHEN up.subscription_tier = 'PLUS' THEN 
        GREATEST(0, 1 - COALESCE(
          (SELECT COUNT(*)::INTEGER 
           FROM listing_enhancements le
           WHERE le.user_id = p_user_id 
           AND le.created_at >= date_trunc('month', NOW())
           AND le.status = 'active'), 
          0
        ))
      WHEN up.subscription_tier = 'PRO' THEN 
        GREATEST(0, 3 - COALESCE(
          (SELECT COUNT(*)::INTEGER 
           FROM listing_enhancements le
           WHERE le.user_id = p_user_id 
           AND le.created_at >= date_trunc('month', NOW())
           AND le.status = 'active'), 
          0
        ))
      ELSE 0
    END::INTEGER as bumps_remaining
  FROM users_profile up
  WHERE up.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user can use monthly bump
DROP FUNCTION IF EXISTS can_use_monthly_bump(UUID);

CREATE OR REPLACE FUNCTION can_use_monthly_bump(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_benefits RECORD;
BEGIN
  SELECT * INTO v_benefits FROM get_user_subscription_benefits(p_user_id);
  
  RETURN v_benefits.bumps_remaining > 0;
END;
$$ LANGUAGE plpgsql;

-- Function to use monthly bump (for subscription benefits)
DROP FUNCTION IF EXISTS use_monthly_bump(UUID, UUID, TEXT);

CREATE OR REPLACE FUNCTION use_monthly_bump(
  p_user_id UUID,
  p_listing_id UUID,
  p_enhancement_type TEXT DEFAULT NULL
) RETURNS TABLE(success BOOLEAN, message TEXT) AS $$
DECLARE
  v_benefits RECORD;
  v_enhancement_type TEXT;
BEGIN
  -- Get user benefits
  SELECT * INTO v_benefits FROM get_user_subscription_benefits(p_user_id);
  
  -- Check if user can use bump
  IF v_benefits.bumps_remaining <= 0 THEN
    RETURN QUERY SELECT false, 'No monthly bumps remaining';
    RETURN;
  END IF;
  
  -- Use the subscription bump type if not specified
  v_enhancement_type := COALESCE(p_enhancement_type, v_benefits.bump_type);
  
  -- Apply the enhancement
  PERFORM apply_listing_enhancement(
    p_listing_id,
    p_user_id,
    v_enhancement_type,
    NULL, -- No payment intent for subscription benefits
    0,    -- No cost for subscription benefits
    CASE v_enhancement_type
      WHEN 'basic_bump' THEN 1
      WHEN 'priority_bump' THEN 3
      WHEN 'premium_bump' THEN 7
      ELSE 1
    END
  );
  
  RETURN QUERY SELECT true, 'Monthly bump applied successfully';
END;
$$ LANGUAGE plpgsql;

-- Create RLS policies for listing_enhancements
ALTER TABLE listing_enhancements ENABLE ROW LEVEL SECURITY;

-- Users can view their own enhancements
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'listing_enhancements' AND policyname = 'Users can view their own enhancements') THEN
    CREATE POLICY "Users can view their own enhancements" ON listing_enhancements
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

-- Users can view enhancements for their listings
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'listing_enhancements' AND policyname = 'Users can view enhancements for their listings') THEN
    CREATE POLICY "Users can view enhancements for their listings" ON listing_enhancements
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM listings 
          WHERE id = listing_id AND owner_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Users can create enhancements for their own listings
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'listing_enhancements' AND policyname = 'Users can create enhancements for their own listings') THEN
    CREATE POLICY "Users can create enhancements for their own listings" ON listing_enhancements
      FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
          SELECT 1 FROM listings 
          WHERE id = listing_id AND owner_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Update trigger for listing_enhancements
CREATE OR REPLACE FUNCTION update_listing_enhancements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_listing_enhancements_updated_at') THEN
    CREATE TRIGGER trigger_update_listing_enhancements_updated_at
      BEFORE UPDATE ON listing_enhancements
      FOR EACH ROW
      EXECUTE FUNCTION update_listing_enhancements_updated_at();
  END IF;
END $$;

-- Create a cron job to expire enhancements (this would be set up in Supabase Dashboard)
-- SELECT cron.schedule('expire-enhancements', '0 * * * *', 'SELECT expire_listing_enhancements();');

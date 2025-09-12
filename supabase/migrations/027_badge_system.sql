-- Badge System for Preset App
-- This creates a comprehensive badge system for user verification, achievements, and recognition

-- Badge Types enum
CREATE TYPE badge_type AS ENUM (
  'verification',    -- Age verified, ID verified, email verified, etc.
  'achievement',     -- Completed shoots, milestone badges, etc.
  'subscription',    -- Plus member, Pro member, etc.
  'special',         -- Early adopter, beta tester, featured creator, etc.
  'moderation'       -- Trusted member, community moderator, etc.
);

-- Badge Categories for organization
CREATE TYPE badge_category AS ENUM (
  'identity',        -- Age verified, ID verified
  'platform',       -- Plus, Pro, Early adopter
  'community',       -- Featured creator, trusted member
  'achievement',     -- Milestone badges, completed shoots
  'special'          -- Custom/one-off badges
);

-- Main badges table - defines all available badges
CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE, -- URL-friendly version
  description TEXT,
  type badge_type NOT NULL,
  category badge_category NOT NULL,
  
  -- Visual properties
  icon VARCHAR(50), -- Icon name (e.g., 'shield', 'star', 'check-circle')
  color VARCHAR(20), -- Primary color (e.g., 'green', 'blue', 'gold')
  background_color VARCHAR(20), -- Background color
  
  -- Badge properties
  is_active BOOLEAN DEFAULT TRUE,
  is_automatic BOOLEAN DEFAULT FALSE, -- Automatically awarded by system
  requires_approval BOOLEAN DEFAULT FALSE, -- Requires admin approval
  
  -- Rarity/value
  rarity VARCHAR(20) DEFAULT 'common', -- common, rare, epic, legendary
  points INTEGER DEFAULT 0, -- Point value for gamification
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users_profile(user_id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Junction table for user badges (many-to-many)
CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  
  -- Award details
  awarded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  awarded_by UUID REFERENCES users_profile(user_id), -- Admin who awarded it, NULL for automatic
  awarded_reason TEXT, -- Optional reason/note
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE, -- Show prominently on profile
  
  -- Verification specific fields
  verified_data JSONB, -- Store verification details (e.g., age, document info)
  expires_at TIMESTAMP WITH TIME ZONE, -- For temporary badges
  
  -- Constraints
  UNIQUE(user_id, badge_id) -- User can only have each badge once
);

-- Enable RLS
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- RLS Policies for badges table
CREATE POLICY "Anyone can view active badges" ON badges
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage badges" ON badges
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM users_profile 
    WHERE user_id = auth.uid() 
    AND 'ADMIN' = ANY(role_flags)
  ));

-- RLS Policies for user_badges table
CREATE POLICY "Users can view all user badges" ON user_badges
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Users can view own user badges" ON user_badges
  FOR SELECT
  USING (auth.uid() IN (
    SELECT user_id FROM users_profile WHERE id = user_badges.user_id
  ));

CREATE POLICY "Admins can manage user badges" ON user_badges
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM users_profile 
    WHERE user_id = auth.uid() 
    AND 'ADMIN' = ANY(role_flags)
  ));

-- Indexes for performance
CREATE INDEX idx_badges_type ON badges(type);
CREATE INDEX idx_badges_category ON badges(category);
CREATE INDEX idx_badges_active ON badges(is_active);
CREATE INDEX idx_badges_slug ON badges(slug);

CREATE INDEX idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX idx_user_badges_badge_id ON user_badges(badge_id);
CREATE INDEX idx_user_badges_active ON user_badges(is_active);
CREATE INDEX idx_user_badges_featured ON user_badges(is_featured);
CREATE INDEX idx_user_badges_awarded_at ON user_badges(awarded_at DESC);

-- Function to award a badge to a user
CREATE OR REPLACE FUNCTION award_badge(
  p_user_id UUID,
  p_badge_slug VARCHAR,
  p_awarded_by UUID DEFAULT NULL,
  p_reason TEXT DEFAULT NULL,
  p_verified_data JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_badge_id UUID;
  v_user_badge_id UUID;
BEGIN
  -- Get badge ID from slug
  SELECT id INTO v_badge_id
  FROM badges
  WHERE slug = p_badge_slug AND is_active = true;
  
  IF v_badge_id IS NULL THEN
    RAISE EXCEPTION 'Badge with slug % not found or inactive', p_badge_slug;
  END IF;
  
  -- Award the badge (INSERT ... ON CONFLICT to handle duplicates)
  INSERT INTO user_badges (user_id, badge_id, awarded_by, awarded_reason, verified_data)
  VALUES (p_user_id, v_badge_id, p_awarded_by, p_reason, p_verified_data)
  ON CONFLICT (user_id, badge_id) 
  DO UPDATE SET 
    is_active = true,
    awarded_at = NOW(),
    awarded_by = p_awarded_by,
    awarded_reason = p_reason,
    verified_data = COALESCE(p_verified_data, user_badges.verified_data)
  RETURNING id INTO v_user_badge_id;
  
  RETURN v_user_badge_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to remove a badge from a user
CREATE OR REPLACE FUNCTION remove_badge(
  p_user_id UUID,
  p_badge_slug VARCHAR
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE user_badges
  SET is_active = false
  WHERE user_id = p_user_id
  AND badge_id = (SELECT id FROM badges WHERE slug = p_badge_slug)
  AND is_active = true;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user badges with badge details
CREATE OR REPLACE FUNCTION get_user_badges(p_user_id UUID)
RETURNS TABLE (
  badge_name VARCHAR,
  badge_slug VARCHAR,
  badge_description TEXT,
  badge_type badge_type,
  badge_category badge_category,
  icon VARCHAR,
  color VARCHAR,
  background_color VARCHAR,
  rarity VARCHAR,
  awarded_at TIMESTAMP WITH TIME ZONE,
  is_featured BOOLEAN,
  verified_data JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.name,
    b.slug,
    b.description,
    b.type,
    b.category,
    b.icon,
    b.color,
    b.background_color,
    b.rarity,
    ub.awarded_at,
    ub.is_featured,
    ub.verified_data
  FROM user_badges ub
  JOIN badges b ON ub.badge_id = b.id
  WHERE ub.user_id = p_user_id
  AND ub.is_active = true
  AND b.is_active = true
  ORDER BY ub.is_featured DESC, ub.awarded_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Updated trigger for updated_at
CREATE TRIGGER update_badges_updated_at
  BEFORE UPDATE ON badges
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Grant permissions
GRANT EXECUTE ON FUNCTION award_badge TO authenticated;
GRANT EXECUTE ON FUNCTION remove_badge TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_badges TO authenticated;

-- Insert predefined badges
INSERT INTO badges (name, slug, description, type, category, icon, color, background_color, rarity, is_automatic) VALUES
-- Verification badges
('Age Verified', 'age-verified', 'Verified to be 18 years or older', 'verification', 'identity', 'shield-check', 'green', 'green', 'common', true),
('ID Verified', 'id-verified', 'Government ID verified', 'verification', 'identity', 'badge-check', 'blue', 'blue', 'rare', false),
('Email Verified', 'email-verified', 'Email address verified', 'verification', 'identity', 'mail-check', 'emerald', 'emerald', 'common', true),
('Phone Verified', 'phone-verified', 'Phone number verified', 'verification', 'identity', 'phone', 'teal', 'teal', 'common', false),

-- Subscription badges
('Plus Member', 'plus-member', 'Active Plus subscription', 'subscription', 'platform', 'crown', 'purple', 'purple', 'rare', true),
('Pro Member', 'pro-member', 'Active Pro subscription', 'subscription', 'platform', 'gem', 'gold', 'yellow', 'epic', true),

-- Achievement badges
('First Gig', 'first-gig', 'Completed your first gig', 'achievement', 'achievement', 'camera', 'orange', 'orange', 'common', true),
('10 Gigs Complete', '10-gigs', 'Completed 10 gigs', 'achievement', 'achievement', 'target', 'blue', 'blue', 'rare', true),
('50 Gigs Complete', '50-gigs', 'Completed 50 gigs', 'achievement', 'achievement', 'trophy', 'gold', 'yellow', 'epic', true),
('100 Gigs Complete', '100-gigs', 'Completed 100 gigs', 'achievement', 'achievement', 'award', 'gold', 'yellow', 'legendary', true),

-- Special badges
('Early Adopter', 'early-adopter', 'Joined during beta period', 'special', 'special', 'star', 'indigo', 'indigo', 'rare', false),
('Beta Tester', 'beta-tester', 'Helped test new features', 'special', 'special', 'flask', 'pink', 'pink', 'rare', false),
('Featured Creator', 'featured-creator', 'Showcased work was featured', 'special', 'community', 'spotlight', 'yellow', 'yellow', 'epic', false),

-- Community badges
('Trusted Member', 'trusted-member', 'Long-standing community member in good standing', 'moderation', 'community', 'heart', 'red', 'red', 'rare', false),
('Community Helper', 'community-helper', 'Actively helps other community members', 'moderation', 'community', 'users', 'green', 'green', 'rare', false);

-- Award initial badges to existing users based on current data
DO $$
DECLARE
  user_record RECORD;
  admin_user_id UUID;
BEGIN
  -- Get an admin user_id for badge awarding
  SELECT up.user_id INTO admin_user_id
  FROM users_profile up
  WHERE 'ADMIN' = ANY(up.role_flags)
  LIMIT 1;
  
  -- Award age verification badges to verified users
  FOR user_record IN 
    SELECT id, user_id, age_verified, subscription_tier
    FROM users_profile
    WHERE age_verified = true
  LOOP
    PERFORM award_badge(
      user_record.id,
      'age-verified',
      admin_user_id,
      'Automatically awarded based on existing verification'
    );
  END LOOP;
  
  -- Award subscription badges
  FOR user_record IN 
    SELECT id, user_id, subscription_tier
    FROM users_profile
    WHERE subscription_tier IN ('plus', 'PRO')
  LOOP
    IF user_record.subscription_tier = 'plus' THEN
      PERFORM award_badge(user_record.id, 'plus-member', admin_user_id, 'Active Plus subscription');
    ELSIF user_record.subscription_tier = 'PRO' THEN
      PERFORM award_badge(user_record.id, 'pro-member', admin_user_id, 'Active Pro subscription');
    END IF;
  END LOOP;
  
END $$;

-- Show results
SELECT 
  up.display_name,
  up.handle,
  b.name as badge_name,
  b.type as badge_type,
  ub.awarded_at
FROM user_badges ub
JOIN users_profile up ON ub.user_id = up.id
JOIN badges b ON ub.badge_id = b.id
WHERE ub.is_active = true
ORDER BY up.display_name, ub.awarded_at DESC;
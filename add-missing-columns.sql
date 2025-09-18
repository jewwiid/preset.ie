-- Add Missing Columns Migration
-- This adds only the missing columns to existing tables without recreating them

-- Add missing columns to users_profile table
ALTER TABLE users_profile 
ADD COLUMN IF NOT EXISTS style_tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS vibe_tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR(20) DEFAULT 'FREE',
ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(20) DEFAULT 'ACTIVE',
ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS verified_id BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS account_status VARCHAR(50) DEFAULT 'active',
ADD COLUMN IF NOT EXISTS age_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS first_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS last_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS header_banner_url TEXT,
ADD COLUMN IF NOT EXISTS header_banner_position TEXT DEFAULT '{"y":0,"scale":1}';

-- Add missing columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'TALENT',
ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR(20) DEFAULT 'FREE',
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS verification_status VARCHAR(20) DEFAULT 'UNVERIFIED',
ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS id_verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add missing columns to gigs table
ALTER TABLE gigs 
ADD COLUMN IF NOT EXISTS purpose VARCHAR(50) DEFAULT 'PORTFOLIO',
ADD COLUMN IF NOT EXISTS comp_type VARCHAR(20),
ADD COLUMN IF NOT EXISTS comp_details TEXT,
ADD COLUMN IF NOT EXISTS city VARCHAR(255),
ADD COLUMN IF NOT EXISTS country VARCHAR(100),
ADD COLUMN IF NOT EXISTS location GEOGRAPHY(POINT),
ADD COLUMN IF NOT EXISTS radius_meters INTEGER,
ADD COLUMN IF NOT EXISTS start_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS end_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS application_deadline TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS max_applicants INTEGER DEFAULT 20,
ADD COLUMN IF NOT EXISTS usage_rights TEXT,
ADD COLUMN IF NOT EXISTS safety_notes TEXT,
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'DRAFT',
ADD COLUMN IF NOT EXISTS boost_level INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS style_tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS vibe_tags TEXT[] DEFAULT '{}';

-- Create missing indexes
CREATE INDEX IF NOT EXISTS idx_users_profile_style_tags ON users_profile USING GIN(style_tags);
CREATE INDEX IF NOT EXISTS idx_users_profile_vibe_tags ON users_profile USING GIN(vibe_tags);
CREATE INDEX IF NOT EXISTS idx_users_profile_subscription_tier ON users_profile(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_users_profile_first_name ON users_profile(first_name);
CREATE INDEX IF NOT EXISTS idx_users_profile_last_name ON users_profile(last_name);

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_subscription_tier ON users(subscription_tier);

CREATE INDEX IF NOT EXISTS idx_gigs_purpose ON gigs(purpose);
CREATE INDEX IF NOT EXISTS idx_gigs_style_tags ON gigs USING GIN(style_tags);
CREATE INDEX IF NOT EXISTS idx_gigs_vibe_tags ON gigs USING GIN(vibe_tags);
CREATE INDEX IF NOT EXISTS idx_gigs_city ON gigs(city);
CREATE INDEX IF NOT EXISTS idx_gigs_country ON gigs(country);

-- Verify the columns were added
SELECT 'users_profile columns:' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users_profile' 
AND table_schema = 'public'
ORDER BY column_name;

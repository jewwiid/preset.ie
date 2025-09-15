-- Add missing fields to users_profile table for signup flow compatibility
-- This migration adds all the fields that the web app signup flow expects

-- Add basic profile fields
ALTER TABLE users_profile 
ADD COLUMN IF NOT EXISTS country VARCHAR(255),
ADD COLUMN IF NOT EXISTS age_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS account_status VARCHAR(50) DEFAULT 'pending_verification';

-- Add social media fields
ALTER TABLE users_profile 
ADD COLUMN IF NOT EXISTS instagram_handle VARCHAR(255),
ADD COLUMN IF NOT EXISTS tiktok_handle VARCHAR(255),
ADD COLUMN IF NOT EXISTS website_url TEXT,
ADD COLUMN IF NOT EXISTS portfolio_url TEXT,
ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);

-- Add contributor-specific fields
ALTER TABLE users_profile 
ADD COLUMN IF NOT EXISTS years_experience INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS specializations TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS equipment_list TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS editing_software TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS languages TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS hourly_rate_min DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS hourly_rate_max DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS available_for_travel BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS travel_radius_km INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS studio_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS has_studio BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS studio_address TEXT,
ADD COLUMN IF NOT EXISTS typical_turnaround_days INTEGER;

-- Add talent-specific fields
ALTER TABLE users_profile 
ADD COLUMN IF NOT EXISTS height_cm INTEGER,
ADD COLUMN IF NOT EXISTS measurements TEXT,
ADD COLUMN IF NOT EXISTS eye_color VARCHAR(50),
ADD COLUMN IF NOT EXISTS hair_color VARCHAR(50),
ADD COLUMN IF NOT EXISTS shoe_size VARCHAR(10),
ADD COLUMN IF NOT EXISTS clothing_sizes TEXT,
ADD COLUMN IF NOT EXISTS tattoos BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS piercings BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS talent_categories TEXT[] DEFAULT '{}';

-- Add check constraints for data validation (only if they don't exist)
DO $$
BEGIN
    -- Add constraints only if they don't exist
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_years_experience_positive') THEN
        ALTER TABLE users_profile ADD CONSTRAINT check_years_experience_positive CHECK (years_experience >= 0);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_hourly_rate_valid') THEN
        ALTER TABLE users_profile ADD CONSTRAINT check_hourly_rate_valid CHECK (hourly_rate_min IS NULL OR hourly_rate_max IS NULL OR hourly_rate_min <= hourly_rate_max);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_travel_radius_positive') THEN
        ALTER TABLE users_profile ADD CONSTRAINT check_travel_radius_positive CHECK (travel_radius_km >= 0);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_turnaround_days_positive') THEN
        ALTER TABLE users_profile ADD CONSTRAINT check_turnaround_days_positive CHECK (typical_turnaround_days IS NULL OR typical_turnaround_days > 0);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_height_positive') THEN
        ALTER TABLE users_profile ADD CONSTRAINT check_height_positive CHECK (height_cm IS NULL OR height_cm > 0);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_account_status_valid') THEN
        ALTER TABLE users_profile ADD CONSTRAINT check_account_status_valid CHECK (account_status IN ('pending_verification', 'active', 'suspended', 'banned'));
    END IF;
END $$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_profile_country ON users_profile(country);
CREATE INDEX IF NOT EXISTS idx_users_profile_account_status ON users_profile(account_status);
CREATE INDEX IF NOT EXISTS idx_users_profile_age_verified ON users_profile(age_verified);
CREATE INDEX IF NOT EXISTS idx_users_profile_travel_radius ON users_profile(travel_radius_km);
CREATE INDEX IF NOT EXISTS idx_users_profile_hourly_rate ON users_profile(hourly_rate_min, hourly_rate_max);

-- Add comments for documentation
COMMENT ON COLUMN users_profile.country IS 'User country for location-based matching';
COMMENT ON COLUMN users_profile.age_verified IS 'Whether user age has been verified by admin';
COMMENT ON COLUMN users_profile.account_status IS 'Current status of the user account';
COMMENT ON COLUMN users_profile.instagram_handle IS 'Instagram username for social verification';
COMMENT ON COLUMN users_profile.tiktok_handle IS 'TikTok username for social verification';
COMMENT ON COLUMN users_profile.website_url IS 'Personal or business website URL';
COMMENT ON COLUMN users_profile.portfolio_url IS 'Portfolio website URL';
COMMENT ON COLUMN users_profile.phone_number IS 'Contact phone number';
COMMENT ON COLUMN users_profile.years_experience IS 'Years of experience in creative field';
COMMENT ON COLUMN users_profile.specializations IS 'Array of specializations/skills';
COMMENT ON COLUMN users_profile.equipment_list IS 'Array of equipment owned';
COMMENT ON COLUMN users_profile.editing_software IS 'Array of editing software proficiency';
COMMENT ON COLUMN users_profile.languages IS 'Array of languages spoken';
COMMENT ON COLUMN users_profile.hourly_rate_min IS 'Minimum hourly rate for services';
COMMENT ON COLUMN users_profile.hourly_rate_max IS 'Maximum hourly rate for services';
COMMENT ON COLUMN users_profile.available_for_travel IS 'Whether available for travel shoots';
COMMENT ON COLUMN users_profile.travel_radius_km IS 'Maximum travel radius in kilometers';
COMMENT ON COLUMN users_profile.studio_name IS 'Name of studio if applicable';
COMMENT ON COLUMN users_profile.has_studio IS 'Whether user has access to a studio';
COMMENT ON COLUMN users_profile.studio_address IS 'Address of studio if applicable';
COMMENT ON COLUMN users_profile.typical_turnaround_days IS 'Typical turnaround time for deliverables';
COMMENT ON COLUMN users_profile.height_cm IS 'Height in centimeters (for talent)';
COMMENT ON COLUMN users_profile.measurements IS 'Body measurements (for talent)';
COMMENT ON COLUMN users_profile.eye_color IS 'Eye color (for talent)';
COMMENT ON COLUMN users_profile.hair_color IS 'Hair color (for talent)';
COMMENT ON COLUMN users_profile.shoe_size IS 'Shoe size (for talent)';
COMMENT ON COLUMN users_profile.clothing_sizes IS 'Clothing sizes (for talent)';
COMMENT ON COLUMN users_profile.tattoos IS 'Whether user has visible tattoos';
COMMENT ON COLUMN users_profile.piercings IS 'Whether user has visible piercings';
COMMENT ON COLUMN users_profile.talent_categories IS 'Array of talent categories (model, actor, etc.)';

-- Enhanced Profile Fields for Contributors and Talent
-- Adds social media, portfolio links, and role-specific fields

-- Add social media and portfolio fields to users_profile
ALTER TABLE users_profile
ADD COLUMN IF NOT EXISTS instagram_handle VARCHAR(50),
ADD COLUMN IF NOT EXISTS tiktok_handle VARCHAR(50),
ADD COLUMN IF NOT EXISTS website_url TEXT,
ADD COLUMN IF NOT EXISTS portfolio_url TEXT,
ADD COLUMN IF NOT EXISTS country VARCHAR(100),
ADD COLUMN IF NOT EXISTS years_experience INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS specializations TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS equipment_list TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS languages TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS hourly_rate_min DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS hourly_rate_max DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS available_for_travel BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS travel_radius_km INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS profile_completion_percentage INTEGER DEFAULT 0;

-- Add contributor-specific fields
ALTER TABLE users_profile
ADD COLUMN IF NOT EXISTS studio_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS has_studio BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS studio_address TEXT,
ADD COLUMN IF NOT EXISTS editing_software TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS typical_turnaround_days INTEGER;

-- Add talent-specific fields  
ALTER TABLE users_profile
ADD COLUMN IF NOT EXISTS height_cm INTEGER,
ADD COLUMN IF NOT EXISTS measurements JSONB,
ADD COLUMN IF NOT EXISTS eye_color VARCHAR(30),
ADD COLUMN IF NOT EXISTS hair_color VARCHAR(30),
ADD COLUMN IF NOT EXISTS shoe_size VARCHAR(10),
ADD COLUMN IF NOT EXISTS clothing_sizes JSONB,
ADD COLUMN IF NOT EXISTS tattoos BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS piercings BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS talent_categories TEXT[] DEFAULT '{}'; -- model, actor, dancer, etc

-- Create social links validation function
CREATE OR REPLACE FUNCTION validate_social_handle(handle TEXT, platform TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    IF handle IS NULL OR handle = '' THEN
        RETURN true; -- Allow empty
    END IF;
    
    -- Remove @ if present
    handle := LTRIM(handle, '@');
    
    -- Basic validation for social media handles
    CASE platform
        WHEN 'instagram' THEN
            RETURN handle ~ '^[a-zA-Z0-9_.]{1,30}$';
        WHEN 'tiktok' THEN
            RETURN handle ~ '^[a-zA-Z0-9_.]{1,24}$';
        ELSE
            RETURN true;
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Add constraints for social media handles
ALTER TABLE users_profile
ADD CONSTRAINT valid_instagram_handle 
    CHECK (validate_social_handle(instagram_handle, 'instagram')),
ADD CONSTRAINT valid_tiktok_handle 
    CHECK (validate_social_handle(tiktok_handle, 'tiktok'));

-- Create function to calculate profile completion
CREATE OR REPLACE FUNCTION calculate_profile_completion(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    profile RECORD;
    completion INTEGER := 0;
    field_count INTEGER := 0;
    filled_count INTEGER := 0;
BEGIN
    SELECT * INTO profile FROM users_profile WHERE users_profile.user_id = $1;
    
    IF NOT FOUND THEN
        RETURN 0;
    END IF;
    
    -- Basic fields (required for all)
    field_count := field_count + 6;
    IF profile.display_name IS NOT NULL AND profile.display_name != '' THEN filled_count := filled_count + 1; END IF;
    IF profile.handle IS NOT NULL AND profile.handle != '' THEN filled_count := filled_count + 1; END IF;
    IF profile.bio IS NOT NULL AND profile.bio != '' THEN filled_count := filled_count + 1; END IF;
    IF profile.city IS NOT NULL AND profile.city != '' THEN filled_count := filled_count + 1; END IF;
    IF profile.country IS NOT NULL AND profile.country != '' THEN filled_count := filled_count + 1; END IF;
    IF profile.avatar_url IS NOT NULL AND profile.avatar_url != '' THEN filled_count := filled_count + 1; END IF;
    
    -- Social media (optional but counted)
    field_count := field_count + 3;
    IF profile.instagram_handle IS NOT NULL AND profile.instagram_handle != '' THEN filled_count := filled_count + 1; END IF;
    IF profile.website_url IS NOT NULL AND profile.website_url != '' THEN filled_count := filled_count + 1; END IF;
    IF profile.phone_number IS NOT NULL AND profile.phone_number != '' THEN filled_count := filled_count + 1; END IF;
    
    -- Style tags
    field_count := field_count + 1;
    IF array_length(profile.style_tags, 1) > 0 THEN filled_count := filled_count + 1; END IF;
    
    -- Role-specific fields
    IF 'CONTRIBUTOR' = ANY(profile.role_flags) THEN
        field_count := field_count + 3;
        IF array_length(profile.equipment_list, 1) > 0 THEN filled_count := filled_count + 1; END IF;
        IF array_length(profile.editing_software, 1) > 0 THEN filled_count := filled_count + 1; END IF;
        IF profile.typical_turnaround_days IS NOT NULL THEN filled_count := filled_count + 1; END IF;
    END IF;
    
    IF 'TALENT' = ANY(profile.role_flags) THEN
        field_count := field_count + 4;
        IF profile.height_cm IS NOT NULL THEN filled_count := filled_count + 1; END IF;
        IF profile.eye_color IS NOT NULL THEN filled_count := filled_count + 1; END IF;
        IF profile.hair_color IS NOT NULL THEN filled_count := filled_count + 1; END IF;
        IF array_length(profile.talent_categories, 1) > 0 THEN filled_count := filled_count + 1; END IF;
    END IF;
    
    -- Calculate percentage
    IF field_count > 0 THEN
        completion := (filled_count * 100) / field_count;
    END IF;
    
    RETURN completion;
END;
$$ LANGUAGE plpgsql;

-- Update profile completion on changes
CREATE OR REPLACE FUNCTION update_profile_completion()
RETURNS TRIGGER AS $$
BEGIN
    NEW.profile_completion_percentage := calculate_profile_completion(NEW.user_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profile_completion_trigger
    BEFORE INSERT OR UPDATE ON users_profile
    FOR EACH ROW
    EXECUTE FUNCTION update_profile_completion();

-- Create indexes for new fields
CREATE INDEX IF NOT EXISTS idx_users_profile_instagram ON users_profile(instagram_handle) WHERE instagram_handle IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_profile_country ON users_profile(country);
CREATE INDEX IF NOT EXISTS idx_users_profile_specializations ON users_profile USING GIN (specializations);
CREATE INDEX IF NOT EXISTS idx_users_profile_talent_categories ON users_profile USING GIN (talent_categories);
CREATE INDEX IF NOT EXISTS idx_users_profile_completion ON users_profile(profile_completion_percentage);

-- Grant permissions
GRANT SELECT, UPDATE ON users_profile TO authenticated;
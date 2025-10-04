-- Add demographics fields to users_profile table
-- These fields support the Demographics section in user profiles

-- Add demographic identity fields
ALTER TABLE users_profile
ADD COLUMN IF NOT EXISTS gender_identity VARCHAR(50),
ADD COLUMN IF NOT EXISTS ethnicity VARCHAR(50),
ADD COLUMN IF NOT EXISTS nationality VARCHAR(100);

-- Add physical attribute fields (some may already exist from previous migrations)
ALTER TABLE users_profile
ADD COLUMN IF NOT EXISTS weight_kg INTEGER,
ADD COLUMN IF NOT EXISTS body_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS hair_length VARCHAR(50),
ADD COLUMN IF NOT EXISTS skin_tone VARCHAR(50);

-- Add professional fields
ALTER TABLE users_profile
ADD COLUMN IF NOT EXISTS experience_level VARCHAR(50) DEFAULT 'beginner',
ADD COLUMN IF NOT EXISTS availability_status VARCHAR(50) DEFAULT 'available',
ADD COLUMN IF NOT EXISTS preferred_working_hours TEXT;

-- Add location fields (some may already exist)
ALTER TABLE users_profile
ADD COLUMN IF NOT EXISTS state_province VARCHAR(100),
ADD COLUMN IF NOT EXISTS timezone VARCHAR(100),
ADD COLUMN IF NOT EXISTS passport_valid BOOLEAN DEFAULT false;

-- Add privacy control fields
ALTER TABLE users_profile
ADD COLUMN IF NOT EXISTS show_age BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_location BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_physical_attributes BOOLEAN DEFAULT true;

-- Add constraints for data validation
DO $$
BEGIN
    -- Weight validation
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_weight_kg_valid') THEN
        ALTER TABLE users_profile ADD CONSTRAINT check_weight_kg_valid
        CHECK (weight_kg IS NULL OR weight_kg BETWEEN 30 AND 200);
    END IF;
END $$;

-- Create indexes for commonly queried fields
CREATE INDEX IF NOT EXISTS idx_users_profile_gender_identity ON users_profile(gender_identity);
CREATE INDEX IF NOT EXISTS idx_users_profile_ethnicity ON users_profile(ethnicity);
CREATE INDEX IF NOT EXISTS idx_users_profile_nationality ON users_profile(nationality);
CREATE INDEX IF NOT EXISTS idx_users_profile_body_type ON users_profile(body_type);
CREATE INDEX IF NOT EXISTS idx_users_profile_experience_level ON users_profile(experience_level);
CREATE INDEX IF NOT EXISTS idx_users_profile_availability_status ON users_profile(availability_status);
CREATE INDEX IF NOT EXISTS idx_users_profile_state_province ON users_profile(state_province);
CREATE INDEX IF NOT EXISTS idx_users_profile_timezone ON users_profile(timezone);

-- Add comments for documentation
COMMENT ON COLUMN users_profile.gender_identity IS 'User gender identity for demographic matching';
COMMENT ON COLUMN users_profile.ethnicity IS 'User ethnicity for demographic matching';
COMMENT ON COLUMN users_profile.nationality IS 'User nationality';
COMMENT ON COLUMN users_profile.weight_kg IS 'User weight in kilograms';
COMMENT ON COLUMN users_profile.body_type IS 'User body type classification';
COMMENT ON COLUMN users_profile.hair_length IS 'User hair length description';
COMMENT ON COLUMN users_profile.skin_tone IS 'User skin tone description';
COMMENT ON COLUMN users_profile.experience_level IS 'Professional experience level';
COMMENT ON COLUMN users_profile.availability_status IS 'Current availability for work';
COMMENT ON COLUMN users_profile.preferred_working_hours IS 'Preferred working hours or schedule';
COMMENT ON COLUMN users_profile.state_province IS 'State or province of residence';
COMMENT ON COLUMN users_profile.timezone IS 'User timezone';
COMMENT ON COLUMN users_profile.passport_valid IS 'Whether user has a valid passport for travel';
COMMENT ON COLUMN users_profile.show_age IS 'Privacy setting to show/hide age';
COMMENT ON COLUMN users_profile.show_location IS 'Privacy setting to show/hide location';
COMMENT ON COLUMN users_profile.show_physical_attributes IS 'Privacy setting to show/hide physical attributes';

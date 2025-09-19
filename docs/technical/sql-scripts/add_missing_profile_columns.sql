-- Add Missing Profile Columns
-- This script adds all the missing columns to the users_profile table
-- that are being used in the profile form but don't exist in the database

-- Add missing columns to users_profile table
ALTER TABLE users_profile 
ADD COLUMN IF NOT EXISTS country VARCHAR(255),
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS header_banner_url TEXT,
ADD COLUMN IF NOT EXISTS header_banner_position VARCHAR(50),
ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS instagram_handle VARCHAR(100),
ADD COLUMN IF NOT EXISTS tiktok_handle VARCHAR(100),
ADD COLUMN IF NOT EXISTS website_url TEXT,
ADD COLUMN IF NOT EXISTS portfolio_url TEXT,
ADD COLUMN IF NOT EXISTS years_experience INTEGER,
ADD COLUMN IF NOT EXISTS specializations TEXT[],
ADD COLUMN IF NOT EXISTS equipment_list TEXT[],
ADD COLUMN IF NOT EXISTS editing_software TEXT[],
ADD COLUMN IF NOT EXISTS languages TEXT[],
ADD COLUMN IF NOT EXISTS hourly_rate_min DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS hourly_rate_max DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS available_for_travel BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS travel_radius_km INTEGER,
ADD COLUMN IF NOT EXISTS travel_unit_preference VARCHAR(10) DEFAULT 'km',
ADD COLUMN IF NOT EXISTS studio_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS has_studio BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS studio_address TEXT,
ADD COLUMN IF NOT EXISTS show_location BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS typical_turnaround_days INTEGER,
ADD COLUMN IF NOT EXISTS turnaround_unit_preference VARCHAR(10) DEFAULT 'days',
ADD COLUMN IF NOT EXISTS height_cm INTEGER,
ADD COLUMN IF NOT EXISTS measurements VARCHAR(100),
ADD COLUMN IF NOT EXISTS eye_color VARCHAR(50),
ADD COLUMN IF NOT EXISTS hair_color VARCHAR(50),
ADD COLUMN IF NOT EXISTS shoe_size VARCHAR(20),
ADD COLUMN IF NOT EXISTS clothing_sizes TEXT[],
ADD COLUMN IF NOT EXISTS tattoos BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS piercings BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS talent_categories TEXT[],
ADD COLUMN IF NOT EXISTS vibe_tags TEXT[];

-- Clean up existing data before adding constraints
-- Update any invalid values to valid defaults
UPDATE users_profile 
SET travel_unit_preference = 'km' 
WHERE travel_unit_preference IS NOT NULL 
AND travel_unit_preference NOT IN ('km', 'miles');

UPDATE users_profile 
SET turnaround_unit_preference = 'days' 
WHERE turnaround_unit_preference IS NOT NULL 
AND turnaround_unit_preference NOT IN ('days', 'weeks', 'hours');

UPDATE users_profile 
SET header_banner_position = 'center' 
WHERE header_banner_position IS NOT NULL 
AND header_banner_position NOT IN ('top', 'center', 'bottom');

UPDATE users_profile 
SET years_experience = 0 
WHERE years_experience IS NOT NULL 
AND (years_experience < 0 OR years_experience > 50);

UPDATE users_profile 
SET height_cm = 170 
WHERE height_cm IS NOT NULL 
AND (height_cm < 100 OR height_cm > 250);

UPDATE users_profile 
SET travel_radius_km = 50 
WHERE travel_radius_km IS NOT NULL 
AND (travel_radius_km < 0 OR travel_radius_km > 10000);

UPDATE users_profile 
SET typical_turnaround_days = 7 
WHERE typical_turnaround_days IS NOT NULL 
AND (typical_turnaround_days < 1 OR typical_turnaround_days > 365);

UPDATE users_profile 
SET hourly_rate_min = 0 
WHERE hourly_rate_min IS NOT NULL 
AND hourly_rate_min < 0;

UPDATE users_profile 
SET hourly_rate_max = hourly_rate_min 
WHERE hourly_rate_max IS NOT NULL 
AND hourly_rate_min IS NOT NULL 
AND hourly_rate_max < hourly_rate_min;

-- Add constraints for specific columns (using DO blocks to handle IF NOT EXISTS)
DO $$
BEGIN
    -- Add travel unit constraint
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_travel_unit') THEN
        ALTER TABLE users_profile ADD CONSTRAINT check_travel_unit 
        CHECK (travel_unit_preference IN ('km', 'miles'));
    END IF;
    
    -- Add turnaround unit constraint
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_turnaround_unit') THEN
        ALTER TABLE users_profile ADD CONSTRAINT check_turnaround_unit 
        CHECK (turnaround_unit_preference IN ('days', 'weeks', 'hours'));
    END IF;
    
    -- Add header banner position constraint
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_header_banner_position') THEN
        ALTER TABLE users_profile ADD CONSTRAINT check_header_banner_position 
        CHECK (header_banner_position IN ('top', 'center', 'bottom'));
    END IF;
    
    -- Add years experience constraint
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_years_experience') THEN
        ALTER TABLE users_profile ADD CONSTRAINT check_years_experience 
        CHECK (years_experience >= 0 AND years_experience <= 50);
    END IF;
    
    -- Add height constraint
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_height_cm') THEN
        ALTER TABLE users_profile ADD CONSTRAINT check_height_cm 
        CHECK (height_cm >= 100 AND height_cm <= 250);
    END IF;
    
    -- Add travel radius constraint
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_travel_radius') THEN
        ALTER TABLE users_profile ADD CONSTRAINT check_travel_radius 
        CHECK (travel_radius_km >= 0 AND travel_radius_km <= 10000);
    END IF;
    
    -- Add turnaround days constraint
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_turnaround_days') THEN
        ALTER TABLE users_profile ADD CONSTRAINT check_turnaround_days 
        CHECK (typical_turnaround_days >= 1 AND typical_turnaround_days <= 365);
    END IF;
    
    -- Add hourly rates constraint
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_hourly_rates') THEN
        ALTER TABLE users_profile ADD CONSTRAINT check_hourly_rates 
        CHECK (hourly_rate_min >= 0 AND hourly_rate_max >= hourly_rate_min);
    END IF;
END $$;

-- Add indexes for commonly queried columns
CREATE INDEX IF NOT EXISTS idx_users_profile_country ON users_profile(country);
CREATE INDEX IF NOT EXISTS idx_users_profile_available_for_travel ON users_profile(available_for_travel);
CREATE INDEX IF NOT EXISTS idx_users_profile_has_studio ON users_profile(has_studio);
CREATE INDEX IF NOT EXISTS idx_users_profile_years_experience ON users_profile(years_experience);
CREATE INDEX IF NOT EXISTS idx_users_profile_hourly_rate_min ON users_profile(hourly_rate_min);

-- Add comments for documentation
COMMENT ON COLUMN users_profile.country IS 'User country';
COMMENT ON COLUMN users_profile.date_of_birth IS 'User date of birth';
COMMENT ON COLUMN users_profile.header_banner_url IS 'URL for profile header banner image';
COMMENT ON COLUMN users_profile.header_banner_position IS 'Position of header banner (top, center, bottom)';
COMMENT ON COLUMN users_profile.phone_number IS 'User phone number';
COMMENT ON COLUMN users_profile.instagram_handle IS 'Instagram username without @';
COMMENT ON COLUMN users_profile.tiktok_handle IS 'TikTok username without @';
COMMENT ON COLUMN users_profile.website_url IS 'Personal website URL';
COMMENT ON COLUMN users_profile.portfolio_url IS 'Portfolio website URL';
COMMENT ON COLUMN users_profile.years_experience IS 'Years of professional experience';
COMMENT ON COLUMN users_profile.specializations IS 'Array of specializations/skills';
COMMENT ON COLUMN users_profile.equipment_list IS 'Array of equipment owned';
COMMENT ON COLUMN users_profile.editing_software IS 'Array of editing software used';
COMMENT ON COLUMN users_profile.languages IS 'Array of languages spoken';
COMMENT ON COLUMN users_profile.hourly_rate_min IS 'Minimum hourly rate in local currency';
COMMENT ON COLUMN users_profile.hourly_rate_max IS 'Maximum hourly rate in local currency';
COMMENT ON COLUMN users_profile.available_for_travel IS 'Whether user is available for travel';
COMMENT ON COLUMN users_profile.travel_radius_km IS 'Travel radius in kilometers';
COMMENT ON COLUMN users_profile.travel_unit_preference IS 'Preferred unit for travel distance (km or miles)';
COMMENT ON COLUMN users_profile.studio_name IS 'Name of user studio';
COMMENT ON COLUMN users_profile.has_studio IS 'Whether user has a studio';
COMMENT ON COLUMN users_profile.studio_address IS 'Studio address';
COMMENT ON COLUMN users_profile.show_location IS 'Whether to show location publicly';
COMMENT ON COLUMN users_profile.typical_turnaround_days IS 'Typical turnaround time in days';
COMMENT ON COLUMN users_profile.turnaround_unit_preference IS 'Preferred unit for turnaround time';
COMMENT ON COLUMN users_profile.height_cm IS 'Height in centimeters';
COMMENT ON COLUMN users_profile.measurements IS 'Body measurements';
COMMENT ON COLUMN users_profile.eye_color IS 'Eye color';
COMMENT ON COLUMN users_profile.hair_color IS 'Hair color';
COMMENT ON COLUMN users_profile.shoe_size IS 'Shoe size';
COMMENT ON COLUMN users_profile.clothing_sizes IS 'Array of clothing sizes';
COMMENT ON COLUMN users_profile.tattoos IS 'Whether user has tattoos';
COMMENT ON COLUMN users_profile.piercings IS 'Whether user has piercings';
COMMENT ON COLUMN users_profile.talent_categories IS 'Array of talent categories';
COMMENT ON COLUMN users_profile.vibe_tags IS 'Array of vibe/style tags';

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Missing profile columns added successfully!';
    RAISE NOTICE 'Added 35+ missing columns to users_profile table including:';
    RAISE NOTICE '  - Contact info: country, phone_number, instagram_handle, tiktok_handle';
    RAISE NOTICE '  - Professional info: years_experience, specializations, equipment_list, editing_software';
    RAISE NOTICE '  - Rates: hourly_rate_min, hourly_rate_max';
    RAISE NOTICE '  - Travel: available_for_travel, travel_radius_km, travel_unit_preference';
    RAISE NOTICE '  - Studio: studio_name, has_studio, studio_address';
    RAISE NOTICE '  - Physical: height_cm, measurements, eye_color, hair_color, shoe_size';
    RAISE NOTICE '  - Preferences: clothing_sizes, tattoos, piercings, talent_categories, vibe_tags';
    RAISE NOTICE '  - Workflow: typical_turnaround_days, turnaround_unit_preference';
    RAISE NOTICE '  - Display: header_banner_url, header_banner_position, show_location';
    RAISE NOTICE 'Added constraints and indexes for data integrity and performance';
    RAISE NOTICE 'Profile form should now work without column errors!';
END $$;

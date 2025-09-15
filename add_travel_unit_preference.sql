-- Add travel unit preference field to users_profile table
-- This allows users to choose between kilometers and miles for travel radius

-- Add the travel_unit_preference field
ALTER TABLE users_profile 
ADD COLUMN IF NOT EXISTS travel_unit_preference VARCHAR(10) DEFAULT 'km' CHECK (travel_unit_preference IN ('km', 'miles'));

-- Add comment for documentation
COMMENT ON COLUMN users_profile.travel_unit_preference IS 'Preferred unit for travel radius display (km or miles)';

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_users_profile_travel_unit ON users_profile(travel_unit_preference);

-- Update existing records to use kilometers by default
UPDATE users_profile 
SET travel_unit_preference = 'km' 
WHERE travel_unit_preference IS NULL;

-- Add missing columns to users_profile table
ALTER TABLE users_profile
ADD COLUMN IF NOT EXISTS show_location BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS travel_unit_preference VARCHAR(10) DEFAULT 'km',
ADD COLUMN IF NOT EXISTS turnaround_unit_preference VARCHAR(10) DEFAULT 'days';

-- Create index for show_location
CREATE INDEX IF NOT EXISTS idx_users_profile_show_location ON users_profile(show_location);

-- Add comments
COMMENT ON COLUMN users_profile.show_location IS 'Whether to show user location on profile';
COMMENT ON COLUMN users_profile.travel_unit_preference IS 'User preference for travel distance unit (km or mi)';
COMMENT ON COLUMN users_profile.turnaround_unit_preference IS 'User preference for turnaround time unit (days or hours)';

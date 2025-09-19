-- Add location visibility field to users_profile table
-- This allows users to hide their location from public view

-- Add the show_location field
ALTER TABLE users_profile 
ADD COLUMN IF NOT EXISTS show_location BOOLEAN DEFAULT TRUE;

-- Add comment for documentation
COMMENT ON COLUMN users_profile.show_location IS 'Whether to show location (city, country) in public profile';

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_users_profile_show_location ON users_profile(show_location);

-- Update existing records to show location by default (since they already have it visible)
UPDATE users_profile 
SET show_location = TRUE 
WHERE show_location IS NULL;

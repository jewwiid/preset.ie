-- Add first_name and last_name fields to users_profile table
-- This allows us to retain individual name components while keeping display_name

ALTER TABLE users_profile 
ADD COLUMN first_name TEXT,
ADD COLUMN last_name TEXT;

-- Add comments for documentation
COMMENT ON COLUMN users_profile.first_name IS 'User first name (separate from display_name)';
COMMENT ON COLUMN users_profile.last_name IS 'User last name (separate from display_name)';

-- Create index for better query performance on name searches
CREATE INDEX idx_users_profile_first_name ON users_profile(first_name);
CREATE INDEX idx_users_profile_last_name ON users_profile(last_name);
CREATE INDEX idx_users_profile_full_name ON users_profile(first_name, last_name);

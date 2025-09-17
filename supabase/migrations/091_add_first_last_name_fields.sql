-- Add first_name and last_name fields to users_profile table
-- This allows users to have separate first and last name fields
-- while maintaining the display_name field for backward compatibility

ALTER TABLE users_profile 
ADD COLUMN first_name VARCHAR(100),
ADD COLUMN last_name VARCHAR(100);

-- Update existing admin profile with first and last name
UPDATE users_profile 
SET 
  first_name = 'Admin',
  last_name = 'User'
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'admin@preset.ie');

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_profile_first_name ON users_profile(first_name);
CREATE INDEX IF NOT EXISTS idx_users_profile_last_name ON users_profile(last_name);

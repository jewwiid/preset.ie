-- Fix Missing first_name and last_name Columns
-- Run this SQL directly in your Supabase Dashboard SQL Editor

-- Add first_name and last_name columns to users_profile table
ALTER TABLE users_profile 
ADD COLUMN IF NOT EXISTS first_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_profile_first_name ON users_profile(first_name);
CREATE INDEX IF NOT EXISTS idx_users_profile_last_name ON users_profile(last_name);

-- Update existing admin profile with first and last name (if it exists)
UPDATE users_profile 
SET 
  first_name = 'Admin',
  last_name = 'User'
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'admin@preset.ie');

-- Verify the columns were added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users_profile' 
AND column_name IN ('first_name', 'last_name')
ORDER BY column_name;

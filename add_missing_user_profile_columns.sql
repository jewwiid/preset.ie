-- Add missing columns to users_profile table for collaboration invitation system
-- These columns are referenced in the user search API but don't exist yet

-- Add primary_skill column
ALTER TABLE users_profile
ADD COLUMN IF NOT EXISTS primary_skill VARCHAR(100);

-- Add specializations column (array of skills)
ALTER TABLE users_profile
ADD COLUMN IF NOT EXISTS specializations TEXT[] DEFAULT '{}';

-- Add talent_categories column (array of categories)
ALTER TABLE users_profile
ADD COLUMN IF NOT EXISTS talent_categories TEXT[] DEFAULT '{}';

-- Add country column
ALTER TABLE users_profile
ADD COLUMN IF NOT EXISTS country VARCHAR(100);

-- Add years_experience column
ALTER TABLE users_profile
ADD COLUMN IF NOT EXISTS years_experience INTEGER;

-- Add available_for_travel column
ALTER TABLE users_profile
ADD COLUMN IF NOT EXISTS available_for_travel BOOLEAN DEFAULT false;

-- Add account_status column
ALTER TABLE users_profile
ADD COLUMN IF NOT EXISTS account_status VARCHAR(50) DEFAULT 'active' 
CHECK (account_status IN ('active', 'pending_verification', 'suspended', 'inactive'));

-- Add profile_completion_percentage column
ALTER TABLE users_profile
ADD COLUMN IF NOT EXISTS profile_completion_percentage INTEGER DEFAULT 0 
CHECK (profile_completion_percentage >= 0 AND profile_completion_percentage <= 100);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_profile_primary_skill ON users_profile(primary_skill);
CREATE INDEX IF NOT EXISTS idx_users_profile_account_status ON users_profile(account_status);
CREATE INDEX IF NOT EXISTS idx_users_profile_profile_completion ON users_profile(profile_completion_percentage);
CREATE INDEX IF NOT EXISTS idx_users_profile_available_for_travel ON users_profile(available_for_travel);

-- Add comments
COMMENT ON COLUMN users_profile.primary_skill IS 'Primary skill or profession (e.g., Photographer, Model, Makeup Artist)';
COMMENT ON COLUMN users_profile.specializations IS 'Array of specialized skills or areas of expertise';
COMMENT ON COLUMN users_profile.talent_categories IS 'Array of talent categories (e.g., Fashion, Portrait, Commercial)';
COMMENT ON COLUMN users_profile.country IS 'Country where the user is located';
COMMENT ON COLUMN users_profile.years_experience IS 'Number of years of professional experience';
COMMENT ON COLUMN users_profile.available_for_travel IS 'Whether the user is available for travel assignments';
COMMENT ON COLUMN users_profile.account_status IS 'Current status of the user account';
COMMENT ON COLUMN users_profile.profile_completion_percentage IS 'Percentage of profile completion (0-100)';

-- Update existing users to have 'active' status if not set
UPDATE users_profile 
SET account_status = 'active' 
WHERE account_status IS NULL;

-- Verify the columns were added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'users_profile'
AND column_name IN (
  'primary_skill', 'specializations', 'talent_categories', 'country', 
  'years_experience', 'available_for_travel', 'account_status', 'profile_completion_percentage'
)
ORDER BY column_name;

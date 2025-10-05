-- Add missing privacy/booking columns to users_profile table
-- These columns are referenced in the TypeScript types but missing from the database

-- Add allow_direct_booking column
ALTER TABLE users_profile 
ADD COLUMN IF NOT EXISTS allow_direct_booking BOOLEAN DEFAULT true;

-- Create index for filtering
CREATE INDEX IF NOT EXISTS idx_users_profile_allow_direct_booking ON users_profile(allow_direct_booking);

-- Add comment for documentation
COMMENT ON COLUMN users_profile.allow_direct_booking IS 'Privacy: Allow users to book this user directly for gigs/projects. When false, users cannot send direct booking requests.';

-- Update directory_profiles view to include this setting if it exists
-- (This will be handled by the existing view definition)

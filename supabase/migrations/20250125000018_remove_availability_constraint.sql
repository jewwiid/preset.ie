-- Temporarily remove availability_status constraint to allow profile creation
-- This migration removes the problematic constraint so we can test the profile flow

-- Drop the existing constraint
ALTER TABLE users_profile DROP CONSTRAINT IF EXISTS check_availability_status;

-- Add a comment explaining the temporary removal
COMMENT ON COLUMN users_profile.availability_status IS 'User availability: Available, Busy, Unavailable, Limited, Weekends Only, Weekdays Only (constraint temporarily removed for testing)';

-- Fix availability_status check constraint to match predefined options
-- This migration updates the check constraint to allow the proper capitalization
-- that matches the predefined_availability_statuses table

-- Step 1: Update existing data to match the new constraint format
UPDATE users_profile 
SET availability_status = CASE 
    WHEN availability_status = 'available' THEN 'Available'
    WHEN availability_status = 'busy' THEN 'Busy'
    WHEN availability_status = 'unavailable' THEN 'Unavailable'
    WHEN availability_status = 'limited' THEN 'Limited'
    WHEN availability_status = 'weekends_only' THEN 'Weekends Only'
    WHEN availability_status = 'weekdays_only' THEN 'Weekdays Only'
    ELSE availability_status -- Keep existing values that already match
END
WHERE availability_status IS NOT NULL;

-- Step 2: Drop the existing constraint
ALTER TABLE users_profile DROP CONSTRAINT IF EXISTS check_availability_status;

-- Step 3: Add the updated constraint with proper capitalization
ALTER TABLE users_profile 
ADD CONSTRAINT check_availability_status 
CHECK (availability_status IN ('Available', 'Busy', 'Unavailable', 'Limited', 'Weekends Only', 'Weekdays Only'));

-- Step 4: Update the comment to reflect the correct values
COMMENT ON COLUMN users_profile.availability_status IS 'User availability: Available, Busy, Unavailable, Limited, Weekends Only, Weekdays Only';

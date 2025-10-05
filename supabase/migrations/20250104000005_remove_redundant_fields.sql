-- Remove redundant availability and studio fields
-- This migration consolidates duplicate fields to simplify the profile system

-- Step 1: Update has_studio based on studio_name and studio_address (if not already set)
UPDATE users_profile 
SET has_studio = CASE 
    WHEN studio_name IS NOT NULL AND studio_name != '' THEN true
    WHEN studio_address IS NOT NULL AND studio_address != '' THEN true
    ELSE false
END
WHERE has_studio IS NULL OR has_studio = false;

-- Step 2: Remove redundant columns that may exist
ALTER TABLE users_profile 
DROP COLUMN IF EXISTS available_weekdays,
DROP COLUMN IF EXISTS available_weekends,
DROP COLUMN IF EXISTS available_evenings,
DROP COLUMN IF EXISTS available_overnight;

-- Step 3: Add comments to clarify the remaining fields
COMMENT ON COLUMN users_profile.availability_status IS 'User availability: available, busy, unavailable, limited, weekends_only';
COMMENT ON COLUMN users_profile.has_studio IS 'Whether user has a studio (derived from studio_name/studio_address)';
COMMENT ON COLUMN users_profile.studio_name IS 'Name of the studio (if any)';
COMMENT ON COLUMN users_profile.studio_address IS 'Address of the studio (if any)';

-- Step 4: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_profile_availability_status ON users_profile(availability_status);
CREATE INDEX IF NOT EXISTS idx_users_profile_has_studio ON users_profile(has_studio);

-- Step 5: Add constraint for availability_status (if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_availability_status' 
        AND table_name = 'users_profile'
    ) THEN
        ALTER TABLE users_profile 
        ADD CONSTRAINT check_availability_status 
        CHECK (availability_status IN ('available', 'busy', 'unavailable', 'limited', 'weekends_only'));
    END IF;
END $$;

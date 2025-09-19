-- Enhance turnaround time to support different units (days/weeks/months)
-- This allows users to choose their preferred time unit for turnaround display

-- First, add the typical_turnaround_days column if it doesn't exist
ALTER TABLE users_profile 
ADD COLUMN IF NOT EXISTS typical_turnaround_days INTEGER DEFAULT 0;

-- Add comment for typical_turnaround_days
COMMENT ON COLUMN users_profile.typical_turnaround_days IS 'Typical turnaround time for deliverables in days';

-- Add the turnaround_unit_preference field
ALTER TABLE users_profile 
ADD COLUMN IF NOT EXISTS turnaround_unit_preference VARCHAR(10) DEFAULT 'days' CHECK (turnaround_unit_preference IN ('days', 'weeks', 'months'));

-- Add comment for documentation
COMMENT ON COLUMN users_profile.turnaround_unit_preference IS 'Preferred unit for turnaround time display (days, weeks, or months)';

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_users_profile_turnaround_unit ON users_profile(turnaround_unit_preference);

-- Update existing records to use days by default
UPDATE users_profile 
SET turnaround_unit_preference = 'days' 
WHERE turnaround_unit_preference IS NULL;

-- Fix any existing invalid turnaround values before adding constraint
UPDATE users_profile 
SET typical_turnaround_days = 1 
WHERE typical_turnaround_days IS NOT NULL AND typical_turnaround_days <= 0;

-- Add constraint to ensure positive turnaround values (only if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_turnaround_positive' 
        AND table_name = 'users_profile'
    ) THEN
        ALTER TABLE users_profile 
        ADD CONSTRAINT check_turnaround_positive 
        CHECK (typical_turnaround_days IS NULL OR typical_turnaround_days > 0);
    END IF;
END $$;

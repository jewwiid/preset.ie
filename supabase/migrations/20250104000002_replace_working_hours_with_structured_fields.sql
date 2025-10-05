-- Replace preferred_working_hours TEXT field with structured working time preferences
-- This migration converts the free-text field to specific boolean fields for better filtering and matching

-- Add new structured working time preference fields
ALTER TABLE users_profile 
ADD COLUMN IF NOT EXISTS working_time_preference VARCHAR(50) DEFAULT 'flexible',
ADD COLUMN IF NOT EXISTS preferred_start_time TIME,
ADD COLUMN IF NOT EXISTS preferred_end_time TIME,
ADD COLUMN IF NOT EXISTS working_timezone VARCHAR(100);

-- Add comments for the new fields
COMMENT ON COLUMN users_profile.working_time_preference IS 'Preferred working time type: flexible, standard_business_hours, evenings_only, weekends_only, overnight_only';
COMMENT ON COLUMN users_profile.preferred_start_time IS 'Preferred start time for work (if applicable)';
COMMENT ON COLUMN users_profile.preferred_end_time IS 'Preferred end time for work (if applicable)';
COMMENT ON COLUMN users_profile.working_timezone IS 'Working timezone (e.g., EST, PST, GMT)';

-- Add indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_users_profile_working_time_preference ON users_profile(working_time_preference);
CREATE INDEX IF NOT EXISTS idx_users_profile_preferred_start_time ON users_profile(preferred_start_time);
CREATE INDEX IF NOT EXISTS idx_users_profile_working_timezone ON users_profile(working_timezone);

-- Add constraint for working_time_preference enum values
ALTER TABLE users_profile 
ADD CONSTRAINT check_working_time_preference 
CHECK (working_time_preference IN (
  'flexible',
  'standard_business_hours', 
  'mornings_only',
  'evenings_only', 
  'weekends_only',
  'overnight_only',
  'custom'
));

-- Migration function to convert existing preferred_working_hours text to structured data
CREATE OR REPLACE FUNCTION migrate_working_hours_data()
RETURNS void AS $$
DECLARE
    profile_record RECORD;
    extracted_start_time TIME;
    extracted_end_time TIME;
    time_preference VARCHAR(50);
BEGIN
    -- Loop through all profiles with existing preferred_working_hours data
    FOR profile_record IN 
        SELECT id, preferred_working_hours 
        FROM users_profile 
        WHERE preferred_working_hours IS NOT NULL 
        AND preferred_working_hours != ''
    LOOP
        -- Reset variables for each record
        extracted_start_time := NULL;
        extracted_end_time := NULL;
        time_preference := 'flexible';
        
        -- Parse common patterns from preferred_working_hours text
        -- Pattern 1: "9am-5pm", "9:00am-5:00pm", "09:00-17:00"
        IF profile_record.preferred_working_hours ~* '\d{1,2}:?\d{0,2}\s*(am|pm)?\s*-\s*\d{1,2}:?\d{0,2}\s*(am|pm)?' THEN
            -- Extract start and end times using regex
            SELECT 
                CASE 
                    WHEN matches[1] ~* 'pm$' AND matches[2]::int < 12 THEN (matches[2]::int + 12)::text || ':00'
                    WHEN matches[1] ~* 'am$' AND matches[2]::int = 12 THEN '00:00'
                    WHEN matches[1] ~* 'am$' THEN matches[2] || ':00'
                    ELSE matches[2] || ':00'
                END::TIME,
                CASE 
                    WHEN matches[3] ~* 'pm$' AND matches[4]::int < 12 THEN (matches[4]::int + 12)::text || ':00'
                    WHEN matches[3] ~* 'am$' AND matches[4]::int = 12 THEN '00:00'
                    WHEN matches[3] ~* 'am$' THEN matches[4] || ':00'
                    ELSE matches[4] || ':00'
                END::TIME
            INTO extracted_start_time, extracted_end_time
            FROM regexp_matches(
                profile_record.preferred_working_hours, 
                '(\d{1,2}):?(\d{0,2})\s*(am|pm)?\s*-\s*(\d{1,2}):?(\d{0,2})\s*(am|pm)?', 
                'i'
            ) AS matches;
            
            time_preference := 'custom';
        
        -- Pattern 2: Keyword-based preferences
        ELSIF profile_record.preferred_working_hours ~* '\b(evening|evenings|night|nights)\b' THEN
            time_preference := 'evenings_only';
            extracted_start_time := '18:00';
            extracted_end_time := '23:00';
            
        ELSIF profile_record.preferred_working_hours ~* '\b(weekend|weekends|sat|sunday)\b' THEN
            time_preference := 'weekends_only';
            
        ELSIF profile_record.preferred_working_hours ~* '\b(morning|mornings|early|dawn)\b' THEN
            time_preference := 'mornings_only';
            extracted_start_time := '06:00';
            extracted_end_time := '12:00';
            
        ELSIF profile_record.preferred_working_hours ~* '\b(overnight|late night|midnight|graveyard)\b' THEN
            time_preference := 'overnight_only';
            extracted_start_time := '22:00';
            extracted_end_time := '06:00';
            
        ELSIF profile_record.preferred_working_hours ~* '\b(business|office|9-5|standard|regular)\b' THEN
            time_preference := 'standard_business_hours';
            extracted_start_time := '09:00';
            extracted_end_time := '17:00';
            
        ELSIF profile_record.preferred_working_hours ~* '\b(flexible|anytime|available)\b' THEN
            time_preference := 'flexible';
        END IF;
        
        -- Update the profile with extracted data
        UPDATE users_profile 
        SET 
            working_time_preference = time_preference,
            preferred_start_time = extracted_start_time,
            preferred_end_time = extracted_end_time,
            working_timezone = 'UTC' -- Default timezone, can be updated by user
        WHERE id = profile_record.id;
        
    END LOOP;
    
    -- Log the migration results
    RAISE NOTICE 'Migration completed. Updated % profiles with working hours data.', 
        (SELECT COUNT(*) FROM users_profile WHERE working_time_preference != 'flexible' OR preferred_start_time IS NOT NULL);
END;
$$ LANGUAGE plpgsql;

-- Run the migration function
SELECT migrate_working_hours_data();

-- Drop the migration function after use
DROP FUNCTION migrate_working_hours_data();

-- Note: We keep the preferred_working_hours field for now to preserve any custom data
-- It can be safely removed in a future migration after verifying the conversion worked correctly
-- ALTER TABLE users_profile DROP COLUMN preferred_working_hours;

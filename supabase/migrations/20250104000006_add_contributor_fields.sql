-- Add contributor-specific fields to users_profile table
-- This migration adds fields for contributors, talent, and users with both roles

-- Step 1: Add contributor-specific columns
ALTER TABLE users_profile 
ADD COLUMN IF NOT EXISTS contributor_roles TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS professional_skills TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS behance_url TEXT,
ADD COLUMN IF NOT EXISTS dribbble_url TEXT;

-- Step 2: Add comments to clarify the purpose of each field
COMMENT ON COLUMN users_profile.contributor_roles IS 'Array of contributor role names from predefined_roles table';
COMMENT ON COLUMN users_profile.professional_skills IS 'Array of professional skills, tools, and certifications';
COMMENT ON COLUMN users_profile.behance_url IS 'Behance portfolio/profile URL';
COMMENT ON COLUMN users_profile.dribbble_url IS 'Dribbble portfolio/profile URL';

-- Step 3: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_profile_contributor_roles ON users_profile USING GIN(contributor_roles);
CREATE INDEX IF NOT EXISTS idx_users_profile_professional_skills ON users_profile USING GIN(professional_skills);

-- Step 4: Add constraints for URL validation (optional)
ALTER TABLE users_profile 
ADD CONSTRAINT check_behance_url_format 
CHECK (behance_url IS NULL OR behance_url ~ '^https?://.*behance\.net.*');

ALTER TABLE users_profile 
ADD CONSTRAINT check_dribbble_url_format 
CHECK (dribbble_url IS NULL OR dribbble_url ~ '^https?://.*dribbble\.com.*');

-- Step 5: Update existing contributor users with default roles (optional)
-- This is a one-time migration to populate existing users
UPDATE users_profile 
SET contributor_roles = ARRAY['Freelancer']  -- Default role
WHERE 'CONTRIBUTOR' = ANY(role_flags) 
  AND contributor_roles IS NULL;

-- Step 6: Create a function to validate contributor roles against predefined_roles
CREATE OR REPLACE FUNCTION validate_contributor_roles(user_roles TEXT[])
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    role_name TEXT;
    valid_role_count INTEGER;
BEGIN
    -- Check if all roles in the array exist in predefined_roles
    SELECT COUNT(*) INTO valid_role_count
    FROM unnest(user_roles) AS role_name
    WHERE role_name IN (
        SELECT name FROM predefined_roles WHERE is_active = true
    );
    
    -- Return true if all roles are valid
    RETURN valid_role_count = array_length(user_roles, 1);
END;
$$;

-- Step 7: Add a trigger to validate contributor roles on insert/update
CREATE OR REPLACE FUNCTION validate_contributor_roles_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Only validate if contributor_roles is not empty and user has CONTRIBUTOR role
    IF NEW.contributor_roles IS NOT NULL 
       AND array_length(NEW.contributor_roles, 1) > 0
       AND 'CONTRIBUTOR' = ANY(NEW.role_flags) THEN
        
        IF NOT validate_contributor_roles(NEW.contributor_roles) THEN
            RAISE EXCEPTION 'Invalid contributor role(s) found. All roles must exist in predefined_roles table.';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS trg_validate_contributor_roles ON users_profile;
CREATE TRIGGER trg_validate_contributor_roles
    BEFORE INSERT OR UPDATE ON users_profile
    FOR EACH ROW
    EXECUTE FUNCTION validate_contributor_roles_trigger();

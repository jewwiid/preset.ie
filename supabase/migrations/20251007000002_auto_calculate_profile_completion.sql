-- ================================================================
-- Auto-Calculate Profile Completion Percentage
-- This trigger will automatically update profile_completion_percentage
-- whenever a users_profile record is created or updated
-- ================================================================

-- Create the calculation function with role-aware logic
CREATE OR REPLACE FUNCTION calculate_profile_completion(profile_record users_profile)
RETURNS INTEGER AS $$
DECLARE
  completed_weight INTEGER := 0;
  total_weight INTEGER := 0;
  has_contributor BOOLEAN;
  has_talent BOOLEAN;
BEGIN
  -- Determine user's role
  has_contributor := profile_record.role_flags && ARRAY['CONTRIBUTOR']::user_role[];
  has_talent := profile_record.role_flags && ARRAY['TALENT']::user_role[];
  -- ============ UNIVERSAL FIELDS (Apply to all roles) ============
  
  -- bio (weight: 10)
  IF profile_record.bio IS NOT NULL AND profile_record.bio != '' THEN
    completed_weight := completed_weight + 10;
  END IF;
  total_weight := total_weight + 10;
  
  -- city (weight: 8)
  IF profile_record.city IS NOT NULL AND profile_record.city != '' THEN
    completed_weight := completed_weight + 8;
  END IF;
  total_weight := total_weight + 8;
  
  -- country (weight: 5)
  IF profile_record.country IS NOT NULL AND profile_record.country != '' THEN
    completed_weight := completed_weight + 5;
  END IF;
  total_weight := total_weight + 5;
  
  -- years_experience (weight: 12)
  IF profile_record.years_experience IS NOT NULL THEN
    completed_weight := completed_weight + 12;
  END IF;
  total_weight := total_weight + 12;
  
  -- specializations (weight: 15)
  IF profile_record.specializations IS NOT NULL AND array_length(profile_record.specializations, 1) > 0 THEN
    completed_weight := completed_weight + 15;
  END IF;
  total_weight := total_weight + 15;
  
  -- hourly_rate_min (weight: 10)
  IF profile_record.hourly_rate_min IS NOT NULL THEN
    completed_weight := completed_weight + 10;
  END IF;
  total_weight := total_weight + 10;
  
  -- typical_turnaround_days (weight: 6)
  IF profile_record.typical_turnaround_days IS NOT NULL THEN
    completed_weight := completed_weight + 6;
  END IF;
  total_weight := total_weight + 6;
  
  -- ============ CONTRIBUTOR-ONLY FIELDS ============
  
  -- equipment_list (weight: 8) - Only for contributors
  IF has_contributor THEN
    IF profile_record.equipment_list IS NOT NULL AND array_length(profile_record.equipment_list, 1) > 0 THEN
      completed_weight := completed_weight + 8;
    END IF;
    total_weight := total_weight + 8;
  END IF;
  
  -- editing_software (weight: 6) - Only for contributors
  IF has_contributor THEN
    IF profile_record.editing_software IS NOT NULL AND array_length(profile_record.editing_software, 1) > 0 THEN
      completed_weight := completed_weight + 6;
    END IF;
    total_weight := total_weight + 6;
  END IF;
  
  -- ============ UNIVERSAL FIELDS (continued) ============
  
  -- phone_number (weight: 5)
  IF profile_record.phone_number IS NOT NULL AND profile_record.phone_number != '' THEN
    completed_weight := completed_weight + 5;
  END IF;
  total_weight := total_weight + 5;
  
  -- portfolio_url (weight: 8)
  IF profile_record.portfolio_url IS NOT NULL AND profile_record.portfolio_url != '' THEN
    completed_weight := completed_weight + 8;
  END IF;
  total_weight := total_weight + 8;
  
  -- website_url (weight: 5)
  IF profile_record.website_url IS NOT NULL AND profile_record.website_url != '' THEN
    completed_weight := completed_weight + 5;
  END IF;
  total_weight := total_weight + 5;
  
  -- instagram_handle (weight: 3)
  IF profile_record.instagram_handle IS NOT NULL AND profile_record.instagram_handle != '' THEN
    completed_weight := completed_weight + 3;
  END IF;
  total_weight := total_weight + 3;
  
  -- tiktok_handle (weight: 2)
  IF profile_record.tiktok_handle IS NOT NULL AND profile_record.tiktok_handle != '' THEN
    completed_weight := completed_weight + 2;
  END IF;
  total_weight := total_weight + 2;
  
  -- available_for_travel (weight: 4)
  IF profile_record.available_for_travel IS NOT NULL THEN
    completed_weight := completed_weight + 4;
  END IF;
  total_weight := total_weight + 4;
  
  -- languages (weight: 4)
  IF profile_record.languages IS NOT NULL AND array_length(profile_record.languages, 1) > 0 THEN
    completed_weight := completed_weight + 4;
  END IF;
  total_weight := total_weight + 4;
  
  -- ============ CONTRIBUTOR-ONLY FIELDS (continued) ============
  
  -- studio_name (weight: 4) - Only for contributors
  IF has_contributor THEN
    IF profile_record.studio_name IS NOT NULL AND profile_record.studio_name != '' THEN
      completed_weight := completed_weight + 4;
    END IF;
    total_weight := total_weight + 4;
  END IF;
  
  -- Prevent division by zero
  IF total_weight = 0 THEN
    RETURN 0;
  END IF;
  
  RETURN ROUND((completed_weight::DECIMAL / total_weight) * 100);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create trigger function to auto-update profile_completion_percentage
CREATE OR REPLACE FUNCTION auto_update_profile_completion()
RETURNS TRIGGER AS $$
BEGIN
  NEW.profile_completion_percentage := calculate_profile_completion(NEW);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_auto_update_profile_completion ON users_profile;

-- Create trigger that runs BEFORE INSERT or UPDATE
CREATE TRIGGER trigger_auto_update_profile_completion
  BEFORE INSERT OR UPDATE ON users_profile
  FOR EACH ROW
  EXECUTE FUNCTION auto_update_profile_completion();

-- Recalculate for all existing users
UPDATE users_profile
SET profile_completion_percentage = calculate_profile_completion(users_profile.*)
WHERE role_flags != ARRAY['ADMIN']::user_role[];

-- Verify the trigger works by showing results
SELECT 
  display_name,
  primary_skill,
  profile_completion_percentage,
  CASE WHEN bio IS NOT NULL AND bio != '' THEN '✓' ELSE '✗' END as bio,
  CASE WHEN years_experience IS NOT NULL THEN '✓' ELSE '✗' END as experience,
  CASE WHEN specializations IS NOT NULL AND array_length(specializations, 1) > 0 THEN '✓' ELSE '✗' END as specializations,
  CASE WHEN hourly_rate_min IS NOT NULL THEN '✓' ELSE '✗' END as rates,
  CASE WHEN languages IS NOT NULL AND array_length(languages, 1) > 0 THEN '✓' ELSE '✗' END as languages
FROM users_profile
WHERE role_flags != ARRAY['ADMIN']::user_role[]
ORDER BY profile_completion_percentage DESC;

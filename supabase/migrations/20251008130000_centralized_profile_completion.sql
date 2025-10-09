-- ================================================================
-- Centralized Profile Completion Calculation (v2)
-- Handles TALENT, CONTRIBUTOR, and BOTH roles properly
-- ================================================================

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
  
  -- ============================================================
  -- UNIVERSAL FIELDS (Apply to ALL roles)
  -- ============================================================
  
  -- Basic Profile Info
  -- avatar_url (weight: 15) - CRITICAL: Profile photo is essential for visual platforms
  IF profile_record.avatar_url IS NOT NULL AND profile_record.avatar_url != '' THEN
    completed_weight := completed_weight + 15;
  END IF;
  total_weight := total_weight + 15;
  
  -- primary_skill (weight: 15) - What you do is as important as who you are
  IF profile_record.primary_skill IS NOT NULL AND profile_record.primary_skill != '' THEN
    completed_weight := completed_weight + 15;
  END IF;
  total_weight := total_weight + 15;
  
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
  
  -- specializations (weight: 12) - Additional specializations beyond primary
  IF profile_record.specializations IS NOT NULL AND array_length(profile_record.specializations, 1) > 0 THEN
    completed_weight := completed_weight + 12;
  END IF;
  total_weight := total_weight + 12;
  
  -- Professional Experience
  -- years_experience (weight: 10)
  IF profile_record.years_experience IS NOT NULL THEN
    completed_weight := completed_weight + 10;
  END IF;
  total_weight := total_weight + 10;
  
  -- experience_level (weight: 8)
  IF profile_record.experience_level IS NOT NULL AND profile_record.experience_level != '' THEN
    completed_weight := completed_weight + 8;
  END IF;
  total_weight := total_weight + 8;
  
  -- Rates & Availability
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
  
  -- availability_status (weight: 5)
  IF profile_record.availability_status IS NOT NULL AND profile_record.availability_status != '' THEN
    completed_weight := completed_weight + 5;
  END IF;
  total_weight := total_weight + 5;
  
  -- Contact Information
  -- phone_number (weight: 5)
  IF profile_record.phone_number IS NOT NULL AND profile_record.phone_number != '' THEN
    completed_weight := completed_weight + 5;
  END IF;
  total_weight := total_weight + 5;
  
  -- Portfolio & Social Links
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
  
  -- Additional Info
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
  
  -- ============================================================
  -- CONTRIBUTOR-SPECIFIC FIELDS
  -- ============================================================
  IF has_contributor THEN
    -- equipment_list (weight: 8)
    IF profile_record.equipment_list IS NOT NULL AND array_length(profile_record.equipment_list, 1) > 0 THEN
      completed_weight := completed_weight + 8;
    END IF;
    total_weight := total_weight + 8;
    
    -- editing_software (weight: 6)
    IF profile_record.editing_software IS NOT NULL AND array_length(profile_record.editing_software, 1) > 0 THEN
      completed_weight := completed_weight + 6;
    END IF;
    total_weight := total_weight + 6;
    
    -- studio_name (weight: 4)
    IF profile_record.studio_name IS NOT NULL AND profile_record.studio_name != '' THEN
      completed_weight := completed_weight + 4;
    END IF;
    total_weight := total_weight + 4;
    
    -- has_studio (weight: 3)
    IF profile_record.has_studio IS NOT NULL THEN
      completed_weight := completed_weight + 3;
    END IF;
    total_weight := total_weight + 3;
  END IF;
  
  -- ============================================================
  -- TALENT-SPECIFIC FIELDS
  -- ============================================================
  IF has_talent THEN
    -- talent_categories (weight: 10)
    IF profile_record.talent_categories IS NOT NULL AND array_length(profile_record.talent_categories, 1) > 0 THEN
      completed_weight := completed_weight + 10;
    END IF;
    total_weight := total_weight + 10;
    
    -- Physical Attributes
    -- height_cm (weight: 6)
    IF profile_record.height_cm IS NOT NULL THEN
      completed_weight := completed_weight + 6;
    END IF;
    total_weight := total_weight + 6;
    
    -- weight_kg (weight: 4)
    IF profile_record.weight_kg IS NOT NULL THEN
      completed_weight := completed_weight + 4;
    END IF;
    total_weight := total_weight + 4;
    
    -- body_type (weight: 4)
    IF profile_record.body_type IS NOT NULL AND profile_record.body_type != '' THEN
      completed_weight := completed_weight + 4;
    END IF;
    total_weight := total_weight + 4;
    
    -- eye_color (weight: 3)
    IF profile_record.eye_color IS NOT NULL AND profile_record.eye_color != '' THEN
      completed_weight := completed_weight + 3;
    END IF;
    total_weight := total_weight + 3;
    
    -- hair_color (weight: 3)
    IF profile_record.hair_color IS NOT NULL AND profile_record.hair_color != '' THEN
      completed_weight := completed_weight + 3;
    END IF;
    total_weight := total_weight + 3;
    
    -- hair_length (weight: 2)
    IF profile_record.hair_length IS NOT NULL AND profile_record.hair_length != '' THEN
      completed_weight := completed_weight + 2;
    END IF;
    total_weight := total_weight + 2;
    
    -- skin_tone (weight: 2)
    IF profile_record.skin_tone IS NOT NULL AND profile_record.skin_tone != '' THEN
      completed_weight := completed_weight + 2;
    END IF;
    total_weight := total_weight + 2;
    
    -- Demographics (for talent profiles)
    -- gender_identity (weight: 4)
    IF profile_record.gender_identity IS NOT NULL AND profile_record.gender_identity != '' THEN
      completed_weight := completed_weight + 4;
    END IF;
    total_weight := total_weight + 4;
    
    -- ethnicity (weight: 3)
    IF profile_record.ethnicity IS NOT NULL AND profile_record.ethnicity != '' THEN
      completed_weight := completed_weight + 3;
    END IF;
    total_weight := total_weight + 3;
    
    -- nationality (weight: 3)
    IF profile_record.nationality IS NOT NULL AND profile_record.nationality != '' THEN
      completed_weight := completed_weight + 3;
    END IF;
    total_weight := total_weight + 3;
    
    -- tattoos/piercings info (weight: 2)
    IF profile_record.tattoos IS NOT NULL THEN
      completed_weight := completed_weight + 1;
    END IF;
    IF profile_record.piercings IS NOT NULL THEN
      completed_weight := completed_weight + 1;
    END IF;
    total_weight := total_weight + 2;
  END IF;
  
  -- Prevent division by zero
  IF total_weight = 0 THEN
    RETURN 0;
  END IF;
  
  RETURN ROUND((completed_weight::DECIMAL / total_weight) * 100);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Recreate trigger to use updated function
DROP TRIGGER IF EXISTS trigger_auto_update_profile_completion ON users_profile;

CREATE TRIGGER trigger_auto_update_profile_completion
  BEFORE INSERT OR UPDATE ON users_profile
  FOR EACH ROW
  EXECUTE FUNCTION auto_update_profile_completion();

-- Recalculate for all existing users
UPDATE users_profile
SET profile_completion_percentage = calculate_profile_completion(users_profile.*)
WHERE role_flags != ARRAY['ADMIN']::user_role[];

-- Show results for verification
SELECT 
  display_name,
  role_flags,
  primary_skill,
  profile_completion_percentage,
  CASE WHEN avatar_url IS NOT NULL AND avatar_url != '' THEN '✓' ELSE '✗' END as avatar,
  CASE WHEN bio IS NOT NULL AND bio != '' THEN '✓' ELSE '✗' END as bio,
  CASE WHEN primary_skill IS NOT NULL THEN '✓' ELSE '✗' END as primary_skill,
  CASE WHEN years_experience IS NOT NULL THEN '✓' ELSE '✗' END as experience,
  CASE WHEN talent_categories IS NOT NULL AND array_length(talent_categories, 1) > 0 THEN '✓' ELSE '✗' END as categories,
  CASE WHEN height_cm IS NOT NULL THEN '✓' ELSE '✗' END as height,
  CASE WHEN languages IS NOT NULL AND array_length(languages, 1) > 0 THEN '✓' ELSE '✗' END as languages
FROM users_profile
WHERE role_flags != ARRAY['ADMIN']::user_role[]
ORDER BY profile_completion_percentage DESC;


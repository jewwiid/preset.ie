-- ================================================================
-- Recalculate Profile Completion Percentage for All Users
-- Based on the PROFILE_FIELDS weights from ProfileCompletionCard.tsx
-- ================================================================

-- Create a function to calculate profile completion percentage
CREATE OR REPLACE FUNCTION calculate_profile_completion(profile_record users_profile)
RETURNS INTEGER AS $$
DECLARE
  completed_weight INTEGER := 0;
  total_weight INTEGER := 115; -- Sum of all field weights
BEGIN
  -- bio (weight: 10)
  IF profile_record.bio IS NOT NULL AND profile_record.bio != '' THEN
    completed_weight := completed_weight + 10;
  END IF;
  
  -- city (weight: 8)
  IF profile_record.city IS NOT NULL AND profile_record.city != '' THEN
    completed_weight := completed_weight + 8;
  END IF;
  
  -- country (weight: 5)
  IF profile_record.country IS NOT NULL AND profile_record.country != '' THEN
    completed_weight := completed_weight + 5;
  END IF;
  
  -- years_experience (weight: 12)
  IF profile_record.years_experience IS NOT NULL THEN
    completed_weight := completed_weight + 12;
  END IF;
  
  -- specializations (weight: 15)
  IF profile_record.specializations IS NOT NULL AND array_length(profile_record.specializations, 1) > 0 THEN
    completed_weight := completed_weight + 15;
  END IF;
  
  -- hourly_rate_min (weight: 10)
  IF profile_record.hourly_rate_min IS NOT NULL THEN
    completed_weight := completed_weight + 10;
  END IF;
  
  -- typical_turnaround_days (weight: 6)
  IF profile_record.typical_turnaround_days IS NOT NULL THEN
    completed_weight := completed_weight + 6;
  END IF;
  
  -- equipment_list (weight: 8)
  IF profile_record.equipment_list IS NOT NULL AND array_length(profile_record.equipment_list, 1) > 0 THEN
    completed_weight := completed_weight + 8;
  END IF;
  
  -- editing_software (weight: 6)
  IF profile_record.editing_software IS NOT NULL AND array_length(profile_record.editing_software, 1) > 0 THEN
    completed_weight := completed_weight + 6;
  END IF;
  
  -- phone_number (weight: 5)
  IF profile_record.phone_number IS NOT NULL AND profile_record.phone_number != '' THEN
    completed_weight := completed_weight + 5;
  END IF;
  
  -- portfolio_url (weight: 8)
  IF profile_record.portfolio_url IS NOT NULL AND profile_record.portfolio_url != '' THEN
    completed_weight := completed_weight + 8;
  END IF;
  
  -- website_url (weight: 5)
  IF profile_record.website_url IS NOT NULL AND profile_record.website_url != '' THEN
    completed_weight := completed_weight + 5;
  END IF;
  
  -- instagram_handle (weight: 3)
  IF profile_record.instagram_handle IS NOT NULL AND profile_record.instagram_handle != '' THEN
    completed_weight := completed_weight + 3;
  END IF;
  
  -- tiktok_handle (weight: 2)
  IF profile_record.tiktok_handle IS NOT NULL AND profile_record.tiktok_handle != '' THEN
    completed_weight := completed_weight + 2;
  END IF;
  
  -- available_for_travel (weight: 4)
  IF profile_record.available_for_travel IS NOT NULL THEN
    completed_weight := completed_weight + 4;
  END IF;
  
  -- studio_name (weight: 4)
  IF profile_record.studio_name IS NOT NULL AND profile_record.studio_name != '' THEN
    completed_weight := completed_weight + 4;
  END IF;
  
  -- languages (weight: 4)
  IF profile_record.languages IS NOT NULL AND array_length(profile_record.languages, 1) > 0 THEN
    completed_weight := completed_weight + 4;
  END IF;
  
  RETURN ROUND((completed_weight::DECIMAL / total_weight) * 100);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update profile_completion_percentage for all users
UPDATE users_profile
SET profile_completion_percentage = calculate_profile_completion(users_profile.*)
WHERE role_flags != ARRAY['ADMIN']::user_role[];

-- Show results
SELECT 
  display_name,
  primary_skill,
  role_flags,
  profile_completion_percentage,
  -- Show which key fields are filled
  CASE WHEN bio IS NOT NULL AND bio != '' THEN '✓' ELSE '✗' END as has_bio,
  CASE WHEN years_experience IS NOT NULL THEN '✓' ELSE '✗' END as has_experience,
  CASE WHEN specializations IS NOT NULL AND array_length(specializations, 1) > 0 THEN '✓' ELSE '✗' END as has_specializations,
  CASE WHEN hourly_rate_min IS NOT NULL THEN '✓' ELSE '✗' END as has_rates,
  CASE WHEN languages IS NOT NULL AND array_length(languages, 1) > 0 THEN '✓' ELSE '✗' END as has_languages,
  updated_at
FROM users_profile
WHERE role_flags != ARRAY['ADMIN']::user_role[]
ORDER BY profile_completion_percentage DESC;

-- Cleanup: Drop the function after use (optional)
-- DROP FUNCTION IF EXISTS calculate_profile_completion(users_profile);

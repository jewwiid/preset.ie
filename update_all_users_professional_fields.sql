-- ================================================================
-- Update Professional Fields for All Users
-- This script fills in missing professional fields for all users
-- to improve their profile completion percentages
-- ================================================================

-- First, let's check current state of all users
SELECT 
  user_id,
  display_name,
  primary_skill,
  role_flags,
  specializations,
  years_experience,
  hourly_rate_min,
  hourly_rate_max,
  typical_turnaround_days,
  languages,
  profile_completion_percentage
FROM users_profile
ORDER BY created_at DESC;

-- ================================================================
-- Update Strategy:
-- 1. Set reasonable default specializations based on primary_skill
-- 2. Set default years_experience based on account age (1-3 years)
-- 3. Set default hourly rates based on role and skill level
-- 4. Set default turnaround time (3-7 days depending on role)
-- 5. Add English as default language if languages array is empty
-- ================================================================

-- Update Photographers
UPDATE users_profile
SET
  specializations = CASE 
    WHEN specializations = '{}' OR specializations IS NULL THEN 
      ARRAY['Portrait Photography', 'Event Photography']
    ELSE specializations
  END,
  years_experience = CASE 
    WHEN years_experience IS NULL THEN 
      LEAST(EXTRACT(YEAR FROM AGE(NOW(), created_at))::INTEGER + 1, 5)
    ELSE years_experience
  END,
  hourly_rate_min = CASE 
    WHEN hourly_rate_min IS NULL THEN 50
    ELSE hourly_rate_min
  END,
  hourly_rate_max = CASE 
    WHEN hourly_rate_max IS NULL THEN 150
    ELSE hourly_rate_max
  END,
  typical_turnaround_days = CASE 
    WHEN typical_turnaround_days IS NULL THEN 5
    ELSE typical_turnaround_days
  END,
  languages = CASE 
    WHEN languages = '{}' OR languages IS NULL THEN ARRAY['English']
    ELSE languages
  END
WHERE primary_skill = 'Photographer'
  AND (specializations = '{}' OR specializations IS NULL 
       OR years_experience IS NULL 
       OR hourly_rate_min IS NULL 
       OR typical_turnaround_days IS NULL
       OR languages = '{}' OR languages IS NULL);

-- Update Videographers
UPDATE users_profile
SET
  specializations = CASE 
    WHEN specializations = '{}' OR specializations IS NULL THEN 
      ARRAY['Event Videography', 'Corporate Video']
    ELSE specializations
  END,
  years_experience = CASE 
    WHEN years_experience IS NULL THEN 
      LEAST(EXTRACT(YEAR FROM AGE(NOW(), created_at))::INTEGER + 1, 5)
    ELSE years_experience
  END,
  hourly_rate_min = CASE 
    WHEN hourly_rate_min IS NULL THEN 75
    ELSE hourly_rate_min
  END,
  hourly_rate_max = CASE 
    WHEN hourly_rate_max IS NULL THEN 200
    ELSE hourly_rate_max
  END,
  typical_turnaround_days = CASE 
    WHEN typical_turnaround_days IS NULL THEN 7
    ELSE typical_turnaround_days
  END,
  languages = CASE 
    WHEN languages = '{}' OR languages IS NULL THEN ARRAY['English']
    ELSE languages
  END
WHERE primary_skill = 'Videographer'
  AND (specializations = '{}' OR specializations IS NULL 
       OR years_experience IS NULL 
       OR hourly_rate_min IS NULL 
       OR typical_turnaround_days IS NULL
       OR languages = '{}' OR languages IS NULL);

-- Update Models (like Zara)
UPDATE users_profile
SET
  specializations = CASE 
    WHEN specializations = '{}' OR specializations IS NULL THEN 
      ARRAY['Commercial', 'Editorial']
    ELSE specializations
  END,
  years_experience = CASE 
    WHEN years_experience IS NULL THEN 
      LEAST(EXTRACT(YEAR FROM AGE(NOW(), created_at))::INTEGER + 1, 5)
    ELSE years_experience
  END,
  hourly_rate_min = CASE 
    WHEN hourly_rate_min IS NULL THEN 50
    ELSE hourly_rate_min
  END,
  hourly_rate_max = CASE 
    WHEN hourly_rate_max IS NULL THEN 150
    ELSE hourly_rate_max
  END,
  typical_turnaround_days = CASE 
    WHEN typical_turnaround_days IS NULL THEN 3
    ELSE typical_turnaround_days
  END,
  languages = CASE 
    WHEN languages = '{}' OR languages IS NULL THEN ARRAY['English']
    ELSE languages
  END
WHERE primary_skill = 'Model'
  AND (specializations = '{}' OR specializations IS NULL 
       OR years_experience IS NULL 
       OR hourly_rate_min IS NULL 
       OR typical_turnaround_days IS NULL
       OR languages = '{}' OR languages IS NULL);

-- Update Actors/Actresses
UPDATE users_profile
SET
  specializations = CASE 
    WHEN specializations = '{}' OR specializations IS NULL THEN 
      ARRAY['Film', 'Commercial']
    ELSE specializations
  END,
  years_experience = CASE 
    WHEN years_experience IS NULL THEN 
      LEAST(EXTRACT(YEAR FROM AGE(NOW(), created_at))::INTEGER + 1, 5)
    ELSE years_experience
  END,
  hourly_rate_min = CASE 
    WHEN hourly_rate_min IS NULL THEN 75
    ELSE hourly_rate_min
  END,
  hourly_rate_max = CASE 
    WHEN hourly_rate_max IS NULL THEN 200
    ELSE hourly_rate_max
  END,
  typical_turnaround_days = CASE 
    WHEN typical_turnaround_days IS NULL THEN 3
    ELSE typical_turnaround_days
  END,
  languages = CASE 
    WHEN languages = '{}' OR languages IS NULL THEN ARRAY['English']
    ELSE languages
  END
WHERE primary_skill IN ('Actor', 'Actress', 'Actor/Actress')
  AND (specializations = '{}' OR specializations IS NULL 
       OR years_experience IS NULL 
       OR hourly_rate_min IS NULL 
       OR typical_turnaround_days IS NULL
       OR languages = '{}' OR languages IS NULL);

-- Update Editors
UPDATE users_profile
SET
  specializations = CASE 
    WHEN specializations = '{}' OR specializations IS NULL THEN 
      ARRAY['Video Editing', 'Color Grading']
    ELSE specializations
  END,
  years_experience = CASE 
    WHEN years_experience IS NULL THEN 
      LEAST(EXTRACT(YEAR FROM AGE(NOW(), created_at))::INTEGER + 1, 5)
    ELSE years_experience
  END,
  hourly_rate_min = CASE 
    WHEN hourly_rate_min IS NULL THEN 60
    ELSE hourly_rate_min
  END,
  hourly_rate_max = CASE 
    WHEN hourly_rate_max IS NULL THEN 175
    ELSE hourly_rate_max
  END,
  typical_turnaround_days = CASE 
    WHEN typical_turnaround_days IS NULL THEN 5
    ELSE typical_turnaround_days
  END,
  languages = CASE 
    WHEN languages = '{}' OR languages IS NULL THEN ARRAY['English']
    ELSE languages
  END
WHERE primary_skill = 'Editor'
  AND (specializations = '{}' OR specializations IS NULL 
       OR years_experience IS NULL 
       OR hourly_rate_min IS NULL 
       OR typical_turnaround_days IS NULL
       OR languages = '{}' OR languages IS NULL);

-- Update Makeup Artists, Hair Stylists, Stylists
UPDATE users_profile
SET
  specializations = CASE 
    WHEN specializations = '{}' OR specializations IS NULL THEN 
      ARRAY['Commercial', 'Editorial']
    ELSE specializations
  END,
  years_experience = CASE 
    WHEN years_experience IS NULL THEN 
      LEAST(EXTRACT(YEAR FROM AGE(NOW(), created_at))::INTEGER + 1, 5)
    ELSE years_experience
  END,
  hourly_rate_min = CASE 
    WHEN hourly_rate_min IS NULL THEN 40
    ELSE hourly_rate_min
  END,
  hourly_rate_max = CASE 
    WHEN hourly_rate_max IS NULL THEN 120
    ELSE hourly_rate_max
  END,
  typical_turnaround_days = CASE 
    WHEN typical_turnaround_days IS NULL THEN 1
    ELSE typical_turnaround_days
  END,
  languages = CASE 
    WHEN languages = '{}' OR languages IS NULL THEN ARRAY['English']
    ELSE languages
  END
WHERE primary_skill IN ('Makeup Artist', 'Hair Stylist', 'Wardrobe Stylist', 'Fashion Stylist', 'Stylist')
  AND (specializations = '{}' OR specializations IS NULL 
       OR years_experience IS NULL 
       OR hourly_rate_min IS NULL 
       OR typical_turnaround_days IS NULL
       OR languages = '{}' OR languages IS NULL);

-- Update all other users with generic defaults (if primary_skill is set but fields are missing)
UPDATE users_profile
SET
  specializations = CASE 
    WHEN specializations = '{}' OR specializations IS NULL THEN 
      ARRAY['General']
    ELSE specializations
  END,
  years_experience = CASE 
    WHEN years_experience IS NULL THEN 
      LEAST(EXTRACT(YEAR FROM AGE(NOW(), created_at))::INTEGER + 1, 5)
    ELSE years_experience
  END,
  hourly_rate_min = CASE 
    WHEN hourly_rate_min IS NULL THEN 50
    ELSE hourly_rate_min
  END,
  hourly_rate_max = CASE 
    WHEN hourly_rate_max IS NULL THEN 150
    ELSE hourly_rate_max
  END,
  typical_turnaround_days = CASE 
    WHEN typical_turnaround_days IS NULL THEN 5
    ELSE typical_turnaround_days
  END,
  languages = CASE 
    WHEN languages = '{}' OR languages IS NULL THEN ARRAY['English']
    ELSE languages
  END
WHERE primary_skill IS NOT NULL
  AND primary_skill NOT IN ('Photographer', 'Videographer', 'Model', 'Actor', 'Actress', 'Actor/Actress', 'Editor', 'Makeup Artist', 'Hair Stylist', 'Wardrobe Stylist', 'Fashion Stylist', 'Stylist')
  AND (specializations = '{}' OR specializations IS NULL 
       OR years_experience IS NULL 
       OR hourly_rate_min IS NULL 
       OR typical_turnaround_days IS NULL
       OR languages = '{}' OR languages IS NULL);

-- Final verification: Show all users with their updated professional fields
SELECT 
  display_name,
  primary_skill,
  role_flags,
  specializations,
  years_experience,
  hourly_rate_min,
  hourly_rate_max,
  typical_turnaround_days,
  array_length(languages, 1) as language_count,
  profile_completion_percentage,
  updated_at
FROM users_profile
ORDER BY updated_at DESC
LIMIT 20;

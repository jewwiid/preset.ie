-- ================================================================
-- Set Primary Skills for Users Who Don't Have One
-- This will allow them to benefit from the professional fields update
-- ================================================================

-- First, check users without primary_skill
SELECT 
  user_id,
  display_name,
  primary_skill,
  role_flags,
  talent_categories,
  professional_skills
FROM users_profile
WHERE primary_skill IS NULL
  AND role_flags != ARRAY['ADMIN']::user_role[]
ORDER BY created_at DESC;

-- ================================================================
-- Strategy:
-- 1. If role_flags contains TALENT and talent_categories has values, use first talent category
-- 2. If role_flags contains CONTRIBUTOR and they have hourly rates, likely Photographer/Videographer
-- 3. Otherwise, set a generic primary_skill based on role
-- ================================================================

-- Set primary_skill for TALENT users based on their talent_categories
UPDATE users_profile
SET primary_skill = CASE
  WHEN talent_categories IS NOT NULL AND array_length(talent_categories, 1) > 0 THEN talent_categories[1]
  ELSE 'Model'  -- Default for talents without categories
END
WHERE primary_skill IS NULL
  AND role_flags && ARRAY['TALENT']::user_role[]
  AND role_flags != ARRAY['ADMIN']::user_role[];

-- Set primary_skill for CONTRIBUTOR users
-- If they have high rates (>= $200), likely experienced Photographer/Videographer
-- Otherwise, set based on account name or default to Photographer
UPDATE users_profile
SET primary_skill = CASE
  WHEN hourly_rate_min >= 200 OR hourly_rate_max >= 300 THEN 'Photographer'
  WHEN display_name ILIKE '%video%' OR display_name ILIKE '%film%' THEN 'Videographer'
  WHEN display_name ILIKE '%photo%' THEN 'Photographer'
  WHEN display_name ILIKE '%edit%' THEN 'Editor'
  ELSE 'Photographer'  -- Default for contributors
END
WHERE primary_skill IS NULL
  AND role_flags && ARRAY['CONTRIBUTOR']::user_role[]
  AND NOT (role_flags && ARRAY['TALENT']::user_role[])
  AND role_flags != ARRAY['ADMIN']::user_role[];

-- Set primary_skill for BOTH users (has both TALENT and CONTRIBUTOR flags)
UPDATE users_profile
SET primary_skill = CASE
  WHEN talent_categories IS NOT NULL AND array_length(talent_categories, 1) > 0 THEN talent_categories[1]
  ELSE 'Photographer'  -- Default for hybrid users
END
WHERE primary_skill IS NULL
  AND role_flags && ARRAY['TALENT']::user_role[]
  AND role_flags && ARRAY['CONTRIBUTOR']::user_role[]
  AND role_flags != ARRAY['ADMIN']::user_role[];

-- Verify the updates
SELECT 
  display_name,
  primary_skill,
  role_flags,
  talent_categories,
  hourly_rate_min,
  hourly_rate_max
FROM users_profile
WHERE role_flags != ARRAY['ADMIN']::user_role[]
ORDER BY updated_at DESC;

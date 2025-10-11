-- ================================================================
-- MIGRATION: Update Functions for New Schema
-- Purpose: Update database functions to use new field names
-- Date: 2025-10-11
-- Depends on: 20251011000000_simplify_role_categorization.sql
-- ================================================================

-- ================================================================
-- STEP 1: Update calculate_profile_completion function
-- ================================================================

-- Drop existing function first (parameter names might differ)
DROP FUNCTION IF EXISTS calculate_profile_completion(UUID);

CREATE OR REPLACE FUNCTION calculate_profile_completion(profile_id UUID)
RETURNS INTEGER AS $$
DECLARE
  profile_record RECORD;
  total_weight INTEGER := 0;
  completed_weight INTEGER := 0;
  field_weight INTEGER;
BEGIN
  -- Fetch the profile
  SELECT * INTO profile_record
  FROM users_profile
  WHERE id = profile_id;

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  -- Define field weights (same as before, but with new column names)
  -- Essential fields (higher weight)
  field_weight := 15;
  IF profile_record.display_name IS NOT NULL AND profile_record.display_name != '' THEN
    completed_weight := completed_weight + field_weight;
  END IF;
  total_weight := total_weight + field_weight;

  field_weight := 15;
  IF profile_record.avatar_url IS NOT NULL AND profile_record.avatar_url != '' THEN
    completed_weight := completed_weight + field_weight;
  END IF;
  total_weight := total_weight + field_weight;

  field_weight := 10;
  IF profile_record.bio IS NOT NULL AND profile_record.bio != '' THEN
    completed_weight := completed_weight + field_weight;
  END IF;
  total_weight := total_weight + field_weight;

  -- Location fields
  field_weight := 8;
  IF profile_record.city IS NOT NULL AND profile_record.city != '' THEN
    completed_weight := completed_weight + field_weight;
  END IF;
  total_weight := total_weight + field_weight;

  field_weight := 5;
  IF profile_record.country IS NOT NULL AND profile_record.country != '' THEN
    completed_weight := completed_weight + field_weight;
  END IF;
  total_weight := total_weight + field_weight;

  -- NEW: Performance roles (formerly talent_categories)
  field_weight := 12;
  IF profile_record.performance_roles IS NOT NULL AND array_length(profile_record.performance_roles, 1) > 0 THEN
    completed_weight := completed_weight + field_weight;
  END IF;
  total_weight := total_weight + field_weight;

  -- NEW: Professional skills (formerly specializations)
  field_weight := 12;
  IF profile_record.professional_skills IS NOT NULL AND array_length(profile_record.professional_skills, 1) > 0 THEN
    completed_weight := completed_weight + field_weight;
  END IF;
  total_weight := total_weight + field_weight;

  -- Primary skill/role
  field_weight := 10;
  IF profile_record.primary_skill IS NOT NULL AND profile_record.primary_skill != '' THEN
    completed_weight := completed_weight + field_weight;
  END IF;
  total_weight := total_weight + field_weight;

  -- Experience
  field_weight := 10;
  IF profile_record.years_experience IS NOT NULL AND profile_record.years_experience > 0 THEN
    completed_weight := completed_weight + field_weight;
  END IF;
  total_weight := total_weight + field_weight;

  -- Rates
  field_weight := 10;
  IF profile_record.hourly_rate_min IS NOT NULL THEN
    completed_weight := completed_weight + field_weight;
  END IF;
  total_weight := total_weight + field_weight;

  -- Calculate percentage
  IF total_weight = 0 THEN
    RETURN 0;
  END IF;

  RETURN ROUND((completed_weight::DECIMAL / total_weight::DECIMAL) * 100);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- STEP 2: Add helpful view for API/UI layer (only if needed)
-- ================================================================

-- Only create compatibility view if the columns were successfully renamed
DO $$
BEGIN
  -- Check if new columns exist (meaning migration 1 was successful)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users_profile' AND column_name = 'performance_roles'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users_profile' AND column_name = 'professional_skills'
  ) THEN
    -- Drop view if it exists
    DROP VIEW IF EXISTS users_profile_with_legacy_fields;
    
    -- Create view with explicit column selection to avoid conflicts
    EXECUTE '
      CREATE VIEW users_profile_with_legacy_fields AS
      SELECT 
        id, user_id, display_name, handle, avatar_url, bio, city, country,
        role_flags, style_tags, vibe_tags, primary_skill,
        performance_roles, professional_skills, contributor_roles,
        years_experience, account_status, profile_completion_percentage,
        verified_id, created_at, availability_status,
        performance_roles as talent_categories,  -- Alias for backward compatibility
        professional_skills as specializations    -- Alias for backward compatibility
      FROM users_profile
    ';
    
    COMMENT ON VIEW users_profile_with_legacy_fields IS 
      'Transition view that provides both new and old field names. 
       Use this during migration period, then remove once all code is updated.';
    
    -- Grant access
    GRANT SELECT ON users_profile_with_legacy_fields TO authenticated, anon;
    
    RAISE NOTICE 'Created compatibility view users_profile_with_legacy_fields';
  ELSE
    RAISE NOTICE 'Skipping compatibility view - columns not yet renamed';
  END IF;
END $$;

-- ================================================================
-- STEP 3: Update profile completion trigger
-- ================================================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_profile_completion_trigger ON users_profile;

-- Recreate trigger function with new field names
CREATE OR REPLACE FUNCTION update_profile_completion_on_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate and update profile completion percentage
  NEW.profile_completion_percentage := calculate_profile_completion(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger
CREATE TRIGGER update_profile_completion_trigger
  BEFORE INSERT OR UPDATE OF 
    display_name, avatar_url, bio, city, country,
    performance_roles,        -- NEW NAME
    professional_skills,      -- NEW NAME
    primary_skill, years_experience, hourly_rate_min
  ON users_profile
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_completion_on_change();

-- ================================================================
-- STEP 4: Create helper functions for role-based filtering
-- ================================================================

-- Drop existing functions first
DROP FUNCTION IF EXISTS get_profiles_by_performance_role(TEXT);
DROP FUNCTION IF EXISTS get_profiles_by_professional_skill(TEXT);
DROP FUNCTION IF EXISTS search_profiles(TEXT);

-- Function to get profiles by performance role
CREATE OR REPLACE FUNCTION get_profiles_by_performance_role(role_name TEXT)
RETURNS SETOF users_profile AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM users_profile
  WHERE role_flags && ARRAY['TALENT', 'BOTH']::TEXT[]
    AND performance_roles @> ARRAY[role_name]::TEXT[]
    AND account_status = 'active'
    AND profile_completion_percentage >= 50
  ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get profiles by professional skill
CREATE OR REPLACE FUNCTION get_profiles_by_professional_skill(skill_name TEXT)
RETURNS SETOF users_profile AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM users_profile
  WHERE role_flags && ARRAY['CONTRIBUTOR', 'BOTH']::TEXT[]
    AND professional_skills @> ARRAY[skill_name]::TEXT[]
    AND account_status = 'active'
    AND profile_completion_percentage >= 50
  ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- STEP 5: Update any search/filter functions
-- ================================================================

-- Create search function (already dropped above)
CREATE OR REPLACE FUNCTION search_profiles(search_term TEXT)
RETURNS SETOF users_profile AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM users_profile
  WHERE account_status = 'active'
    AND (
      display_name ILIKE '%' || search_term || '%'
      OR bio ILIKE '%' || search_term || '%'
      OR primary_skill ILIKE '%' || search_term || '%'
      OR search_term = ANY(performance_roles)
      OR search_term = ANY(professional_skills)
      OR city ILIKE '%' || search_term || '%'
    )
  ORDER BY profile_completion_percentage DESC, created_at DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- STEP 6: Grant execute permissions
-- ================================================================

GRANT EXECUTE ON FUNCTION calculate_profile_completion(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_profiles_by_performance_role(TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_profiles_by_professional_skill(TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION search_profiles(TEXT) TO authenticated, anon;

-- ================================================================
-- VERIFICATION
-- ================================================================

-- Test that functions work with new field names
-- SELECT calculate_profile_completion(id) FROM users_profile LIMIT 1;
-- SELECT * FROM get_profiles_by_performance_role('Model') LIMIT 5;
-- SELECT * FROM get_profiles_by_professional_skill('Portrait Photography') LIMIT 5;


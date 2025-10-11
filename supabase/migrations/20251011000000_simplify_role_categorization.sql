-- ================================================================
-- MIGRATION: Simplify Role Categorization System
-- Purpose: Rename confusing fields to make the system more intuitive
-- Date: 2025-10-11
-- ================================================================

/*
BEFORE (Confusing):
- talent_categories: For performers
- specializations: For technical skills  
- contributor_roles: For contributor types

AFTER (Clear):
- performance_roles: What you perform as (Model, Actor, Dancer)
- professional_skills: Services you provide (Photography, Video Editing)
- primary_role: Your main profession (single value)
*/

-- ================================================================
-- STEP 1: Rename columns in users_profile table (safely)
-- ================================================================

-- Check if we need to rename talent_categories → performance_roles
DO $$ 
BEGIN
  -- Only rename if old column exists and new column doesn't
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users_profile' AND column_name = 'talent_categories'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users_profile' AND column_name = 'performance_roles'
  ) THEN
    ALTER TABLE users_profile RENAME COLUMN talent_categories TO performance_roles;
    RAISE NOTICE 'Renamed talent_categories to performance_roles';
  ELSE
    RAISE NOTICE 'Column performance_roles already exists or talent_categories does not exist';
  END IF;
END $$;

-- Check if we need to rename specializations → professional_skills
DO $$ 
BEGIN
  -- Only rename if old column exists and new column doesn't
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users_profile' AND column_name = 'specializations'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users_profile' AND column_name = 'professional_skills'
  ) THEN
    ALTER TABLE users_profile RENAME COLUMN specializations TO professional_skills;
    RAISE NOTICE 'Renamed specializations to professional_skills';
  ELSE
    RAISE NOTICE 'Column professional_skills already exists or specializations does not exist';
  END IF;
END $$;

-- Keep contributor_roles as is (it's clear enough)
-- Keep primary_skill → primary_role will happen in next migration if needed

-- ================================================================
-- STEP 2: Update column comments for clarity
-- ================================================================

COMMENT ON COLUMN users_profile.performance_roles IS 'Roles user performs (e.g., Model, Actor, Dancer). Only for users with TALENT role. Used in /models, /actors pages.';

COMMENT ON COLUMN users_profile.professional_skills IS 'Professional services user provides (e.g., Portrait Photography, Video Editing). Only for users with CONTRIBUTOR role. Used in /photographers, /videographers pages.';

COMMENT ON COLUMN users_profile.contributor_roles IS 'High-level contributor categories (e.g., Photographer, Videographer). Deprecated - use professional_skills instead.';

COMMENT ON COLUMN users_profile.primary_skill IS 'User primary profession or role. Shown prominently on profile.';

-- ================================================================
-- STEP 3: Rename predefined tables for consistency (safely)
-- ================================================================

-- Rename predefined_talent_categories → predefined_performance_roles
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'predefined_talent_categories'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'predefined_performance_roles'
  ) THEN
    ALTER TABLE predefined_talent_categories RENAME TO predefined_performance_roles;
    RAISE NOTICE 'Renamed table predefined_talent_categories to predefined_performance_roles';
  ELSE
    RAISE NOTICE 'Table predefined_performance_roles already exists or predefined_talent_categories does not exist';
  END IF;
END $$;

-- Update column names in the renamed table (category_name → role_name)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'predefined_performance_roles' AND column_name = 'category_name'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'predefined_performance_roles' AND column_name = 'role_name'
  ) THEN
    ALTER TABLE predefined_performance_roles RENAME COLUMN category_name TO role_name;
    RAISE NOTICE 'Renamed column category_name to role_name';
  ELSE
    RAISE NOTICE 'Column role_name already exists or category_name does not exist';
  END IF;
END $$;

-- Rename specializations → predefined_professional_skills
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'specializations'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'predefined_professional_skills'
  ) THEN
    ALTER TABLE specializations RENAME TO predefined_professional_skills;
    RAISE NOTICE 'Renamed table specializations to predefined_professional_skills';
  ELSE
    RAISE NOTICE 'Table predefined_professional_skills already exists or specializations does not exist';
  END IF;
END $$;

-- Update column names (name → skill_name)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'predefined_professional_skills' AND column_name = 'name'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'predefined_professional_skills' AND column_name = 'skill_name'
  ) THEN
    ALTER TABLE predefined_professional_skills RENAME COLUMN name TO skill_name;
    RAISE NOTICE 'Renamed column name to skill_name';
  ELSE
    RAISE NOTICE 'Column skill_name already exists or name does not exist';
  END IF;
END $$;

-- Keep predefined_roles as is (for primary_role selection)

-- ================================================================
-- STEP 4: Update indexes with new names
-- ================================================================

-- Drop old indexes
DROP INDEX IF EXISTS idx_predefined_talent_categories_active;
DROP INDEX IF EXISTS idx_predefined_talent_categories_sort;
DROP INDEX IF EXISTS idx_specializations_category;
DROP INDEX IF EXISTS idx_specializations_active;
DROP INDEX IF EXISTS idx_specializations_sort_order;

-- Create new indexes with updated names
CREATE INDEX IF NOT EXISTS idx_predefined_performance_roles_active 
  ON predefined_performance_roles(is_active);
  
CREATE INDEX IF NOT EXISTS idx_predefined_performance_roles_sort 
  ON predefined_performance_roles(sort_order);

CREATE INDEX IF NOT EXISTS idx_predefined_professional_skills_category 
  ON predefined_professional_skills(category);
  
CREATE INDEX IF NOT EXISTS idx_predefined_professional_skills_active 
  ON predefined_professional_skills(is_active);
  
CREATE INDEX IF NOT EXISTS idx_predefined_professional_skills_sort 
  ON predefined_professional_skills(sort_order);

-- ================================================================
-- STEP 5: Update RLS policies with new table names (safely)
-- ================================================================

-- Drop all possible old and new policy names for predefined_performance_roles
DROP POLICY IF EXISTS "predefined_talent_categories_read_all" ON predefined_performance_roles;
DROP POLICY IF EXISTS "predefined_talent_categories_read_authenticated" ON predefined_performance_roles;
DROP POLICY IF EXISTS "Anyone can read active performance roles" ON predefined_performance_roles;
DROP POLICY IF EXISTS "Authenticated users can read all performance roles" ON predefined_performance_roles;

-- Drop all possible old and new policy names for predefined_professional_skills
DROP POLICY IF EXISTS "Anyone can read active specializations" ON predefined_professional_skills;
DROP POLICY IF EXISTS "Anyone can read active professional skills" ON predefined_professional_skills;
DROP POLICY IF EXISTS "Authenticated users can read all professional skills" ON predefined_professional_skills;

-- Create new policies (now safe since we dropped them all)
CREATE POLICY "Anyone can read active performance roles" 
  ON predefined_performance_roles
  FOR SELECT USING (is_active = true);

CREATE POLICY "Authenticated users can read all performance roles" 
  ON predefined_performance_roles
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Anyone can read active professional skills" 
  ON predefined_professional_skills
  FOR SELECT USING (is_active = true);

CREATE POLICY "Authenticated users can read all professional skills" 
  ON predefined_professional_skills
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- ================================================================
-- STEP 6: Update table comments
-- ================================================================

COMMENT ON TABLE predefined_performance_roles IS 
  'Performance roles for TALENT users (e.g., Model, Actor, Dancer, Musician). 
   These are what users perform AS, not services they provide.
   Used to populate performance_roles array in users_profile.';

COMMENT ON TABLE predefined_professional_skills IS 
  'Professional skills/services for CONTRIBUTOR users (e.g., Portrait Photography, Video Editing). 
   These are services users PROVIDE, not what they perform as.
   Used to populate professional_skills array in users_profile.';

COMMENT ON COLUMN predefined_performance_roles.role_name IS 
  'Name of the performance role (e.g., Model, Actor, Dancer)';

COMMENT ON COLUMN predefined_professional_skills.skill_name IS 
  'Name of the professional skill or service (e.g., Portrait Photography)';

-- ================================================================
-- STEP 7: Grant permissions on renamed tables
-- ================================================================

GRANT SELECT ON predefined_performance_roles TO authenticated, anon;
GRANT SELECT ON predefined_professional_skills TO authenticated, anon;

-- ================================================================
-- STEP 8: Update any functions that reference old column names
-- ================================================================

-- Note: Any functions that reference talent_categories or specializations
-- will need to be updated separately. Common places to check:
-- - calculate_profile_completion()
-- - matchmaking functions
-- - search functions

-- ================================================================
-- VERIFICATION QUERIES (Comment out in production)
-- ================================================================

-- Verify column renames
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'users_profile'
--   AND column_name IN ('performance_roles', 'professional_skills', 'contributor_roles', 'primary_skill')
-- ORDER BY column_name;

-- Verify table renames
-- SELECT table_name
-- FROM information_schema.tables
-- WHERE table_schema = 'public'
--   AND table_name IN ('predefined_performance_roles', 'predefined_professional_skills', 'predefined_roles')
-- ORDER BY table_name;

-- Check data integrity (make sure no data was lost)
-- SELECT 
--   COUNT(*) as total_profiles,
--   COUNT(performance_roles) as with_performance_roles,
--   COUNT(professional_skills) as with_professional_skills,
--   COUNT(CASE WHEN array_length(performance_roles, 1) > 0 THEN 1 END) as non_empty_performance,
--   COUNT(CASE WHEN array_length(professional_skills, 1) > 0 THEN 1 END) as non_empty_skills
-- FROM users_profile;


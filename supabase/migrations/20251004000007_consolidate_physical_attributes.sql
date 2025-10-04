-- Consolidate physical attribute fields
-- This migration doesn't change the database schema, just documents the proper organization
-- All physical attribute fields should be accessed through TalentSpecificSection in the UI

-- PHYSICAL ATTRIBUTES (Talent-Specific Section) - Already exist in database
-- These fields were added in migration 035_enhanced_profile_fields.sql:
-- - height_cm (INTEGER)
-- - eye_color (VARCHAR(30))
-- - hair_color (VARCHAR(30))
-- - tattoos (BOOLEAN)
-- - piercings (BOOLEAN)

-- NEW PHYSICAL ATTRIBUTES (added in migration 20251004000001):
-- - weight_kg (INTEGER)
-- - body_type (VARCHAR(50))
-- - hair_length (VARCHAR(50))
-- - skin_tone (VARCHAR(50))

-- DEMOGRAPHICS (Demographics Section) - Identity & Location only
-- These fields should remain in Demographics section:
-- - gender_identity
-- - ethnicity
-- - nationality
-- - city, country, state_province, timezone
-- - date_of_birth, show_age
-- - experience_level, availability_status
-- - preferred_working_hours
-- - passport_valid

-- Update column comments to reflect proper UI section organization
COMMENT ON COLUMN users_profile.height_cm IS 'Physical attribute: Height in centimeters (Talent-Specific section)';
COMMENT ON COLUMN users_profile.weight_kg IS 'Physical attribute: Weight in kilograms (Talent-Specific section)';
COMMENT ON COLUMN users_profile.eye_color IS 'Physical attribute: Eye color (Talent-Specific section)';
COMMENT ON COLUMN users_profile.hair_color IS 'Physical attribute: Hair color (Talent-Specific section)';
COMMENT ON COLUMN users_profile.hair_length IS 'Physical attribute: Hair length (Talent-Specific section)';
COMMENT ON COLUMN users_profile.skin_tone IS 'Physical attribute: Skin tone (Talent-Specific section)';
COMMENT ON COLUMN users_profile.body_type IS 'Physical attribute: Body type classification (Talent-Specific section)';
COMMENT ON COLUMN users_profile.tattoos IS 'Physical attribute: Has tattoos (Talent-Specific section)';
COMMENT ON COLUMN users_profile.piercings IS 'Physical attribute: Has piercings (Talent-Specific section)';

-- Demographics fields
COMMENT ON COLUMN users_profile.gender_identity IS 'Demographics: Gender identity (Demographics section)';
COMMENT ON COLUMN users_profile.ethnicity IS 'Demographics: Ethnicity (Demographics section)';
COMMENT ON COLUMN users_profile.nationality IS 'Demographics: Nationality (Demographics section)';
COMMENT ON COLUMN users_profile.experience_level IS 'Professional: Experience level (Demographics section)';
COMMENT ON COLUMN users_profile.availability_status IS 'Professional: Current availability status (Demographics section)';

-- Note: This is a documentation-only migration
-- Frontend components need to be updated to reflect this organization:
-- 1. TalentSpecificSection should include: height, weight, eye_color, hair_color, hair_length, skin_tone, body_type, tattoos, piercings
-- 2. DemographicsSection should include: gender_identity, ethnicity, nationality, location, professional info

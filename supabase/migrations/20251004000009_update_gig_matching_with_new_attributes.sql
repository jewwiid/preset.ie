-- Update gig matching to use new physical attributes
-- This replaces the existing calculate_gig_compatibility_with_preferences function
-- with enhanced matching for all new demographic and physical fields

-- Ensure applicant_preferences column exists in gigs table
ALTER TABLE gigs
ADD COLUMN IF NOT EXISTS applicant_preferences JSONB DEFAULT '{}';

-- Create index if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_gigs_preferences ON gigs USING GIN (applicant_preferences);

-- Add comment
COMMENT ON COLUMN gigs.applicant_preferences IS 'Enhanced JSON structure for applicant matching with all new attributes including physical (height, eye/hair color/length, skin tone, body type, tattoos, piercings), demographics (gender, ethnicity, nationality), professional (experience, specializations), and work preferences (TFP, location type, schedule). See migration 20251004000009 and GIG_PREFERENCES_SCHEMA.md for full structure.';

-- Drop the old function
DROP FUNCTION IF EXISTS calculate_gig_compatibility_with_preferences(UUID, UUID);

-- Create enhanced gig compatibility function with all new attributes
CREATE OR REPLACE FUNCTION calculate_gig_compatibility_with_preferences(
    p_profile_id UUID,
    p_gig_id UUID
) RETURNS TABLE (
    score DECIMAL(5,2),
    breakdown JSONB,
    matched_attributes TEXT[],
    missing_requirements TEXT[]
) AS $$
DECLARE
    v_score DECIMAL(5,2) := 0;
    v_breakdown JSONB := '{}';
    v_matched TEXT[] := ARRAY[]::TEXT[];
    v_missing TEXT[] := ARRAY[]::TEXT[];
    v_profile RECORD;
    v_gig RECORD;
    v_preferences JSONB;
    v_physical_score DECIMAL(5,2) := 0;
    v_professional_score DECIMAL(5,2) := 0;
    v_availability_score DECIMAL(5,2) := 0;
    v_demographic_score DECIMAL(5,2) := 0;
    v_total_possible DECIMAL(5,2) := 0;
BEGIN
    -- Get profile data with ALL new fields
    SELECT
        height_cm, weight_kg, eye_color, hair_color, hair_length,
        skin_tone, body_type, tattoos, piercings,
        gender_identity, ethnicity, nationality,
        years_experience, specializations, equipment_list,
        available_for_travel, hourly_rate_min, hourly_rate_max,
        experience_level, availability_status,
        available_weekdays, available_weekends, available_evenings,
        accepts_tfp, accepts_expenses_only,
        prefers_studio, prefers_outdoor
    INTO v_profile
    FROM users_profile
    WHERE id = p_profile_id;

    -- Get gig data with preferences
    SELECT * INTO v_gig
    FROM gigs
    WHERE id = p_gig_id;

    -- Return 0 if either doesn't exist
    IF v_profile IS NULL OR v_gig IS NULL THEN
        RETURN QUERY SELECT
            0.0::DECIMAL(5,2),
            '{}'::JSONB,
            ARRAY[]::TEXT[],
            ARRAY['Profile or gig not found']::TEXT[];
        RETURN;
    END IF;

    -- Get preferences (default to empty object if null)
    v_preferences := COALESCE(v_gig.applicant_preferences, '{}'::JSONB);

    -- Base score for everyone (20 points)
    v_score := 20.0;
    v_total_possible := 20.0;

    -- ============================================
    -- PHYSICAL ATTRIBUTES MATCHING (35 points possible)
    -- ============================================
    IF v_preferences ? 'physical' THEN
        -- Height range (10 points)
        IF v_preferences->'physical' ? 'height_range' THEN
            v_total_possible := v_total_possible + 10.0;
            DECLARE
                min_height INTEGER := (v_preferences->'physical'->'height_range'->>'min')::INTEGER;
                max_height INTEGER := (v_preferences->'physical'->'height_range'->>'max')::INTEGER;
            BEGIN
                IF v_profile.height_cm IS NULL THEN
                    v_missing := array_append(v_missing, 'height');
                ELSIF (min_height IS NULL OR v_profile.height_cm >= min_height) AND
                      (max_height IS NULL OR v_profile.height_cm <= max_height) THEN
                    v_physical_score := v_physical_score + 10.0;
                    v_matched := array_append(v_matched, format('Height: %s cm', v_profile.height_cm));
                END IF;
            END;
        END IF;

        -- Eye color (5 points)
        IF v_preferences->'physical' ? 'eye_colors' THEN
            v_total_possible := v_total_possible + 5.0;
            DECLARE
                required_colors TEXT[] := ARRAY(SELECT jsonb_array_elements_text(v_preferences->'physical'->'eye_colors'));
            BEGIN
                IF v_profile.eye_color IS NULL THEN
                    v_missing := array_append(v_missing, 'eye_color');
                ELSIF v_profile.eye_color = ANY(required_colors) THEN
                    v_physical_score := v_physical_score + 5.0;
                    v_matched := array_append(v_matched, format('Eye color: %s', v_profile.eye_color));
                END IF;
            END;
        END IF;

        -- Hair color (5 points)
        IF v_preferences->'physical' ? 'hair_colors' THEN
            v_total_possible := v_total_possible + 5.0;
            DECLARE
                required_colors TEXT[] := ARRAY(SELECT jsonb_array_elements_text(v_preferences->'physical'->'hair_colors'));
            BEGIN
                IF v_profile.hair_color IS NULL THEN
                    v_missing := array_append(v_missing, 'hair_color');
                ELSIF v_profile.hair_color = ANY(required_colors) THEN
                    v_physical_score := v_physical_score + 5.0;
                    v_matched := array_append(v_matched, format('Hair color: %s', v_profile.hair_color));
                END IF;
            END;
        END IF;

        -- Hair length (3 points) - NEW
        IF v_preferences->'physical' ? 'hair_lengths' THEN
            v_total_possible := v_total_possible + 3.0;
            DECLARE
                required_lengths TEXT[] := ARRAY(SELECT jsonb_array_elements_text(v_preferences->'physical'->'hair_lengths'));
            BEGIN
                IF v_profile.hair_length IS NULL THEN
                    v_missing := array_append(v_missing, 'hair_length');
                ELSIF v_profile.hair_length = ANY(required_lengths) THEN
                    v_physical_score := v_physical_score + 3.0;
                    v_matched := array_append(v_matched, format('Hair length: %s', v_profile.hair_length));
                END IF;
            END;
        END IF;

        -- Skin tone (3 points) - NEW
        IF v_preferences->'physical' ? 'skin_tones' THEN
            v_total_possible := v_total_possible + 3.0;
            DECLARE
                required_tones TEXT[] := ARRAY(SELECT jsonb_array_elements_text(v_preferences->'physical'->'skin_tones'));
            BEGIN
                IF v_profile.skin_tone IS NULL THEN
                    v_missing := array_append(v_missing, 'skin_tone');
                ELSIF v_profile.skin_tone = ANY(required_tones) THEN
                    v_physical_score := v_physical_score + 3.0;
                    v_matched := array_append(v_matched, format('Skin tone: %s', v_profile.skin_tone));
                END IF;
            END;
        END IF;

        -- Body type (4 points) - NEW
        IF v_preferences->'physical' ? 'body_types' THEN
            v_total_possible := v_total_possible + 4.0;
            DECLARE
                required_types TEXT[] := ARRAY(SELECT jsonb_array_elements_text(v_preferences->'physical'->'body_types'));
            BEGIN
                IF v_profile.body_type IS NULL THEN
                    v_missing := array_append(v_missing, 'body_type');
                ELSIF v_profile.body_type = ANY(required_types) THEN
                    v_physical_score := v_physical_score + 4.0;
                    v_matched := array_append(v_matched, format('Body type: %s', v_profile.body_type));
                END IF;
            END;
        END IF;

        -- Tattoos (3 points)
        IF v_preferences->'physical' ? 'tattoos_allowed' THEN
            v_total_possible := v_total_possible + 3.0;
            IF (v_preferences->'physical'->>'tattoos_allowed')::BOOLEAN = true OR
               v_profile.tattoos = false THEN
                v_physical_score := v_physical_score + 3.0;
                v_matched := array_append(v_matched,
                    CASE WHEN v_profile.tattoos THEN 'Has tattoos (allowed)' ELSE 'No tattoos' END);
            END IF;
        END IF;

        -- Piercings (2 points)
        IF v_preferences->'physical' ? 'piercings_allowed' THEN
            v_total_possible := v_total_possible + 2.0;
            IF (v_preferences->'physical'->>'piercings_allowed')::BOOLEAN = true OR
               v_profile.piercings = false THEN
                v_physical_score := v_physical_score + 2.0;
                v_matched := array_append(v_matched,
                    CASE WHEN v_profile.piercings THEN 'Has piercings (allowed)' ELSE 'No piercings' END);
            END IF;
        END IF;
    END IF;

    -- ============================================
    -- DEMOGRAPHIC MATCHING (15 points possible) - NEW
    -- ============================================
    IF v_preferences ? 'demographics' THEN
        -- Gender identity (8 points)
        IF v_preferences->'demographics' ? 'gender_identities' THEN
            v_total_possible := v_total_possible + 8.0;
            DECLARE
                required_genders TEXT[] := ARRAY(SELECT jsonb_array_elements_text(v_preferences->'demographics'->'gender_identities'));
            BEGIN
                IF v_profile.gender_identity IS NULL THEN
                    v_missing := array_append(v_missing, 'gender_identity');
                ELSIF v_profile.gender_identity = ANY(required_genders) THEN
                    v_demographic_score := v_demographic_score + 8.0;
                    v_matched := array_append(v_matched, format('Gender: %s', v_profile.gender_identity));
                END IF;
            END;
        END IF;

        -- Ethnicity (4 points)
        IF v_preferences->'demographics' ? 'ethnicities' THEN
            v_total_possible := v_total_possible + 4.0;
            DECLARE
                required_ethnicities TEXT[] := ARRAY(SELECT jsonb_array_elements_text(v_preferences->'demographics'->'ethnicities'));
            BEGIN
                IF v_profile.ethnicity IS NULL THEN
                    v_missing := array_append(v_missing, 'ethnicity');
                ELSIF v_profile.ethnicity = ANY(required_ethnicities) THEN
                    v_demographic_score := v_demographic_score + 4.0;
                    v_matched := array_append(v_matched, format('Ethnicity: %s', v_profile.ethnicity));
                END IF;
            END;
        END IF;

        -- Nationality (3 points)
        IF v_preferences->'demographics' ? 'nationalities' THEN
            v_total_possible := v_total_possible + 3.0;
            DECLARE
                required_nationalities TEXT[] := ARRAY(SELECT jsonb_array_elements_text(v_preferences->'demographics'->'nationalities'));
            BEGIN
                IF v_profile.nationality IS NULL THEN
                    v_missing := array_append(v_missing, 'nationality');
                ELSIF v_profile.nationality = ANY(required_nationalities) THEN
                    v_demographic_score := v_demographic_score + 3.0;
                    v_matched := array_append(v_matched, format('Nationality: %s', v_profile.nationality));
                END IF;
            END;
        END IF;
    END IF;

    -- ============================================
    -- PROFESSIONAL PREFERENCES (20 points possible)
    -- ============================================
    IF v_preferences ? 'professional' THEN
        -- Experience level (8 points) - NEW
        IF v_preferences->'professional' ? 'experience_levels' THEN
            v_total_possible := v_total_possible + 8.0;
            DECLARE
                required_levels TEXT[] := ARRAY(SELECT jsonb_array_elements_text(v_preferences->'professional'->'experience_levels'));
            BEGIN
                IF v_profile.experience_level IS NULL THEN
                    v_missing := array_append(v_missing, 'experience_level');
                ELSIF v_profile.experience_level = ANY(required_levels) THEN
                    v_professional_score := v_professional_score + 8.0;
                    v_matched := array_append(v_matched, format('Experience: %s', v_profile.experience_level));
                END IF;
            END;
        END IF;

        -- Specializations (12 points)
        IF v_preferences->'professional' ? 'specializations' THEN
            v_total_possible := v_total_possible + 12.0;
            IF v_profile.specializations IS NOT NULL AND array_length(v_profile.specializations, 1) > 0 THEN
                DECLARE
                    required_specs JSONB := v_preferences->'professional'->'specializations';
                    match_count INTEGER := 0;
                    total_required INTEGER := jsonb_array_length(required_specs);
                BEGIN
                    FOR i IN 0..total_required-1 LOOP
                        IF (required_specs->>i) = ANY(v_profile.specializations) THEN
                            match_count := match_count + 1;
                        END IF;
                    END LOOP;

                    IF total_required > 0 THEN
                        v_professional_score := v_professional_score + (12.0 * match_count / total_required);
                        v_matched := array_append(v_matched, format('%s/%s specializations match', match_count, total_required));
                    END IF;
                END;
            ELSE
                v_missing := array_append(v_missing, 'specializations');
            END IF;
        END IF;
    END IF;

    -- ============================================
    -- WORK PREFERENCES (10 points possible) - NEW
    -- ============================================
    IF v_preferences ? 'work_preferences' THEN
        -- TFP acceptance (3 points)
        IF v_preferences->'work_preferences' ? 'accepts_tfp' THEN
            v_total_possible := v_total_possible + 3.0;
            IF (v_preferences->'work_preferences'->>'accepts_tfp')::BOOLEAN = v_profile.accepts_tfp THEN
                v_availability_score := v_availability_score + 3.0;
                v_matched := array_append(v_matched, 'TFP preference matches');
            END IF;
        END IF;

        -- Location preference (studio/outdoor) (4 points)
        IF v_preferences->'work_preferences' ? 'location_type' THEN
            v_total_possible := v_total_possible + 4.0;
            DECLARE
                pref_location TEXT := v_preferences->'work_preferences'->>'location_type';
            BEGIN
                IF (pref_location = 'studio' AND v_profile.prefers_studio = true) OR
                   (pref_location = 'outdoor' AND v_profile.prefers_outdoor = true) THEN
                    v_availability_score := v_availability_score + 4.0;
                    v_matched := array_append(v_matched, format('Prefers %s work', pref_location));
                END IF;
            END;
        END IF;

        -- Schedule availability (3 points)
        IF v_preferences->'work_preferences' ? 'schedule' THEN
            v_total_possible := v_total_possible + 3.0;
            DECLARE
                schedule TEXT := v_preferences->'work_preferences'->>'schedule';
            BEGIN
                IF (schedule = 'weekdays' AND v_profile.available_weekdays = true) OR
                   (schedule = 'weekends' AND v_profile.available_weekends = true) OR
                   (schedule = 'evenings' AND v_profile.available_evenings = true) THEN
                    v_availability_score := v_availability_score + 3.0;
                    v_matched := array_append(v_matched, format('Available %s', schedule));
                END IF;
            END;
        END IF;
    END IF;

    -- Calculate final percentage score
    IF v_total_possible > 0 THEN
        v_score := ROUND((v_score + v_physical_score + v_demographic_score + v_professional_score + v_availability_score) / v_total_possible * 100, 2);
    ELSE
        v_score := 100.0; -- No requirements, everyone matches
    END IF;

    -- Build breakdown
    v_breakdown := jsonb_build_object(
        'total_score', v_score,
        'components', jsonb_build_object(
            'base', 20.0,
            'physical', v_physical_score,
            'demographics', v_demographic_score,
            'professional', v_professional_score,
            'availability', v_availability_score
        ),
        'total_possible', v_total_possible,
        'matched_count', array_length(v_matched, 1),
        'missing_count', array_length(v_missing, 1)
    );

    RETURN QUERY SELECT v_score, v_breakdown, v_matched, v_missing;
END;
$$ LANGUAGE plpgsql;

-- Update comment
COMMENT ON FUNCTION calculate_gig_compatibility_with_preferences IS 'Enhanced gig compatibility matching with all physical attributes, demographics, work preferences (height, eye/hair color/length, skin tone, body type, gender, ethnicity, nationality, experience level, TFP acceptance, location preference, schedule)';

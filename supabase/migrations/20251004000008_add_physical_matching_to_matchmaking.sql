-- Add physical attribute matching to matchmaking algorithms
-- This enhances talent/modeling gig matching with appearance requirements

-- Function to calculate physical attribute compatibility for talent/modeling gigs
CREATE OR REPLACE FUNCTION calculate_physical_attribute_match(
    p_profile_id UUID,
    p_gig_requirements JSONB
) RETURNS TABLE (
    score DECIMAL(5,2),
    matched_attributes TEXT[],
    missing_attributes TEXT[],
    mismatch_reasons TEXT[]
) AS $$
DECLARE
    v_score DECIMAL(5,2) := 100.0; -- Start at perfect match
    v_matched TEXT[] := ARRAY[]::TEXT[];
    v_missing TEXT[] := ARRAY[]::TEXT[];
    v_mismatches TEXT[] := ARRAY[]::TEXT[];
    v_profile RECORD;
    v_total_checks INTEGER := 0;
    v_passed_checks INTEGER := 0;
BEGIN
    -- Get user profile with physical attributes
    SELECT
        height_cm, weight_kg, eye_color, hair_color, hair_length,
        skin_tone, body_type, tattoos, piercings, gender_identity
    INTO v_profile
    FROM users_profile
    WHERE id = p_profile_id;

    IF v_profile IS NULL THEN
        RETURN QUERY SELECT 0.0::DECIMAL(5,2),
            ARRAY[]::TEXT[], ARRAY[]::TEXT[], ARRAY['Profile not found']::TEXT[];
        RETURN;
    END IF;

    -- Check height requirements (if specified)
    IF p_gig_requirements ? 'height_range' THEN
        v_total_checks := v_total_checks + 1;
        DECLARE
            v_min_height INTEGER := (p_gig_requirements->'height_range'->>'min')::INTEGER;
            v_max_height INTEGER := (p_gig_requirements->'height_range'->>'max')::INTEGER;
        BEGIN
            IF v_profile.height_cm IS NULL THEN
                v_missing := array_append(v_missing, 'height');
                v_score := v_score - 15.0;
            ELSIF (v_min_height IS NULL OR v_profile.height_cm >= v_min_height) AND
                  (v_max_height IS NULL OR v_profile.height_cm <= v_max_height) THEN
                v_matched := array_append(v_matched, format('Height: %s cm', v_profile.height_cm));
                v_passed_checks := v_passed_checks + 1;
            ELSE
                v_mismatches := array_append(v_mismatches,
                    format('Height %s cm outside range %s-%s cm',
                        v_profile.height_cm, v_min_height, v_max_height));
                v_score := v_score - 20.0;
            END IF;
        END;
    END IF;

    -- Check eye color requirements (if specified)
    IF p_gig_requirements ? 'eye_colors' THEN
        v_total_checks := v_total_checks + 1;
        DECLARE
            v_required_eye_colors TEXT[] := ARRAY(SELECT jsonb_array_elements_text(p_gig_requirements->'eye_colors'));
        BEGIN
            IF v_profile.eye_color IS NULL THEN
                v_missing := array_append(v_missing, 'eye_color');
                v_score := v_score - 10.0;
            ELSIF v_profile.eye_color = ANY(v_required_eye_colors) THEN
                v_matched := array_append(v_matched, format('Eye color: %s', v_profile.eye_color));
                v_passed_checks := v_passed_checks + 1;
            ELSE
                v_mismatches := array_append(v_mismatches,
                    format('Eye color %s not in required colors', v_profile.eye_color));
                v_score := v_score - 15.0;
            END IF;
        END;
    END IF;

    -- Check hair color requirements (if specified)
    IF p_gig_requirements ? 'hair_colors' THEN
        v_total_checks := v_total_checks + 1;
        DECLARE
            v_required_hair_colors TEXT[] := ARRAY(SELECT jsonb_array_elements_text(p_gig_requirements->'hair_colors'));
        BEGIN
            IF v_profile.hair_color IS NULL THEN
                v_missing := array_append(v_missing, 'hair_color');
                v_score := v_score - 10.0;
            ELSIF v_profile.hair_color = ANY(v_required_hair_colors) THEN
                v_matched := array_append(v_matched, format('Hair color: %s', v_profile.hair_color));
                v_passed_checks := v_passed_checks + 1;
            ELSE
                v_mismatches := array_append(v_mismatches,
                    format('Hair color %s not in required colors', v_profile.hair_color));
                v_score := v_score - 15.0;
            END IF;
        END;
    END IF;

    -- Check hair length requirements (if specified)
    IF p_gig_requirements ? 'hair_lengths' THEN
        v_total_checks := v_total_checks + 1;
        DECLARE
            v_required_hair_lengths TEXT[] := ARRAY(SELECT jsonb_array_elements_text(p_gig_requirements->'hair_lengths'));
        BEGIN
            IF v_profile.hair_length IS NULL THEN
                v_missing := array_append(v_missing, 'hair_length');
                v_score := v_score - 8.0;
            ELSIF v_profile.hair_length = ANY(v_required_hair_lengths) THEN
                v_matched := array_append(v_matched, format('Hair length: %s', v_profile.hair_length));
                v_passed_checks := v_passed_checks + 1;
            ELSE
                v_mismatches := array_append(v_mismatches,
                    format('Hair length %s not in required lengths', v_profile.hair_length));
                v_score := v_score - 12.0;
            END IF;
        END;
    END IF;

    -- Check skin tone requirements (if specified)
    IF p_gig_requirements ? 'skin_tones' THEN
        v_total_checks := v_total_checks + 1;
        DECLARE
            v_required_skin_tones TEXT[] := ARRAY(SELECT jsonb_array_elements_text(p_gig_requirements->'skin_tones'));
        BEGIN
            IF v_profile.skin_tone IS NULL THEN
                v_missing := array_append(v_missing, 'skin_tone');
                v_score := v_score - 8.0;
            ELSIF v_profile.skin_tone = ANY(v_required_skin_tones) THEN
                v_matched := array_append(v_matched, format('Skin tone: %s', v_profile.skin_tone));
                v_passed_checks := v_passed_checks + 1;
            ELSE
                v_mismatches := array_append(v_mismatches,
                    format('Skin tone %s not in required tones', v_profile.skin_tone));
                v_score := v_score - 12.0;
            END IF;
        END;
    END IF;

    -- Check body type requirements (if specified)
    IF p_gig_requirements ? 'body_types' THEN
        v_total_checks := v_total_checks + 1;
        DECLARE
            v_required_body_types TEXT[] := ARRAY(SELECT jsonb_array_elements_text(p_gig_requirements->'body_types'));
        BEGIN
            IF v_profile.body_type IS NULL THEN
                v_missing := array_append(v_missing, 'body_type');
                v_score := v_score - 10.0;
            ELSIF v_profile.body_type = ANY(v_required_body_types) THEN
                v_matched := array_append(v_matched, format('Body type: %s', v_profile.body_type));
                v_passed_checks := v_passed_checks + 1;
            ELSE
                v_mismatches := array_append(v_mismatches,
                    format('Body type %s not in required types', v_profile.body_type));
                v_score := v_score - 15.0;
            END IF;
        END;
    END IF;

    -- Check gender identity requirements (if specified)
    IF p_gig_requirements ? 'gender_identities' THEN
        v_total_checks := v_total_checks + 1;
        DECLARE
            v_required_genders TEXT[] := ARRAY(SELECT jsonb_array_elements_text(p_gig_requirements->'gender_identities'));
        BEGIN
            IF v_profile.gender_identity IS NULL THEN
                v_missing := array_append(v_missing, 'gender_identity');
                v_score := v_score - 10.0;
            ELSIF v_profile.gender_identity = ANY(v_required_genders) THEN
                v_matched := array_append(v_matched, format('Gender: %s', v_profile.gender_identity));
                v_passed_checks := v_passed_checks + 1;
            ELSE
                v_mismatches := array_append(v_mismatches,
                    format('Gender identity %s not in required identities', v_profile.gender_identity));
                v_score := v_score - 20.0;
            END IF;
        END;
    END IF;

    -- Check tattoo restrictions (if specified)
    IF p_gig_requirements ? 'tattoos_allowed' THEN
        v_total_checks := v_total_checks + 1;
        DECLARE
            v_tattoos_allowed BOOLEAN := (p_gig_requirements->>'tattoos_allowed')::BOOLEAN;
        BEGIN
            IF v_tattoos_allowed = false AND v_profile.tattoos = true THEN
                v_mismatches := array_append(v_mismatches, 'Has tattoos but tattoos not allowed');
                v_score := v_score - 25.0;
            ELSIF v_tattoos_allowed = true OR v_profile.tattoos = false THEN
                v_matched := array_append(v_matched,
                    CASE WHEN v_profile.tattoos THEN 'Has tattoos (allowed)' ELSE 'No tattoos' END);
                v_passed_checks := v_passed_checks + 1;
            END IF;
        END;
    END IF;

    -- Check piercing restrictions (if specified)
    IF p_gig_requirements ? 'piercings_allowed' THEN
        v_total_checks := v_total_checks + 1;
        DECLARE
            v_piercings_allowed BOOLEAN := (p_gig_requirements->>'piercings_allowed')::BOOLEAN;
        BEGIN
            IF v_piercings_allowed = false AND v_profile.piercings = true THEN
                v_mismatches := array_append(v_mismatches, 'Has piercings but piercings not allowed');
                v_score := v_score - 20.0;
            ELSIF v_piercings_allowed = true OR v_profile.piercings = false THEN
                v_matched := array_append(v_matched,
                    CASE WHEN v_profile.piercings THEN 'Has piercings (allowed)' ELSE 'No piercings' END);
                v_passed_checks := v_passed_checks + 1;
            END IF;
        END;
    END IF;

    -- Ensure score doesn't go below 0
    v_score := GREATEST(v_score, 0.0);

    RETURN QUERY SELECT v_score, v_matched, v_missing, v_mismatches;
END;
$$ LANGUAGE plpgsql;

-- Update the enhanced collaboration compatibility to include physical matching
CREATE OR REPLACE FUNCTION calculate_complete_collaboration_compatibility(
    p_profile_id UUID,
    p_role_id UUID,
    p_physical_requirements JSONB DEFAULT NULL
) RETURNS TABLE (
    overall_score DECIMAL(5,2),
    skill_match_score DECIMAL(5,2),
    profile_completeness_score DECIMAL(5,2),
    work_preference_score DECIMAL(5,2),
    availability_score DECIMAL(5,2),
    physical_match_score DECIMAL(5,2),
    matched_skills TEXT[],
    missing_skills TEXT[],
    missing_profile_fields TEXT[],
    physical_matched TEXT[],
    physical_mismatches TEXT[],
    breakdown JSONB
) AS $$
DECLARE
    v_enhanced_result RECORD;
    v_physical_result RECORD;
BEGIN
    -- Get enhanced compatibility (existing function)
    SELECT * INTO v_enhanced_result
    FROM calculate_enhanced_collaboration_compatibility(p_profile_id, p_role_id);

    -- Calculate physical attribute match if requirements provided
    IF p_physical_requirements IS NOT NULL THEN
        SELECT * INTO v_physical_result
        FROM calculate_physical_attribute_match(p_profile_id, p_physical_requirements);
    ELSE
        -- No physical requirements, perfect score
        v_physical_result.score := 100.0;
        v_physical_result.matched_attributes := ARRAY[]::TEXT[];
        v_physical_result.mismatch_reasons := ARRAY[]::TEXT[];
    END IF;

    -- Calculate new overall score with physical attributes
    -- 40% skill, 15% profile, 15% work prefs, 15% availability, 15% physical
    DECLARE
        v_final_overall DECIMAL(5,2);
        v_final_breakdown JSONB;
    BEGIN
        v_final_overall := ROUND(
            (v_enhanced_result.skill_match_score * 0.40) +
            (v_enhanced_result.profile_completeness_score * 0.15) +
            (v_enhanced_result.work_preference_score * 0.15) +
            (v_enhanced_result.availability_score * 0.15) +
            (v_physical_result.score * 0.15),
            2
        );

        -- Build comprehensive breakdown
        v_final_breakdown := v_enhanced_result.breakdown || jsonb_build_object(
            'physical_match', jsonb_build_object(
                'score', v_physical_result.score,
                'weight', 0.15,
                'weighted_contribution', ROUND(v_physical_result.score * 0.15, 2),
                'matched_attributes', v_physical_result.matched_attributes,
                'mismatches', v_physical_result.mismatch_reasons
            ),
            'overall', jsonb_build_object(
                'score', v_final_overall,
                'meets_minimum_threshold',
                    v_enhanced_result.skill_match_score >= 30.0 AND
                    v_enhanced_result.profile_completeness_score >= 60.0 AND
                    v_physical_result.score >= 50.0
            )
        );

        RETURN QUERY SELECT
            v_final_overall,
            v_enhanced_result.skill_match_score,
            v_enhanced_result.profile_completeness_score,
            v_enhanced_result.work_preference_score,
            v_enhanced_result.availability_score,
            v_physical_result.score,
            v_enhanced_result.matched_skills,
            v_enhanced_result.missing_skills,
            v_enhanced_result.missing_profile_fields,
            v_physical_result.matched_attributes,
            v_physical_result.mismatch_reasons,
            v_final_breakdown;
    END;
END;
$$ LANGUAGE plpgsql;

-- Add comments
COMMENT ON FUNCTION calculate_physical_attribute_match IS 'Calculates compatibility based on physical attributes (height, eye/hair color, body type, tattoos, etc.) for talent/modeling gigs';
COMMENT ON FUNCTION calculate_complete_collaboration_compatibility IS 'Complete compatibility calculation including skills, profile, work preferences, availability, and physical attributes';

-- Enhance matchmaking algorithms to use new demographic and preference fields
-- This builds on existing collaboration compatibility functions

-- Enhanced function to calculate user-project compatibility with work preferences
CREATE OR REPLACE FUNCTION calculate_enhanced_collaboration_compatibility(
    p_profile_id UUID,
    p_role_id UUID
) RETURNS TABLE (
    overall_score DECIMAL(5,2),
    skill_match_score DECIMAL(5,2),
    profile_completeness_score DECIMAL(5,2),
    work_preference_score DECIMAL(5,2),
    availability_score DECIMAL(5,2),
    matched_skills TEXT[],
    missing_skills TEXT[],
    missing_profile_fields TEXT[],
    breakdown JSONB
) AS $$
DECLARE
    v_overall_score DECIMAL(5,2) := 0;
    v_skill_score DECIMAL(5,2) := 0;
    v_profile_score DECIMAL(5,2) := 0;
    v_work_pref_score DECIMAL(5,2) := 0;
    v_availability_score DECIMAL(5,2) := 0;
    v_matched TEXT[] := ARRAY[]::TEXT[];
    v_missing TEXT[] := ARRAY[]::TEXT[];
    v_missing_fields TEXT[] := ARRAY[]::TEXT[];
    v_breakdown JSONB := '{}';
    v_profile RECORD;
    v_role RECORD;
    v_skill_result RECORD;
    v_work_pref_reasons TEXT[] := ARRAY[]::TEXT[];
    v_availability_reasons TEXT[] := ARRAY[]::TEXT[];
BEGIN
    -- Get profile data with new fields
    SELECT * INTO v_profile
    FROM users_profile
    WHERE id = p_profile_id;

    IF v_profile IS NULL THEN
        RETURN QUERY SELECT
            0.0::DECIMAL(5,2), 0.0::DECIMAL(5,2), 0.0::DECIMAL(5,2),
            0.0::DECIMAL(5,2), 0.0::DECIMAL(5,2),
            ARRAY[]::TEXT[], ARRAY[]::TEXT[], ARRAY['profile_not_found']::TEXT[],
            jsonb_build_object('error', 'profile_not_found');
        RETURN;
    END IF;

    -- Get role data with project information
    SELECT r.*, p.compensation_type, p.location_type, p.start_date, p.end_date
    INTO v_role
    FROM collab_roles r
    LEFT JOIN collab_projects p ON r.project_id = p.id
    WHERE r.id = p_role_id;

    -- Calculate skill match (using existing function)
    SELECT * INTO v_skill_result
    FROM calculate_collaboration_skill_match(p_profile_id, p_role_id);

    v_skill_score := v_skill_result.score;
    v_matched := v_skill_result.matched_skills;
    v_missing := v_skill_result.missing_skills;

    -- Calculate enhanced profile completeness (includes new demographic fields)
    v_profile_score := 0;

    -- Core fields (20 points each, 80 total)
    IF v_profile.bio IS NOT NULL AND TRIM(v_profile.bio) != '' THEN
        v_profile_score := v_profile_score + 20.0;
    ELSE
        v_missing_fields := array_append(v_missing_fields, 'bio');
    END IF;

    IF v_profile.city IS NOT NULL AND TRIM(v_profile.city) != '' THEN
        v_profile_score := v_profile_score + 20.0;
    ELSE
        v_missing_fields := array_append(v_missing_fields, 'city');
    END IF;

    IF v_profile.country IS NOT NULL AND TRIM(v_profile.country) != '' THEN
        v_profile_score := v_profile_score + 20.0;
    ELSE
        v_missing_fields := array_append(v_missing_fields, 'country');
    END IF;

    IF v_profile.specializations IS NOT NULL AND array_length(v_profile.specializations, 1) > 0 THEN
        v_profile_score := v_profile_score + 20.0;
    ELSE
        v_missing_fields := array_append(v_missing_fields, 'specializations');
    END IF;

    -- Enhanced demographic fields (5 points each, 20 total)
    IF v_profile.experience_level IS NOT NULL THEN
        v_profile_score := v_profile_score + 5.0;
    END IF;

    IF v_profile.nationality IS NOT NULL THEN
        v_profile_score := v_profile_score + 5.0;
    END IF;

    IF v_profile.body_type IS NOT NULL AND v_role.requires_physical_presence THEN
        v_profile_score := v_profile_score + 5.0;
    END IF;

    IF v_profile.availability_status IS NOT NULL THEN
        v_profile_score := v_profile_score + 5.0;
    END IF;

    -- Calculate work preference compatibility score (0-100)
    v_work_pref_score := 100.0; -- Start at perfect match

    -- Check compensation preferences
    IF v_role.compensation_type = 'tfp' AND v_profile.accepts_tfp = false THEN
        v_work_pref_score := v_work_pref_score - 30.0;
        v_work_pref_reasons := array_append(v_work_pref_reasons, 'Does not accept TFP');
    ELSIF v_role.compensation_type = 'tfp' AND v_profile.accepts_tfp = true THEN
        v_work_pref_reasons := array_append(v_work_pref_reasons, 'Accepts TFP work');
    END IF;

    -- Check location preferences
    IF v_role.location_type = 'studio' AND v_profile.prefers_outdoor = true AND v_profile.prefers_studio = false THEN
        v_work_pref_score := v_work_pref_score - 15.0;
        v_work_pref_reasons := array_append(v_work_pref_reasons, 'Prefers outdoor work');
    ELSIF v_role.location_type = 'outdoor' AND v_profile.prefers_studio = true AND v_profile.prefers_outdoor = false THEN
        v_work_pref_score := v_work_pref_score - 15.0;
        v_work_pref_reasons := array_append(v_work_pref_reasons, 'Prefers studio work');
    END IF;

    -- Check team work preferences
    IF v_role.team_size > 5 AND v_profile.prefers_solo_work = true AND v_profile.works_with_teams = false THEN
        v_work_pref_score := v_work_pref_score - 20.0;
        v_work_pref_reasons := array_append(v_work_pref_reasons, 'Prefers solo work');
    END IF;

    -- Ensure score doesn't go below 0
    v_work_pref_score := GREATEST(v_work_pref_score, 0.0);

    -- Calculate availability score (0-100)
    v_availability_score := 0;

    IF v_profile.availability_status = 'available' THEN
        v_availability_score := v_availability_score + 40.0;
        v_availability_reasons := array_append(v_availability_reasons, 'Currently available');
    ELSIF v_profile.availability_status = 'limited' THEN
        v_availability_score := v_availability_score + 25.0;
        v_availability_reasons := array_append(v_availability_reasons, 'Limited availability');
    ELSIF v_profile.availability_status = 'busy' THEN
        v_availability_score := v_availability_score + 10.0;
        v_availability_reasons := array_append(v_availability_reasons, 'Currently busy');
    END IF;

    -- Check schedule compatibility
    IF EXTRACT(DOW FROM v_role.start_date) IN (0, 6) THEN -- Weekend project
        IF v_profile.available_weekends = true THEN
            v_availability_score := v_availability_score + 30.0;
            v_availability_reasons := array_append(v_availability_reasons, 'Available on weekends');
        ELSE
            v_availability_score := v_availability_score + 5.0;
        END IF;
    ELSE -- Weekday project
        IF v_profile.available_weekdays = true THEN
            v_availability_score := v_availability_score + 30.0;
            v_availability_reasons := array_append(v_availability_reasons, 'Available on weekdays');
        END IF;
    END IF;

    -- Check evening availability
    IF v_role.requires_evening_work = true AND v_profile.available_evenings = true THEN
        v_availability_score := v_availability_score + 15.0;
        v_availability_reasons := array_append(v_availability_reasons, 'Available evenings');
    END IF;

    -- Check overnight availability
    IF v_role.requires_overnight = true AND v_profile.available_overnight = true THEN
        v_availability_score := v_availability_score + 15.0;
        v_availability_reasons := array_append(v_availability_reasons, 'Available overnight');
    END IF;

    -- Cap availability score at 100
    v_availability_score := LEAST(v_availability_score, 100.0);

    -- Calculate overall score with new weights:
    -- 50% skill match, 20% profile completeness, 15% work preferences, 15% availability
    v_overall_score := ROUND(
        (v_skill_score * 0.50) +
        (v_profile_score * 0.20) +
        (v_work_pref_score * 0.15) +
        (v_availability_score * 0.15),
        2
    );

    -- Build comprehensive breakdown
    v_breakdown := jsonb_build_object(
        'skill_match', jsonb_build_object(
            'score', v_skill_score,
            'weight', 0.50,
            'weighted_contribution', ROUND(v_skill_score * 0.50, 2),
            'matched_skills', v_matched,
            'missing_skills', v_missing
        ),
        'profile_completeness', jsonb_build_object(
            'score', v_profile_score,
            'weight', 0.20,
            'weighted_contribution', ROUND(v_profile_score * 0.20, 2),
            'missing_fields', v_missing_fields
        ),
        'work_preferences', jsonb_build_object(
            'score', v_work_pref_score,
            'weight', 0.15,
            'weighted_contribution', ROUND(v_work_pref_score * 0.15, 2),
            'reasons', v_work_pref_reasons
        ),
        'availability', jsonb_build_object(
            'score', v_availability_score,
            'weight', 0.15,
            'weighted_contribution', ROUND(v_availability_score * 0.15, 2),
            'reasons', v_availability_reasons
        ),
        'overall', jsonb_build_object(
            'score', v_overall_score,
            'meets_minimum_threshold', v_skill_score >= 30.0 AND v_profile_score >= 60.0
        )
    );

    RETURN QUERY SELECT
        v_overall_score,
        v_skill_score,
        v_profile_score,
        v_work_pref_score,
        v_availability_score,
        v_matched,
        v_missing,
        v_missing_fields,
        v_breakdown;
END;
$$ LANGUAGE plpgsql;

-- Function to find compatible matches for a user based on demographics and preferences
CREATE OR REPLACE FUNCTION find_demographic_compatible_users(
    p_user_id UUID,
    p_filters JSONB DEFAULT '{}'::JSONB,
    p_limit INTEGER DEFAULT 20
) RETURNS TABLE (
    profile_id UUID,
    display_name TEXT,
    handle TEXT,
    avatar_url TEXT,
    bio TEXT,
    city TEXT,
    country TEXT,
    gender_identity TEXT,
    ethnicity TEXT,
    body_type TEXT,
    experience_level TEXT,
    compatibility_score DECIMAL(5,2),
    match_reasons TEXT[]
) AS $$
DECLARE
    v_user_profile RECORD;
BEGIN
    -- Get requesting user's profile
    SELECT * INTO v_user_profile
    FROM users_profile
    WHERE id = p_user_id;

    RETURN QUERY
    SELECT
        up.id,
        up.display_name,
        up.handle,
        up.avatar_url,
        up.bio,
        up.city,
        up.country,
        up.gender_identity,
        up.ethnicity,
        up.body_type,
        up.experience_level,
        -- Simple compatibility score based on shared attributes
        CAST(
            (CASE WHEN up.city = v_user_profile.city THEN 25 ELSE 0 END) +
            (CASE WHEN up.country = v_user_profile.country THEN 15 ELSE 0 END) +
            (CASE WHEN up.experience_level = v_user_profile.experience_level THEN 20 ELSE 0 END) +
            (CASE WHEN up.available_weekdays = v_user_profile.available_weekdays THEN 10 ELSE 0 END) +
            (CASE WHEN up.available_weekends = v_user_profile.available_weekends THEN 10 ELSE 0 END) +
            (CASE WHEN up.works_with_teams = v_user_profile.works_with_teams THEN 10 ELSE 0 END) +
            (CASE WHEN up.prefers_studio = v_user_profile.prefers_studio THEN 10 ELSE 0 END)
        AS DECIMAL(5,2)) as compatibility_score,
        -- Build match reasons
        ARRAY(
            SELECT reason FROM (
                SELECT 'Same city' as reason WHERE up.city = v_user_profile.city
                UNION ALL
                SELECT 'Same country' WHERE up.country = v_user_profile.country
                UNION ALL
                SELECT 'Similar experience level' WHERE up.experience_level = v_user_profile.experience_level
                UNION ALL
                SELECT 'Compatible schedule' WHERE up.available_weekdays = v_user_profile.available_weekdays
                UNION ALL
                SELECT 'Similar work style' WHERE up.works_with_teams = v_user_profile.works_with_teams
            ) reasons
        ) as match_reasons
    FROM users_profile up
    WHERE up.id != p_user_id
    AND up.include_in_search = true
    AND up.allow_direct_messages = true
    -- Apply optional filters from JSONB
    AND (p_filters->>'city' IS NULL OR up.city ILIKE '%' || (p_filters->>'city') || '%')
    AND (p_filters->>'country' IS NULL OR up.country = (p_filters->>'country'))
    AND (p_filters->>'gender_identity' IS NULL OR up.gender_identity = (p_filters->>'gender_identity'))
    AND (p_filters->>'ethnicity' IS NULL OR up.ethnicity = (p_filters->>'ethnicity'))
    AND (p_filters->>'body_type' IS NULL OR up.body_type = (p_filters->>'body_type'))
    AND (p_filters->>'experience_level' IS NULL OR up.experience_level = (p_filters->>'experience_level'))
    AND (p_filters->>'accepts_tfp' IS NULL OR up.accepts_tfp = (p_filters->>'accepts_tfp')::BOOLEAN)
    ORDER BY compatibility_score DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Add comments
COMMENT ON FUNCTION calculate_enhanced_collaboration_compatibility IS 'Enhanced compatibility calculation including demographics, work preferences, and availability';
COMMENT ON FUNCTION find_demographic_compatible_users IS 'Find users with compatible demographics and work preferences for networking/collaboration';

-- Add compatibility calculation functions for collaboration system
-- This extends the existing matchmaking system to support collaboration roles

-- Function to calculate skill match between user profile and collaboration role
CREATE OR REPLACE FUNCTION calculate_collaboration_skill_match(
    p_profile_id UUID,
    p_role_id UUID
) RETURNS TABLE (
    score DECIMAL(5,2),
    matched_skills TEXT[],
    missing_skills TEXT[],
    breakdown JSONB
) AS $$
DECLARE
    v_score DECIMAL(5,2) := 0;
    v_matched TEXT[] := ARRAY[]::TEXT[];
    v_missing TEXT[] := ARRAY[]::TEXT[];
    v_breakdown JSONB := '{}';
    v_user_skills TEXT[];
    v_required_skills TEXT[];
    v_match_count INTEGER := 0;
    v_required_count INTEGER := 0;
BEGIN
    -- Get user specializations
    SELECT specializations INTO v_user_skills
    FROM users_profile
    WHERE id = p_profile_id;

    -- Get role required skills
    SELECT skills_required INTO v_required_skills
    FROM collab_roles
    WHERE id = p_role_id;

    -- If no required skills, consider it a 100% match
    IF v_required_skills IS NULL OR array_length(v_required_skills, 1) IS NULL THEN
        RETURN QUERY SELECT
            100.0::DECIMAL(5,2),
            ARRAY[]::TEXT[],
            ARRAY[]::TEXT[],
            jsonb_build_object('no_requirements', true);
        RETURN;
    END IF;

    -- If user has no skills but role requires skills, it's 0% match
    IF v_user_skills IS NULL OR array_length(v_user_skills, 1) IS NULL THEN
        RETURN QUERY SELECT
            0.0::DECIMAL(5,2),
            ARRAY[]::TEXT[],
            v_required_skills,
            jsonb_build_object(
                'user_has_no_skills', true,
                'required_count', array_length(v_required_skills, 1)
            );
        RETURN;
    END IF;

    -- Calculate matched and missing skills (case-insensitive)
    v_required_count := array_length(v_required_skills, 1);

    -- Find matched skills
    SELECT ARRAY(
        SELECT DISTINCT rs
        FROM unnest(v_required_skills) rs
        WHERE EXISTS (
            SELECT 1
            FROM unnest(v_user_skills) us
            WHERE LOWER(TRIM(us)) = LOWER(TRIM(rs))
        )
    ) INTO v_matched;

    -- Find missing skills
    SELECT ARRAY(
        SELECT DISTINCT rs
        FROM unnest(v_required_skills) rs
        WHERE NOT EXISTS (
            SELECT 1
            FROM unnest(v_user_skills) us
            WHERE LOWER(TRIM(us)) = LOWER(TRIM(rs))
        )
    ) INTO v_missing;

    v_match_count := array_length(v_matched, 1);
    IF v_match_count IS NULL THEN
        v_match_count := 0;
    END IF;

    -- Calculate percentage (0-100)
    v_score := ROUND((v_match_count::DECIMAL / v_required_count::DECIMAL) * 100, 2);

    -- Build breakdown
    v_breakdown := jsonb_build_object(
        'matched_count', v_match_count,
        'required_count', v_required_count,
        'user_skill_count', array_length(v_user_skills, 1),
        'match_percentage', v_score
    );

    RETURN QUERY SELECT v_score, v_matched, v_missing, v_breakdown;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate overall collaboration application compatibility
CREATE OR REPLACE FUNCTION calculate_collaboration_compatibility(
    p_profile_id UUID,
    p_role_id UUID
) RETURNS TABLE (
    overall_score DECIMAL(5,2),
    skill_match_score DECIMAL(5,2),
    profile_completeness_score DECIMAL(5,2),
    matched_skills TEXT[],
    missing_skills TEXT[],
    missing_profile_fields TEXT[],
    breakdown JSONB
) AS $$
DECLARE
    v_overall_score DECIMAL(5,2) := 0;
    v_skill_score DECIMAL(5,2) := 0;
    v_profile_score DECIMAL(5,2) := 0;
    v_matched TEXT[] := ARRAY[]::TEXT[];
    v_missing TEXT[] := ARRAY[]::TEXT[];
    v_missing_fields TEXT[] := ARRAY[]::TEXT[];
    v_breakdown JSONB := '{}';
    v_profile RECORD;
    v_skill_result RECORD;
BEGIN
    -- Get profile data
    SELECT * INTO v_profile
    FROM users_profile
    WHERE id = p_profile_id;

    IF v_profile IS NULL THEN
        RETURN QUERY SELECT
            0.0::DECIMAL(5,2), 0.0::DECIMAL(5,2), 0.0::DECIMAL(5,2),
            ARRAY[]::TEXT[], ARRAY[]::TEXT[], ARRAY['profile_not_found']::TEXT[],
            jsonb_build_object('error', 'profile_not_found');
        RETURN;
    END IF;

    -- Calculate skill match
    SELECT * INTO v_skill_result
    FROM calculate_collaboration_skill_match(p_profile_id, p_role_id);

    v_skill_score := v_skill_result.score;
    v_matched := v_skill_result.matched_skills;
    v_missing := v_skill_result.missing_skills;

    -- Calculate profile completeness (25 points each for 4 fields)
    v_profile_score := 0;

    IF v_profile.bio IS NOT NULL AND TRIM(v_profile.bio) != '' THEN
        v_profile_score := v_profile_score + 25.0;
    ELSE
        v_missing_fields := array_append(v_missing_fields, 'bio');
    END IF;

    IF v_profile.city IS NOT NULL AND TRIM(v_profile.city) != '' THEN
        v_profile_score := v_profile_score + 25.0;
    ELSE
        v_missing_fields := array_append(v_missing_fields, 'city');
    END IF;

    IF v_profile.country IS NOT NULL AND TRIM(v_profile.country) != '' THEN
        v_profile_score := v_profile_score + 25.0;
    ELSE
        v_missing_fields := array_append(v_missing_fields, 'country');
    END IF;

    IF v_profile.specializations IS NOT NULL AND array_length(v_profile.specializations, 1) > 0 THEN
        v_profile_score := v_profile_score + 25.0;
    ELSE
        v_missing_fields := array_append(v_missing_fields, 'specializations');
    END IF;

    -- Calculate overall score (70% skill match, 30% profile completeness)
    v_overall_score := ROUND((v_skill_score * 0.7) + (v_profile_score * 0.3), 2);

    -- Build comprehensive breakdown
    v_breakdown := jsonb_build_object(
        'skill_match', jsonb_build_object(
            'score', v_skill_score,
            'weight', 0.7,
            'weighted_contribution', ROUND(v_skill_score * 0.7, 2),
            'matched_skills', v_matched,
            'missing_skills', v_missing
        ),
        'profile_completeness', jsonb_build_object(
            'score', v_profile_score,
            'weight', 0.3,
            'weighted_contribution', ROUND(v_profile_score * 0.3, 2),
            'missing_fields', v_missing_fields
        ),
        'overall', jsonb_build_object(
            'score', v_overall_score,
            'meets_minimum_threshold', v_skill_score >= 30.0 AND v_profile_score = 100.0
        )
    );

    RETURN QUERY SELECT
        v_overall_score,
        v_skill_score,
        v_profile_score,
        v_matched,
        v_missing,
        v_missing_fields,
        v_breakdown;
END;
$$ LANGUAGE plpgsql;

-- Function to get recommended talent for a collaboration role
CREATE OR REPLACE FUNCTION get_collaboration_role_recommendations(
    p_role_id UUID,
    p_min_compatibility DECIMAL DEFAULT 30.0,
    p_limit INTEGER DEFAULT 10
) RETURNS TABLE (
    profile_id UUID,
    display_name TEXT,
    handle TEXT,
    avatar_url TEXT,
    bio TEXT,
    city TEXT,
    country TEXT,
    overall_score DECIMAL(5,2),
    skill_match_score DECIMAL(5,2),
    matched_skills TEXT[],
    missing_skills TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        up.id,
        up.display_name,
        up.handle,
        up.avatar_url,
        up.bio,
        up.city,
        up.country,
        cc.overall_score,
        cc.skill_match_score,
        cc.matched_skills,
        cc.missing_skills
    FROM users_profile up
    CROSS JOIN LATERAL calculate_collaboration_compatibility(up.id, p_role_id) cc
    WHERE cc.skill_match_score >= p_min_compatibility
    AND cc.profile_completeness_score = 100.0
    ORDER BY cc.overall_score DESC, cc.skill_match_score DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Add comments
COMMENT ON FUNCTION calculate_collaboration_skill_match IS 'Calculates skill match percentage between user and collaboration role with matched/missing skills breakdown';
COMMENT ON FUNCTION calculate_collaboration_compatibility IS 'Calculates overall compatibility including skill match and profile completeness for collaboration applications';
COMMENT ON FUNCTION get_collaboration_role_recommendations IS 'Finds recommended talent for a collaboration role based on skill match and profile completeness';

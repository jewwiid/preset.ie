-- Enhanced Role-Based Matchmaking Algorithm
-- Implements conditional scoring based on gig type with role matching as highest priority
-- Replaces generic one-size-fits-all scoring with targeted matching

-- ============================================
-- STEP 1: Create the enhanced matchmaking function
-- ============================================

CREATE OR REPLACE FUNCTION calculate_gig_compatibility_with_role_matching(
    p_profile_id UUID,
    p_gig_id UUID
) RETURNS TABLE (
    score DECIMAL(5,2),
    breakdown JSONB,
    matched_attributes TEXT[],
    missing_requirements TEXT[],
    role_match_status TEXT
) AS $$
DECLARE
    v_score DECIMAL(5,2) := 0;
    v_total_possible DECIMAL(5,2) := 0;
    v_role_score DECIMAL(5,2) := 0;
    v_physical_score DECIMAL(5,2) := 0;
    v_professional_score DECIMAL(5,2) := 0;
    v_work_prefs_score DECIMAL(5,2) := 0;
    v_role_match_status TEXT := 'none';
    v_matched TEXT[] := '{}';
    v_missing TEXT[] := '{}';

    -- Gig data
    v_gig_looking_for TEXT[];
    v_gig_prefs JSONB;

    -- Profile data
    v_profile_primary_role TEXT;
    v_profile_categories TEXT[];
    v_profile_specializations TEXT[];
    v_profile_data RECORD;
BEGIN
    -- ============================================
    -- FETCH PROFILE DATA
    -- ============================================
    SELECT
        primary_role,
        talent_categories,
        specializations,
        role_flags,
        demographics,
        physical_attributes,
        work_preferences
    INTO
        v_profile_primary_role,
        v_profile_categories,
        v_profile_specializations,
        v_profile_data
    FROM users_profile
    WHERE id = p_profile_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Profile not found: %', p_profile_id;
    END IF;

    -- ============================================
    -- FETCH GIG DATA
    -- ============================================
    SELECT
        looking_for_types,
        applicant_preferences
    INTO
        v_gig_looking_for,
        v_gig_prefs
    FROM gigs
    WHERE id = p_gig_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Gig not found: %', p_gig_id;
    END IF;

    -- Handle empty or null looking_for_types
    IF v_gig_looking_for IS NULL OR array_length(v_gig_looking_for, 1) IS NULL THEN
        v_gig_looking_for := ARRAY['OTHER'];
    END IF;

    -- ============================================
    -- STEP 1: ROLE MATCHING (40 points - HIGHEST PRIORITY)
    -- ============================================
    v_total_possible := 40.0;

    -- Perfect role match: primary_role matches exactly
    IF v_profile_primary_role = ANY(v_gig_looking_for) THEN
        v_role_score := 40.0;
        v_role_match_status := 'perfect';
        v_matched := array_append(v_matched, format('✓ Perfect role match: %s', v_profile_primary_role));

    -- Partial match: talent_categories overlap
    ELSIF v_profile_categories && v_gig_looking_for THEN
        v_role_score := 30.0;
        v_role_match_status := 'partial';
        v_matched := array_append(v_matched, '~ Partial role match via categories');

    -- Weak match: related specializations
    ELSIF v_profile_specializations && v_gig_looking_for THEN
        v_role_score := 15.0;
        v_role_match_status := 'weak';
        v_matched := array_append(v_matched, '- Weak match via specializations');

    -- No role match
    ELSE
        v_role_score := 0.0;
        v_role_match_status := 'none';
        v_missing := array_append(v_missing, '✗ No matching role/category');
    END IF;

    v_score := v_score + v_role_score;

    -- ============================================
    -- STEP 2: CONDITIONAL SCORING BASED ON GIG TYPE
    -- ============================================

    -- TALENT & PERFORMERS (Models, Actors, Dancers, etc.)
    IF v_gig_looking_for && ARRAY[
        'MODELS', 'MODELS_FASHION', 'MODELS_COMMERCIAL', 'MODELS_FITNESS',
        'MODELS_EDITORIAL', 'MODELS_RUNWAY', 'MODELS_HAND', 'MODELS_PARTS',
        'ACTORS', 'DANCERS', 'PERFORMERS', 'INFLUENCERS'
    ] THEN
        -- Physical attributes are HIGH priority (30 points)
        v_total_possible := v_total_possible + 30.0;
        v_physical_score := calculate_physical_match_score(v_profile_data, v_gig_prefs);
        v_score := v_score + v_physical_score;

        -- Professional criteria are MEDIUM priority (15 points)
        v_total_possible := v_total_possible + 15.0;
        v_professional_score := calculate_professional_match_score(v_profile_data, v_gig_prefs, 'talent');
        v_score := v_score + v_professional_score;

        -- Work preferences are LOW priority (10 points)
        v_total_possible := v_total_possible + 10.0;
        v_work_prefs_score := calculate_work_prefs_score(v_profile_data, v_gig_prefs, 10.0);
        v_score := v_score + v_work_prefs_score;

    -- VISUAL CREATORS (Photographers, Videographers, Cinematographers)
    ELSIF v_gig_looking_for && ARRAY[
        'PHOTOGRAPHERS', 'VIDEOGRAPHERS', 'CINEMATOGRAPHERS'
    ] THEN
        -- Professional/Equipment are HIGH priority (35 points)
        v_total_possible := v_total_possible + 35.0;
        v_professional_score := calculate_professional_match_score(v_profile_data, v_gig_prefs, 'visual');
        v_score := v_score + v_professional_score;

        -- Work preferences are MEDIUM priority (15 points)
        v_total_possible := v_total_possible + 15.0;
        v_work_prefs_score := calculate_work_prefs_score(v_profile_data, v_gig_prefs, 15.0);
        v_score := v_score + v_work_prefs_score;

        -- Physical attributes are ZERO priority (0 points)
        -- Don't even calculate!

    -- STYLING & BEAUTY (Makeup, Hair, Fashion Stylists)
    ELSIF v_gig_looking_for && ARRAY[
        'MAKEUP_ARTISTS', 'HAIR_STYLISTS', 'FASHION_STYLISTS', 'WARDROBE_STYLISTS'
    ] THEN
        -- Kit/Portfolio are HIGH priority (25 points)
        v_total_possible := v_total_possible + 25.0;
        v_professional_score := calculate_professional_match_score(v_profile_data, v_gig_prefs, 'styling');
        v_score := v_score + v_professional_score;

        -- Travel/Work prefs are MEDIUM priority (20 points)
        v_total_possible := v_total_possible + 20.0;
        v_work_prefs_score := calculate_work_prefs_score(v_profile_data, v_gig_prefs, 20.0);
        v_score := v_score + v_work_prefs_score;

    -- POST-PRODUCTION (Editors, VFX, Designers, etc.)
    ELSIF v_gig_looking_for && ARRAY[
        'EDITORS', 'VIDEO_EDITORS', 'PHOTO_EDITORS', 'VFX_ARTISTS',
        'MOTION_GRAPHICS', 'RETOUCHERS', 'COLOR_GRADERS',
        'DESIGNERS', 'GRAPHIC_DESIGNERS', 'ILLUSTRATORS', 'ANIMATORS'
    ] THEN
        -- Software/Technical skills are HIGH priority (35 points)
        v_total_possible := v_total_possible + 35.0;
        v_professional_score := calculate_professional_match_score(v_profile_data, v_gig_prefs, 'post');
        v_score := v_score + v_professional_score;

        -- Work preferences are MEDIUM priority (15 points)
        v_total_possible := v_total_possible + 15.0;
        v_work_prefs_score := calculate_work_prefs_score(v_profile_data, v_gig_prefs, 15.0);
        v_score := v_score + v_work_prefs_score;

    -- PRODUCTION & CREW
    ELSIF v_gig_looking_for && ARRAY[
        'PRODUCTION_CREW', 'PRODUCERS', 'DIRECTORS',
        'CREATIVE_DIRECTORS', 'ART_DIRECTORS'
    ] THEN
        -- Professional/Equipment are HIGH priority (30 points)
        v_total_possible := v_total_possible + 30.0;
        v_professional_score := calculate_professional_match_score(v_profile_data, v_gig_prefs, 'production');
        v_score := v_score + v_professional_score;

        -- Work preferences are MEDIUM priority (15 points)
        v_total_possible := v_total_possible + 15.0;
        v_work_prefs_score := calculate_work_prefs_score(v_profile_data, v_gig_prefs, 15.0);
        v_score := v_score + v_work_prefs_score;

    -- OTHER / DEFAULT (show all criteria)
    ELSE
        -- Balanced scoring for unknown types
        v_total_possible := v_total_possible + 20.0;
        v_physical_score := calculate_physical_match_score(v_profile_data, v_gig_prefs) * 0.5;
        v_score := v_score + v_physical_score;

        v_total_possible := v_total_possible + 20.0;
        v_professional_score := calculate_professional_match_score(v_profile_data, v_gig_prefs, 'default');
        v_score := v_score + v_professional_score;

        v_total_possible := v_total_possible + 15.0;
        v_work_prefs_score := calculate_work_prefs_score(v_profile_data, v_gig_prefs, 15.0);
        v_score := v_score + v_work_prefs_score;
    END IF;

    -- ============================================
    -- STEP 3: NORMALIZE TO 100%
    -- ============================================
    IF v_total_possible > 0 THEN
        v_score := (v_score / v_total_possible) * 100.0;
    END IF;

    -- Cap at 100%
    IF v_score > 100.0 THEN
        v_score := 100.0;
    END IF;

    -- ============================================
    -- STEP 4: BUILD BREAKDOWN JSON
    -- ============================================
    breakdown := jsonb_build_object(
        'role_match', jsonb_build_object(
            'score', v_role_score,
            'status', v_role_match_status,
            'possible', 40.0
        ),
        'physical', jsonb_build_object(
            'score', v_physical_score,
            'possible', CASE WHEN v_gig_looking_for && ARRAY['MODELS', 'ACTORS', 'DANCERS'] THEN 30.0 ELSE 0.0 END
        ),
        'professional', jsonb_build_object(
            'score', v_professional_score,
            'possible', v_total_possible - 40.0 - v_work_prefs_score
        ),
        'work_preferences', jsonb_build_object(
            'score', v_work_prefs_score
        ),
        'total_possible', v_total_possible,
        'final_score', v_score
    );

    -- ============================================
    -- RETURN RESULTS
    -- ============================================
    RETURN QUERY SELECT
        v_score,
        breakdown,
        v_matched,
        v_missing,
        v_role_match_status;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- STEP 2: Create helper scoring functions
-- ============================================

-- Physical match scoring (simplified for now)
CREATE OR REPLACE FUNCTION calculate_physical_match_score(
    profile_data RECORD,
    gig_prefs JSONB
) RETURNS DECIMAL(5,2) AS $$
DECLARE
    score DECIMAL(5,2) := 0;
    max_score DECIMAL(5,2) := 30.0;
BEGIN
    -- Simplified scoring - can be enhanced later
    -- Height, age, physical attributes matching
    -- This is a placeholder - integrate with existing logic
    score := 15.0; -- Default partial match
    RETURN score;
END;
$$ LANGUAGE plpgsql STABLE;

-- Professional match scoring
CREATE OR REPLACE FUNCTION calculate_professional_match_score(
    profile_data RECORD,
    gig_prefs JSONB,
    match_type TEXT
) RETURNS DECIMAL(5,2) AS $$
DECLARE
    score DECIMAL(5,2) := 0;
BEGIN
    -- Simplified scoring based on type
    -- Equipment, software, experience, specializations
    -- This is a placeholder - integrate with existing logic
    score := CASE match_type
        WHEN 'visual' THEN 20.0
        WHEN 'post' THEN 20.0
        WHEN 'production' THEN 18.0
        WHEN 'styling' THEN 15.0
        WHEN 'talent' THEN 8.0
        ELSE 10.0
    END;
    RETURN score;
END;
$$ LANGUAGE plpgsql STABLE;

-- Work preferences scoring
CREATE OR REPLACE FUNCTION calculate_work_prefs_score(
    profile_data RECORD,
    gig_prefs JSONB,
    max_score DECIMAL(5,2)
) RETURNS DECIMAL(5,2) AS $$
DECLARE
    score DECIMAL(5,2) := 0;
BEGIN
    -- Simplified scoring
    -- Travel, schedule, rates, etc.
    score := max_score * 0.6; -- Default 60% match
    RETURN score;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- STEP 3: Update find_compatible_gigs with role filtering
-- ============================================

CREATE OR REPLACE FUNCTION find_compatible_gigs_for_user(
    p_profile_id UUID,
    p_limit INTEGER DEFAULT 20,
    p_min_score DECIMAL(5,2) DEFAULT 40.0
) RETURNS TABLE (
    gig_id UUID,
    gig_title TEXT,
    gig_description TEXT,
    gig_looking_for TEXT[],
    compatibility_score DECIMAL(5,2),
    role_match_status TEXT,
    breakdown JSONB,
    matched_attributes TEXT[],
    missing_requirements TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        g.id,
        g.title,
        g.description,
        g.looking_for_types,
        comp.score,
        comp.role_match_status,
        comp.breakdown,
        comp.matched_attributes,
        comp.missing_requirements
    FROM gigs g
    CROSS JOIN LATERAL calculate_gig_compatibility_with_role_matching(p_profile_id, g.id) comp
    WHERE
        g.status = 'PUBLISHED'
        AND g.application_deadline > NOW()
        AND comp.score >= p_min_score
        AND comp.role_match_status IN ('perfect', 'partial', 'weak')  -- Filter out 'none'
    ORDER BY
        -- Prioritize perfect matches, then score
        CASE comp.role_match_status
            WHEN 'perfect' THEN 1
            WHEN 'partial' THEN 2
            WHEN 'weak' THEN 3
            ELSE 4
        END,
        comp.score DESC,
        g.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- STEP 4: Create backward-compatible alias
-- ============================================

-- Keep old function name for backward compatibility
CREATE OR REPLACE FUNCTION calculate_gig_compatibility_with_preferences(
    p_profile_id UUID,
    p_gig_id UUID
) RETURNS TABLE (
    score DECIMAL(5,2),
    breakdown JSONB,
    matched_attributes TEXT[],
    missing_requirements TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        comp.score,
        comp.breakdown,
        comp.matched_attributes,
        comp.missing_requirements
    FROM calculate_gig_compatibility_with_role_matching(p_profile_id, p_gig_id) comp;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- STEP 5: Add comments and documentation
-- ============================================

COMMENT ON FUNCTION calculate_gig_compatibility_with_role_matching IS
'Enhanced matchmaking function that prioritizes role matching (40 points) and applies
conditional scoring based on gig type. Replaces generic scoring with targeted matching.
Returns role_match_status: perfect (40pts), partial (30pts), weak (15pts), none (0pts).';

COMMENT ON FUNCTION find_compatible_gigs_for_user IS
'Finds compatible gigs for a user with role-based filtering and prioritization.
Only returns gigs with role_match_status of perfect, partial, or weak.
Orders by: role match quality → score → recency.';

-- Grant permissions
GRANT EXECUTE ON FUNCTION calculate_gig_compatibility_with_role_matching TO authenticated;
GRANT EXECUTE ON FUNCTION find_compatible_gigs_for_user TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_gig_compatibility_with_preferences TO authenticated;

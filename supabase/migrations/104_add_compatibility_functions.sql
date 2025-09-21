-- Add compatibility calculation functions for matchmaking

-- Function to calculate compatibility between a user profile and a gig
CREATE OR REPLACE FUNCTION calculate_gig_compatibility(
    p_profile_id UUID,
    p_gig_id UUID
) RETURNS TABLE (
    score DECIMAL(5,2),
    breakdown JSONB
) AS $$
DECLARE
    v_score DECIMAL(5,2) := 0;
    v_breakdown JSONB := '{}';
    v_profile RECORD;
    v_gig RECORD;
BEGIN
    -- Get profile data
    SELECT * INTO v_profile
    FROM users_profile
    WHERE id = p_profile_id;
    
    -- Get gig data
    SELECT * INTO v_gig
    FROM gigs
    WHERE id = p_gig_id;
    
    -- Return 0 if either doesn't exist
    IF v_profile IS NULL OR v_gig IS NULL THEN
        RETURN QUERY SELECT 0.0::DECIMAL(5,2), '{}'::JSONB;
        RETURN;
    END IF;
    
    -- Basic compatibility (always give some base score)
    v_score := 50.0;
    v_breakdown := jsonb_build_object('base_score', 50.0);
    
    -- Location compatibility (if both have city info)
    IF v_profile.city IS NOT NULL AND v_gig.location_text IS NOT NULL THEN
        IF LOWER(v_profile.city) = ANY(string_to_array(LOWER(v_gig.location_text), ' ')) THEN
            v_score := v_score + 20.0;
            v_breakdown := v_breakdown || jsonb_build_object('location_match', 20.0);
        ELSE
            v_breakdown := v_breakdown || jsonb_build_object('location_match', 0.0);
        END IF;
    END IF;
    
    -- Style tags compatibility
    IF v_profile.style_tags IS NOT NULL AND array_length(v_profile.style_tags, 1) > 0 THEN
        -- Simple style matching (can be enhanced)
        v_score := v_score + 15.0;
        v_breakdown := v_breakdown || jsonb_build_object('style_match', 15.0);
    END IF;
    
    -- Role compatibility
    IF 'TALENT' = ANY(v_profile.role_flags) THEN
        v_score := v_score + 15.0;
        v_breakdown := v_breakdown || jsonb_build_object('role_match', 15.0);
    END IF;
    
    -- Cap the score at 100
    IF v_score > 100 THEN
        v_score := 100.0;
    END IF;
    
    RETURN QUERY SELECT v_score, v_breakdown;
END;
$$ LANGUAGE plpgsql;

-- Function to get talent recommendations for a gig
CREATE OR REPLACE FUNCTION get_gig_talent_recommendations(
    p_gig_id UUID,
    p_limit INTEGER DEFAULT 10
) RETURNS TABLE (
    id UUID,
    type TEXT,
    data JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        up.id,
        'user'::TEXT as type,
        jsonb_build_object(
            'id', up.id,
            'name', up.display_name,
            'handle', up.handle,
            'bio', up.bio,
            'city', up.city,
            'avatar_url', up.avatar_url,
            'style_tags', up.style_tags,
            'compatibility_score', cs.score
        ) as data
    FROM users_profile up
    CROSS JOIN LATERAL calculate_gig_compatibility(up.id, p_gig_id) cs
    WHERE 'TALENT' = ANY(up.role_flags)
    AND cs.score >= 60.0 -- Minimum compatibility threshold
    ORDER BY cs.score DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to get gig recommendations for a user
CREATE OR REPLACE FUNCTION get_user_gig_recommendations(
    p_profile_id UUID,
    p_limit INTEGER DEFAULT 10
) RETURNS TABLE (
    id UUID,
    type TEXT,
    data JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        g.id,
        'gig'::TEXT as type,
        jsonb_build_object(
            'id', g.id,
            'title', g.title,
            'description', g.description,
            'location_text', g.location_text,
            'comp_type', g.comp_type,
            'start_time', g.start_time,
            'application_deadline', g.application_deadline,
            'compatibility_score', cs.score
        ) as data
    FROM gigs g
    CROSS JOIN LATERAL calculate_gig_compatibility(p_profile_id, g.id) cs
    WHERE g.status = 'PUBLISHED'
    AND cs.score >= 60.0 -- Minimum compatibility threshold
    ORDER BY cs.score DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Add comments
COMMENT ON FUNCTION calculate_gig_compatibility IS 'Calculates compatibility score between user and gig based on requirements';
COMMENT ON FUNCTION get_gig_talent_recommendations IS 'Finds talent compatible with a specific gig';
COMMENT ON FUNCTION get_user_gig_recommendations IS 'Finds gigs compatible with a specific user';

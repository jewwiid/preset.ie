-- Update matchmaking functions to use per-skill years of experience
-- This enhances the matching algorithm to consider skill-specific experience

-- Step 1: Create function to calculate skill-based experience score
CREATE OR REPLACE FUNCTION calculate_skill_experience_score(
    p_profile_id UUID,
    p_required_skills TEXT[] DEFAULT NULL
)
RETURNS DECIMAL(5,2) AS $$
DECLARE
    v_total_score DECIMAL(5,2) := 0.0;
    v_skill_count INTEGER := 0;
    v_avg_experience DECIMAL(5,2) := 0.0;
    v_skill_record RECORD;
BEGIN
    -- If no required skills specified, use all user skills
    IF p_required_skills IS NULL OR array_length(p_required_skills, 1) IS NULL THEN
        -- Calculate average experience across all user skills
        SELECT 
            COALESCE(AVG(years_experience), 0) INTO v_avg_experience
        FROM user_skills 
        WHERE profile_id = p_profile_id;
        
        -- Score based on average experience (0-20 points max)
        v_total_score := LEAST(20.0, v_avg_experience * 2.0);
    ELSE
        -- Calculate score for specific required skills
        FOR v_skill_record IN
            SELECT skill_name, years_experience
            FROM user_skills 
            WHERE profile_id = p_profile_id 
            AND skill_name = ANY(p_required_skills)
        LOOP
            v_skill_count := v_skill_count + 1;
            -- Score based on years of experience (0-10 points per skill)
            v_total_score := v_total_score + LEAST(10.0, COALESCE(v_skill_record.years_experience, 0) * 1.0);
        END LOOP;
        
        -- If user has some but not all required skills, penalize slightly
        IF v_skill_count < array_length(p_required_skills, 1) THEN
            v_total_score := v_total_score * (v_skill_count::DECIMAL / array_length(p_required_skills, 1));
        END IF;
    END IF;
    
    RETURN v_total_score;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Create enhanced compatibility function with skill experience
CREATE OR REPLACE FUNCTION calculate_enhanced_compatibility_with_skills(
    p_profile_id UUID,
    p_gig_id UUID
)
RETURNS TABLE(
    compatibility_score DECIMAL(5,2),
    matched_skills TEXT[],
    missing_skills TEXT[],
    experience_details JSONB
) AS $$
DECLARE
    v_profile RECORD;
    v_gig RECORD;
    v_required_skills TEXT[];
    v_user_skills TEXT[];
    v_matched TEXT[];
    v_missing TEXT[];
    v_skill_score DECIMAL(5,2);
    v_experience_details JSONB;
    v_skill_details JSONB[] := ARRAY[]::JSONB[];
    v_skill_record RECORD;
BEGIN
    -- Get profile and gig data
    SELECT * INTO v_profile FROM users_profile WHERE id = p_profile_id;
    SELECT * INTO v_gig FROM gigs WHERE id = p_gig_id;
    
    IF v_profile IS NULL OR v_gig IS NULL THEN
        RETURN QUERY SELECT 0.0::DECIMAL(5,2), ARRAY[]::TEXT[], ARRAY[]::TEXT[], '{}'::JSONB;
        RETURN;
    END IF;
    
    -- Extract required skills from gig preferences (if available)
    IF v_gig.applicant_preferences IS NOT NULL THEN
        SELECT array_agg(value::TEXT) INTO v_required_skills
        FROM jsonb_array_elements_text(v_gig.applicant_preferences->'professional'->'specializations');
    ELSE
        -- Fallback to basic specializations matching
        v_required_skills := v_profile.specializations;
    END IF;
    
    -- Get user skills
    SELECT array_agg(skill_name) INTO v_user_skills
    FROM user_skills 
    WHERE profile_id = p_profile_id;
    
    -- Calculate skill experience score
    v_skill_score := calculate_skill_experience_score(p_profile_id, v_required_skills);
    
    -- Find matched and missing skills
    IF v_required_skills IS NOT NULL AND array_length(v_required_skills, 1) > 0 THEN
        -- Matched skills
        SELECT array_agg(skill) INTO v_matched
        FROM unnest(v_required_skills) AS skill
        WHERE skill = ANY(v_user_skills);
        
        -- Missing skills
        SELECT array_agg(skill) INTO v_missing
        FROM unnest(v_required_skills) AS skill
        WHERE skill != ALL(COALESCE(v_user_skills, ARRAY[]::TEXT[]));
    END IF;
    
    -- Build experience details
    FOR v_skill_record IN
        SELECT skill_name, years_experience, proficiency_level
        FROM user_skills 
        WHERE profile_id = p_profile_id
        AND (v_required_skills IS NULL OR skill_name = ANY(v_required_skills))
        ORDER BY years_experience DESC NULLS LAST
    LOOP
        v_skill_details := array_append(v_skill_details, 
            jsonb_build_object(
                'skill', v_skill_record.skill_name,
                'years_experience', v_skill_record.years_experience,
                'proficiency_level', v_skill_record.proficiency_level
            )
        );
    END LOOP;
    
    v_experience_details := jsonb_build_object(
        'skill_experience_score', v_skill_score,
        'total_skills', array_length(v_user_skills, 1),
        'matched_skills_count', array_length(v_matched, 1),
        'skills', to_jsonb(v_skill_details)
    );
    
    RETURN QUERY SELECT 
        v_skill_score,
        COALESCE(v_matched, ARRAY[]::TEXT[]),
        COALESCE(v_missing, ARRAY[]::TEXT[]),
        v_experience_details;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Create function to get user's top skills by experience
CREATE OR REPLACE FUNCTION get_user_top_skills(
    p_profile_id UUID,
    p_limit INTEGER DEFAULT 5
)
RETURNS TABLE(
    skill_name TEXT,
    years_experience INTEGER,
    proficiency_level proficiency_level,
    experience_level_label TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        us.skill_name::TEXT,
        us.years_experience,
        us.proficiency_level,
        CASE 
            WHEN us.years_experience IS NULL THEN 'Not specified'::TEXT
            WHEN us.years_experience = 0 THEN 'Beginner'::TEXT
            WHEN us.years_experience BETWEEN 1 AND 2 THEN 'Novice'::TEXT
            WHEN us.years_experience BETWEEN 3 AND 5 THEN 'Intermediate'::TEXT
            WHEN us.years_experience BETWEEN 6 AND 10 THEN 'Advanced'::TEXT
            WHEN us.years_experience > 10 THEN 'Expert'::TEXT
            ELSE 'Not specified'::TEXT
        END as experience_level_label
    FROM user_skills us
    WHERE us.profile_id = p_profile_id
    ORDER BY 
        COALESCE(us.years_experience, 0) DESC,
        us.is_featured DESC,
        us.proficiency_level DESC,
        us.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Add comments for documentation
COMMENT ON FUNCTION calculate_skill_experience_score IS 'Calculate experience score based on user skills and years of experience';
COMMENT ON FUNCTION calculate_enhanced_compatibility_with_skills IS 'Enhanced compatibility calculation using per-skill experience';
COMMENT ON FUNCTION get_user_top_skills IS 'Get user top skills ordered by experience and proficiency';

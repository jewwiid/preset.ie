-- Add API endpoints for user_skills table
-- This enables the frontend to manage per-skill experience

-- Step 1: Create function to get user skills with details
CREATE OR REPLACE FUNCTION get_user_skills(p_profile_id UUID)
RETURNS TABLE(
    id UUID,
    skill_name TEXT,
    skill_type skill_type,
    proficiency_level proficiency_level,
    years_experience INTEGER,
    verified BOOLEAN,
    description TEXT,
    is_featured BOOLEAN,
    experience_level_label TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        us.id,
        us.skill_name::TEXT,
        us.skill_type,
        us.proficiency_level,
        us.years_experience,
        us.verified,
        us.description,
        us.is_featured,
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
        us.is_featured DESC,
        COALESCE(us.years_experience, 0) DESC,
        us.proficiency_level DESC,
        us.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Create function to upsert user skill (insert or update)
CREATE OR REPLACE FUNCTION upsert_user_skill(
    p_profile_id UUID,
    p_skill_name TEXT,
    p_skill_type skill_type DEFAULT 'creative',
    p_proficiency_level proficiency_level DEFAULT 'intermediate',
    p_years_experience INTEGER DEFAULT NULL,
    p_description TEXT DEFAULT NULL,
    p_is_featured BOOLEAN DEFAULT false
)
RETURNS UUID AS $$
DECLARE
    v_skill_id UUID;
BEGIN
    INSERT INTO user_skills (
        profile_id,
        skill_name,
        skill_type,
        proficiency_level,
        years_experience,
        description,
        is_featured
    ) VALUES (
        p_profile_id,
        p_skill_name,
        p_skill_type,
        p_proficiency_level,
        p_years_experience,
        p_description,
        p_is_featured
    )
    ON CONFLICT (profile_id, skill_name) 
    DO UPDATE SET
        skill_type = EXCLUDED.skill_type,
        proficiency_level = EXCLUDED.proficiency_level,
        years_experience = EXCLUDED.years_experience,
        description = EXCLUDED.description,
        is_featured = EXCLUDED.is_featured,
        updated_at = NOW()
    RETURNING id INTO v_skill_id;
    
    RETURN v_skill_id;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Create function to delete user skill
CREATE OR REPLACE FUNCTION delete_user_skill(
    p_profile_id UUID,
    p_skill_name TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    DELETE FROM user_skills 
    WHERE profile_id = p_profile_id 
    AND skill_name = p_skill_name;
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RETURN v_deleted_count > 0;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Add comments
COMMENT ON FUNCTION get_user_skills IS 'Get all skills for a user with calculated experience levels';
COMMENT ON FUNCTION upsert_user_skill IS 'Insert or update a user skill with experience details';
COMMENT ON FUNCTION delete_user_skill IS 'Delete a specific skill from user profile';

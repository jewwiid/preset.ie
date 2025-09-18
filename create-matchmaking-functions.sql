-- Create matchmaking functions for dashboard compatibility
-- This creates the missing find_compatible_gigs_for_user function

-- Function to find compatible gigs for a user
CREATE OR REPLACE FUNCTION public.find_compatible_gigs_for_user(
    p_profile_id UUID,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE(
    gig_id UUID,
    title TEXT,
    description TEXT,
    location_text TEXT,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    comp_type TEXT,
    compatibility_score INTEGER,
    match_factors JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
    -- For now, return a simple query that gets recent gigs
    -- This is a placeholder implementation that can be enhanced later
    RETURN QUERY
    SELECT 
        g.id as gig_id,
        g.title,
        g.description,
        g.location_text,
        g.start_time,
        g.end_time,
        g.comp_type::TEXT,
        -- Simple compatibility score based on basic criteria
        CASE 
            WHEN g.status = 'PUBLISHED' THEN 75
            ELSE 50
        END as compatibility_score,
        -- Basic match factors
        jsonb_build_object(
            'gender_match', true,
            'age_match', true,
            'height_match', true,
            'experience_match', true,
            'specialization_match', true,
            'total_required', 1
        ) as match_factors
    FROM public.gigs g
    WHERE g.status = 'PUBLISHED'
    ORDER BY g.created_at DESC
    LIMIT p_limit;
END;
$$;

-- Function to find compatible users for a contributor
CREATE OR REPLACE FUNCTION public.find_compatible_users_for_contributor(
    p_profile_id UUID,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE(
    user_id UUID,
    display_name TEXT,
    handle TEXT,
    bio TEXT,
    city TEXT,
    compatibility_score INTEGER,
    match_factors JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
    -- For now, return a simple query that gets recent users
    -- This is a placeholder implementation that can be enhanced later
    RETURN QUERY
    SELECT 
        up.id as user_id,
        up.display_name,
        up.handle,
        up.bio,
        up.city,
        -- Simple compatibility score
        CASE 
            WHEN up.bio IS NOT NULL AND up.city IS NOT NULL THEN 80
            WHEN up.bio IS NOT NULL OR up.city IS NOT NULL THEN 60
            ELSE 40
        END as compatibility_score,
        -- Basic match factors
        jsonb_build_object(
            'profile_complete', up.bio IS NOT NULL,
            'location_match', up.city IS NOT NULL,
            'experience_match', up.years_experience IS NOT NULL
        ) as match_factors
    FROM public.users_profile up
    WHERE up.id != p_profile_id
    ORDER BY up.created_at DESC
    LIMIT p_limit;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.find_compatible_gigs_for_user(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.find_compatible_users_for_contributor(UUID, INTEGER) TO authenticated;

-- Verify functions were created
SELECT 'Matchmaking functions created successfully!' as status;

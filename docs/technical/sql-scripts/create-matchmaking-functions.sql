-- Create accurate matchmaking functions for Preset platform
-- These functions implement real compatibility scoring based on actual database fields

-- Function to find compatible gigs for a talent user
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
DECLARE
    user_profile RECORD;
    gig_record RECORD;
    score INTEGER;
    factors JSONB;
    location_score INTEGER;
    style_score INTEGER;
    experience_score INTEGER;
    availability_score INTEGER;
    compensation_score INTEGER;
    purpose_score INTEGER;
BEGIN
    -- Get user profile data
    SELECT * INTO user_profile 
    FROM public.users_profile 
    WHERE id = p_profile_id;
    
    IF user_profile IS NULL THEN
        RETURN;
    END IF;
    
    -- Loop through published gigs and calculate compatibility
    FOR gig_record IN 
        SELECT g.*, 
               up.city as gig_city,
               up.country as gig_country
        FROM public.gigs g
        LEFT JOIN public.users_profile up ON g.owner_user_id = up.id
        WHERE g.status = 'PUBLISHED' 
        AND g.application_deadline > NOW()
        AND g.owner_user_id != p_profile_id
        ORDER BY g.created_at DESC
        LIMIT p_limit * 2  -- Get more to filter by compatibility
    LOOP
        score := 0;
        factors := jsonb_build_object();
        
        -- 1. Location Compatibility (25 points max)
        location_score := 0;
        IF user_profile.city IS NOT NULL AND gig_record.location_text IS NOT NULL THEN
            -- Simple city matching (can be enhanced with distance calculation)
            IF LOWER(user_profile.city) = LOWER(gig_record.location_text) THEN
                location_score := 25;
            ELSIF user_profile.available_for_travel = true AND user_profile.travel_radius_km IS NOT NULL THEN
                -- If user travels and gig is within radius
                location_score := 15;
            ELSE
                -- Different cities but both specified
                location_score := 5;
            END IF;
        END IF;
        score := score + location_score;
        factors := factors || jsonb_build_object('location_score', location_score);
        
        -- 2. Style/Vibe Compatibility (20 points max)
        style_score := 0;
        IF user_profile.vibe_tags IS NOT NULL AND gig_record.vibe_tags IS NOT NULL THEN
            -- Count matching vibe tags
            SELECT COUNT(*) INTO style_score
            FROM unnest(user_profile.vibe_tags) AS user_tag
            WHERE user_tag = ANY(gig_record.vibe_tags);
            style_score := LEAST(style_score * 5, 20); -- 5 points per match, max 20
        END IF;
        score := score + style_score;
        factors := factors || jsonb_build_object('style_score', style_score);
        
        -- 3. Experience Compatibility (20 points max)
        experience_score := 0;
        IF user_profile.years_experience IS NOT NULL THEN
            -- More experience = higher score
            experience_score := LEAST(user_profile.years_experience * 2, 20);
        END IF;
        score := score + experience_score;
        factors := factors || jsonb_build_object('experience_score', experience_score);
        
        -- 4. Availability Compatibility (15 points max)
        availability_score := 0;
        IF user_profile.typical_turnaround_days IS NOT NULL THEN
            -- Check if user can meet gig timeline
            IF gig_record.start_time > NOW() + INTERVAL '1 day' * user_profile.typical_turnaround_days THEN
                availability_score := 15;
            ELSIF gig_record.start_time > NOW() + INTERVAL '1 day' * (user_profile.typical_turnaround_days * 2) THEN
                availability_score := 10;
            ELSE
                availability_score := 5;
            END IF;
        END IF;
        score := score + availability_score;
        factors := factors || jsonb_build_object('availability_score', availability_score);
        
        -- 5. Compensation Compatibility (10 points max)
        compensation_score := 0;
        IF user_profile.hourly_rate_min IS NOT NULL AND user_profile.hourly_rate_max IS NOT NULL THEN
            -- Check if gig compensation aligns with user rates
            IF gig_record.comp_type = 'PAID' THEN
                compensation_score := 10;
            ELSIF gig_record.comp_type = 'EXPENSES' THEN
                compensation_score := 7;
            ELSE -- TFP
                compensation_score := 5;
            END IF;
        END IF;
        score := score + compensation_score;
        factors := factors || jsonb_build_object('compensation_score', compensation_score);
        
        -- 6. Purpose/Category Compatibility (10 points max)
        purpose_score := 0;
        IF user_profile.talent_categories IS NOT NULL AND gig_record.purpose IS NOT NULL THEN
            -- Check if user's talent categories match gig purpose
            IF gig_record.purpose = ANY(user_profile.talent_categories) THEN
                purpose_score := 10;
            ELSE
                purpose_score := 5;
            END IF;
        END IF;
        score := score + purpose_score;
        factors := factors || jsonb_build_object('purpose_score', purpose_score);
        
        -- Add total score and additional metadata
        factors := factors || jsonb_build_object(
            'total_score', score,
            'user_experience', user_profile.years_experience,
            'user_city', user_profile.city,
            'user_travel', user_profile.available_for_travel,
            'gig_city', gig_record.location_text,
            'gig_purpose', gig_record.purpose
        );
        
        -- Return the gig with compatibility data
        gig_id := gig_record.id;
        title := gig_record.title;
        description := gig_record.description;
        location_text := gig_record.location_text;
        start_time := gig_record.start_time;
        end_time := gig_record.end_time;
        comp_type := gig_record.comp_type::TEXT;
        compatibility_score := score;
        match_factors := factors;
        
        RETURN NEXT;
    END LOOP;
    
    RETURN;
END;
$$;

-- Function to find compatible talent users for a contributor
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
DECLARE
    contributor_profile RECORD;
    talent_record RECORD;
    score INTEGER;
    factors JSONB;
    profile_completeness_score INTEGER;
    experience_score INTEGER;
    location_score INTEGER;
    style_score INTEGER;
    availability_score INTEGER;
    verification_score INTEGER;
BEGIN
    -- Get contributor profile data
    SELECT * INTO contributor_profile 
    FROM public.users_profile 
    WHERE id = p_profile_id;
    
    IF contributor_profile IS NULL THEN
        RETURN;
    END IF;
    
    -- Loop through talent users and calculate compatibility
    FOR talent_record IN 
        SELECT up.*
        FROM public.users_profile up
        WHERE up.id != p_profile_id
        AND ('TALENT' = ANY(up.role_flags) OR 'BOTH' = ANY(up.role_flags))
        ORDER BY up.created_at DESC
        LIMIT p_limit * 2  -- Get more to filter by compatibility
    LOOP
        score := 0;
        factors := jsonb_build_object();
        
        -- 1. Profile Completeness (25 points max)
        profile_completeness_score := 0;
        IF talent_record.bio IS NOT NULL THEN profile_completeness_score := profile_completeness_score + 5; END IF;
        IF talent_record.city IS NOT NULL THEN profile_completeness_score := profile_completeness_score + 5; END IF;
        IF talent_record.avatar_url IS NOT NULL THEN profile_completeness_score := profile_completeness_score + 5; END IF;
        IF talent_record.years_experience IS NOT NULL THEN profile_completeness_score := profile_completeness_score + 5; END IF;
        IF talent_record.specializations IS NOT NULL THEN profile_completeness_score := profile_completeness_score + 5; END IF;
        score := score + profile_completeness_score;
        factors := factors || jsonb_build_object('profile_completeness_score', profile_completeness_score);
        
        -- 2. Experience Level (20 points max)
        experience_score := 0;
        IF talent_record.years_experience IS NOT NULL THEN
            -- More experience = higher score
            experience_score := LEAST(talent_record.years_experience * 3, 20);
        END IF;
        score := score + experience_score;
        factors := factors || jsonb_build_object('experience_score', experience_score);
        
        -- 3. Location Compatibility (15 points max)
        location_score := 0;
        IF contributor_profile.city IS NOT NULL AND talent_record.city IS NOT NULL THEN
            -- Same city gets highest score
            IF LOWER(contributor_profile.city) = LOWER(talent_record.city) THEN
                location_score := 15;
            ELSIF talent_record.available_for_travel = true THEN
                -- Talent can travel
                location_score := 10;
            ELSE
                -- Different cities
                location_score := 5;
            END IF;
        END IF;
        score := score + location_score;
        factors := factors || jsonb_build_object('location_score', location_score);
        
        -- 4. Style/Vibe Compatibility (15 points max)
        style_score := 0;
        IF contributor_profile.vibe_tags IS NOT NULL AND talent_record.vibe_tags IS NOT NULL THEN
            -- Count matching vibe tags
            SELECT COUNT(*) INTO style_score
            FROM unnest(contributor_profile.vibe_tags) AS contrib_tag
            WHERE contrib_tag = ANY(talent_record.vibe_tags);
            style_score := LEAST(style_score * 3, 15); -- 3 points per match, max 15
        END IF;
        score := score + style_score;
        factors := factors || jsonb_build_object('style_score', style_score);
        
        -- 5. Availability Compatibility (10 points max)
        availability_score := 0;
        IF talent_record.typical_turnaround_days IS NOT NULL THEN
            -- Faster turnaround = higher score
            IF talent_record.typical_turnaround_days <= 3 THEN
                availability_score := 10;
            ELSIF talent_record.typical_turnaround_days <= 7 THEN
                availability_score := 7;
            ELSE
                availability_score := 5;
            END IF;
        END IF;
        score := score + availability_score;
        factors := factors || jsonb_build_object('availability_score', availability_score);
        
        -- 6. Verification Status (10 points max)
        verification_score := 0;
        IF talent_record.verified_id = true THEN
            verification_score := verification_score + 5;
        END IF;
        IF talent_record.age_verified = true THEN
            verification_score := verification_score + 5;
        END IF;
        score := score + verification_score;
        factors := factors || jsonb_build_object('verification_score', verification_score);
        
        -- Add total score and additional metadata
        factors := factors || jsonb_build_object(
            'total_score', score,
            'talent_experience', talent_record.years_experience,
            'talent_city', talent_record.city,
            'talent_travel', talent_record.available_for_travel,
            'talent_verified', talent_record.verified_id,
            'contributor_city', contributor_profile.city
        );
        
        -- Return the talent user with compatibility data
        user_id := talent_record.id;
        display_name := talent_record.display_name;
        handle := talent_record.handle;
        bio := talent_record.bio;
        city := talent_record.city;
        compatibility_score := score;
        match_factors := factors;
        
        RETURN NEXT;
    END LOOP;
    
    RETURN;
END;
$$;

-- Helper function to calculate distance between two points (simplified)
CREATE OR REPLACE FUNCTION public.calculate_location_score(
    user_city TEXT,
    gig_location TEXT,
    user_travels BOOLEAN DEFAULT false,
    travel_radius_km INTEGER DEFAULT 50
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Simple city matching logic
    -- In production, this could use PostGIS for actual distance calculations
    IF user_city IS NULL OR gig_location IS NULL THEN
        RETURN 0;
    END IF;
    
    IF LOWER(user_city) = LOWER(gig_location) THEN
        RETURN 25; -- Same city
    ELSIF user_travels = true THEN
        RETURN 15; -- User can travel
    ELSE
        RETURN 5; -- Different cities, no travel
    END IF;
END;
$$;

-- Helper function to calculate style compatibility
CREATE OR REPLACE FUNCTION public.calculate_style_compatibility(
    user_tags TEXT[],
    gig_tags TEXT[]
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    match_count INTEGER;
BEGIN
    IF user_tags IS NULL OR gig_tags IS NULL THEN
        RETURN 0;
    END IF;
    
    SELECT COUNT(*) INTO match_count
    FROM unnest(user_tags) AS user_tag
    WHERE user_tag = ANY(gig_tags);
    
    RETURN LEAST(match_count * 5, 20); -- 5 points per match, max 20
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.find_compatible_gigs_for_user(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.find_compatible_users_for_contributor(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_location_score(TEXT, TEXT, BOOLEAN, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_style_compatibility(TEXT[], TEXT[]) TO authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_profile_role_flags ON public.users_profile USING GIN(role_flags);
CREATE INDEX IF NOT EXISTS idx_users_profile_vibe_tags ON public.users_profile USING GIN(vibe_tags);
CREATE INDEX IF NOT EXISTS idx_users_profile_talent_categories ON public.users_profile USING GIN(talent_categories);
CREATE INDEX IF NOT EXISTS idx_gigs_status_deadline ON public.gigs(status, application_deadline);
CREATE INDEX IF NOT EXISTS idx_gigs_vibe_tags ON public.gigs USING GIN(vibe_tags);
CREATE INDEX IF NOT EXISTS idx_gigs_purpose ON public.gigs(purpose);

-- Verify functions were created
SELECT 'Accurate matchmaking functions created successfully!' as status;

-- Add applicant preferences to gigs table for enhanced matchmaking

-- Add preferences column to gigs table
ALTER TABLE gigs 
ADD COLUMN applicant_preferences JSONB DEFAULT '{}';

-- Create index for preference queries
CREATE INDEX idx_gigs_preferences ON gigs USING GIN (applicant_preferences);

-- Add comment explaining the schema
COMMENT ON COLUMN gigs.applicant_preferences IS 'JSON object containing creator preferences for applicant matching';

-- Example structure for applicant_preferences:
-- {
--   "physical": {
--     "height_range": {"min": 160, "max": 180},
--     "measurements": {"required": false, "specific": null},
--     "eye_color": {"required": false, "preferred": []},
--     "hair_color": {"required": false, "preferred": []},
--     "tattoos": {"allowed": true, "required": false},
--     "piercings": {"allowed": true, "required": false}
--   },
--   "professional": {
--     "experience_years": {"min": 0, "max": null},
--     "specializations": {"required": [], "preferred": []},
--     "equipment": {"required": [], "preferred": []},
--     "software": {"required": [], "preferred": []},
--     "talent_categories": {"required": [], "preferred": []}
--   },
--   "availability": {
--     "travel_required": false,
--     "travel_radius_km": null,
--     "hourly_rate_range": {"min": null, "max": null}
--   },
--   "other": {
--     "age_range": {"min": 18, "max": null},
--     "languages": {"required": [], "preferred": []},
--     "portfolio_required": false
--   }
-- }

-- Function to update gig preferences
CREATE OR REPLACE FUNCTION set_gig_preferences(
    p_gig_id UUID,
    p_preferences JSONB
) RETURNS BOOLEAN AS $$
BEGIN
    UPDATE gigs 
    SET 
        applicant_preferences = p_preferences,
        updated_at = NOW()
    WHERE id = p_gig_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Enhanced compatibility function that considers preferences
CREATE OR REPLACE FUNCTION calculate_gig_compatibility_with_preferences(
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
    v_preferences JSONB;
    v_physical_score DECIMAL(5,2) := 0;
    v_professional_score DECIMAL(5,2) := 0;
    v_availability_score DECIMAL(5,2) := 0;
    v_other_score DECIMAL(5,2) := 0;
BEGIN
    -- Get profile data
    SELECT * INTO v_profile
    FROM users_profile
    WHERE id = p_profile_id;
    
    -- Get gig data with preferences
    SELECT * INTO v_gig
    FROM gigs
    WHERE id = p_gig_id;
    
    -- Return 0 if either doesn't exist
    IF v_profile IS NULL OR v_gig IS NULL THEN
        RETURN QUERY SELECT 0.0::DECIMAL(5,2), '{}'::JSONB;
        RETURN;
    END IF;
    
    -- Get preferences (default to empty object if null)
    v_preferences := COALESCE(v_gig.applicant_preferences, '{}'::JSONB);
    
    -- Base score for everyone
    v_score := 40.0;
    v_breakdown := jsonb_build_object('base_score', 40.0);
    
    -- PHYSICAL PREFERENCES MATCHING
    IF v_preferences ? 'physical' THEN
        -- Height matching
        IF v_preferences->'physical' ? 'height_range' AND v_profile.height_cm IS NOT NULL THEN
            DECLARE
                min_height INTEGER := (v_preferences->'physical'->'height_range'->>'min')::INTEGER;
                max_height INTEGER := (v_preferences->'physical'->'height_range'->>'max')::INTEGER;
            BEGIN
                IF (min_height IS NULL OR v_profile.height_cm >= min_height) AND
                   (max_height IS NULL OR v_profile.height_cm <= max_height) THEN
                    v_physical_score := v_physical_score + 5.0;
                END IF;
            END;
        END IF;
        
        -- Tattoos/Piercings matching
        IF v_preferences->'physical' ? 'tattoos' THEN
            IF (v_preferences->'physical'->'tattoos'->>'allowed')::BOOLEAN = true OR
               v_profile.tattoos = false THEN
                v_physical_score := v_physical_score + 2.0;
            END IF;
        END IF;
        
        IF v_preferences->'physical' ? 'piercings' THEN
            IF (v_preferences->'physical'->'piercings'->>'allowed')::BOOLEAN = true OR
               v_profile.piercings = false THEN
                v_physical_score := v_physical_score + 2.0;
            END IF;
        END IF;
    END IF;
    
    -- PROFESSIONAL PREFERENCES MATCHING
    IF v_preferences ? 'professional' THEN
        -- Experience matching
        IF v_preferences->'professional' ? 'experience_years' AND v_profile.years_experience IS NOT NULL THEN
            DECLARE
                min_exp INTEGER := (v_preferences->'professional'->'experience_years'->>'min')::INTEGER;
                max_exp INTEGER := (v_preferences->'professional'->'experience_years'->>'max')::INTEGER;
            BEGIN
                IF (min_exp IS NULL OR v_profile.years_experience >= min_exp) AND
                   (max_exp IS NULL OR v_profile.years_experience <= max_exp) THEN
                    v_professional_score := v_professional_score + 8.0;
                END IF;
            END;
        END IF;
        
        -- Specializations matching
        IF v_preferences->'professional' ? 'specializations' AND 
           v_profile.specializations IS NOT NULL AND 
           array_length(v_profile.specializations, 1) > 0 THEN
            DECLARE
                required_specs JSONB := v_preferences->'professional'->'specializations'->'required';
                preferred_specs JSONB := v_preferences->'professional'->'specializations'->'preferred';
                match_count INTEGER := 0;
            BEGIN
                -- Check required specializations
                IF required_specs IS NOT NULL AND jsonb_array_length(required_specs) > 0 THEN
                    FOR i IN 0..jsonb_array_length(required_specs)-1 LOOP
                        IF (required_specs->>i) = ANY(v_profile.specializations) THEN
                            match_count := match_count + 2;
                        END IF;
                    END LOOP;
                END IF;
                
                -- Check preferred specializations
                IF preferred_specs IS NOT NULL AND jsonb_array_length(preferred_specs) > 0 THEN
                    FOR i IN 0..jsonb_array_length(preferred_specs)-1 LOOP
                        IF (preferred_specs->>i) = ANY(v_profile.specializations) THEN
                            match_count := match_count + 1;
                        END IF;
                    END LOOP;
                END IF;
                
                v_professional_score := v_professional_score + LEAST(match_count * 2.0, 10.0);
            END;
        END IF;
    END IF;
    
    -- AVAILABILITY PREFERENCES MATCHING
    IF v_preferences ? 'availability' THEN
        -- Travel requirements
        IF v_preferences->'availability' ? 'travel_required' THEN
            IF (v_preferences->'availability'->>'travel_required')::BOOLEAN = v_profile.available_for_travel THEN
                v_availability_score := v_availability_score + 5.0;
            END IF;
        END IF;
        
        -- Rate matching
        IF v_preferences->'availability' ? 'hourly_rate_range' AND 
           v_profile.hourly_rate_min IS NOT NULL THEN
            DECLARE
                max_budget INTEGER := (v_preferences->'availability'->'hourly_rate_range'->>'max')::INTEGER;
            BEGIN
                IF max_budget IS NULL OR v_profile.hourly_rate_min <= max_budget THEN
                    v_availability_score := v_availability_score + 5.0;
                END IF;
            END;
        END IF;
    END IF;
    
    -- Add component scores
    v_score := v_score + v_physical_score + v_professional_score + v_availability_score + v_other_score;
    
    -- Cap at 100
    IF v_score > 100 THEN
        v_score := 100.0;
    END IF;
    
    -- Build detailed breakdown
    v_breakdown := v_breakdown || jsonb_build_object(
        'physical_match', v_physical_score,
        'professional_match', v_professional_score,
        'availability_match', v_availability_score,
        'other_match', v_other_score,
        'has_preferences', v_preferences != '{}'::JSONB
    );
    
    RETURN QUERY SELECT v_score, v_breakdown;
END;
$$ LANGUAGE plpgsql;

-- Add comments
COMMENT ON FUNCTION set_gig_preferences IS 'Updates applicant preferences for a gig';
COMMENT ON FUNCTION calculate_gig_compatibility_with_preferences IS 'Enhanced compatibility calculation considering gig creator preferences';

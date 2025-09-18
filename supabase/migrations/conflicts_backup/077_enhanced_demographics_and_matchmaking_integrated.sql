-- Enhanced Demographics and Matchmaking System - Integrated Approach
-- This migration builds upon existing database structure instead of creating duplicates
-- It enhances existing tables and adds missing functionality for better matchmaking

-- ==============================================
-- 1. ENHANCE EXISTING ENUMS AND TYPES
-- ==============================================

-- Add new enums for enhanced demographics
CREATE TYPE gender_identity AS ENUM (
    'male', 'female', 'non_binary', 'genderfluid', 'agender', 
    'transgender_male', 'transgender_female', 'prefer_not_to_say', 'other'
);

CREATE TYPE ethnicity AS ENUM (
    'african_american', 'asian', 'caucasian', 'hispanic_latino', 
    'middle_eastern', 'native_american', 'pacific_islander', 
    'mixed_race', 'other', 'prefer_not_to_say'
);

CREATE TYPE body_type AS ENUM (
    'petite', 'slim', 'athletic', 'average', 'curvy', 'plus_size', 
    'muscular', 'tall', 'short', 'other'
);

CREATE TYPE experience_level AS ENUM (
    'beginner', 'intermediate', 'advanced', 'professional', 'expert'
);

CREATE TYPE availability_status AS ENUM (
    'available', 'busy', 'unavailable', 'limited', 'weekends_only', 'weekdays_only'
);

-- ==============================================
-- 2. ENHANCE EXISTING users_profile TABLE
-- ==============================================

-- Add missing demographic fields to existing users_profile table
ALTER TABLE users_profile 
ADD COLUMN IF NOT EXISTS gender_identity gender_identity,
ADD COLUMN IF NOT EXISTS ethnicity ethnicity,
ADD COLUMN IF NOT EXISTS nationality VARCHAR(100),
ADD COLUMN IF NOT EXISTS weight_kg INTEGER,
ADD COLUMN IF NOT EXISTS body_type body_type,
ADD COLUMN IF NOT EXISTS hair_length VARCHAR(50),
ADD COLUMN IF NOT EXISTS skin_tone VARCHAR(50),
ADD COLUMN IF NOT EXISTS experience_level experience_level DEFAULT 'beginner',
ADD COLUMN IF NOT EXISTS state_province VARCHAR(100),
ADD COLUMN IF NOT EXISTS timezone VARCHAR(50),
ADD COLUMN IF NOT EXISTS passport_valid BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS availability_status availability_status DEFAULT 'available',
ADD COLUMN IF NOT EXISTS preferred_working_hours TEXT,
ADD COLUMN IF NOT EXISTS blackout_dates DATE[],
ADD COLUMN IF NOT EXISTS show_age BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS show_location BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS show_physical_attributes BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS accepts_tfp BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS accepts_expenses_only BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS prefers_studio BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS prefers_outdoor BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS available_weekdays BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS available_weekends BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS available_evenings BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS available_overnight BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS works_with_teams BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS prefers_solo_work BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS comfortable_with_nudity BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS comfortable_with_intimate_content BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS requires_model_release BOOLEAN DEFAULT TRUE;

-- Add constraints for new fields (using DO block to check if constraints exist)
DO $$
BEGIN
    -- Add weight constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_weight_positive' 
        AND conrelid = 'users_profile'::regclass
    ) THEN
        ALTER TABLE users_profile 
        ADD CONSTRAINT check_weight_positive CHECK (weight_kg IS NULL OR weight_kg BETWEEN 30 AND 200);
    END IF;
    
    -- Add years experience constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_years_experience_positive' 
        AND conrelid = 'users_profile'::regclass
    ) THEN
        ALTER TABLE users_profile 
        ADD CONSTRAINT check_years_experience_positive CHECK (years_experience >= 0);
    END IF;
END $$;

-- ==============================================
-- 3. CREATE STRUCTURED SPECIALIZATION SYSTEM
-- ==============================================

-- Create specialization categories table
CREATE TABLE IF NOT EXISTS specialization_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create individual specializations table
CREATE TABLE IF NOT EXISTS specializations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES specialization_categories(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    skill_levels TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(category_id, name)
);

-- Create user specializations junction table
CREATE TABLE IF NOT EXISTS user_specializations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
    specialization_id UUID NOT NULL REFERENCES specializations(id) ON DELETE CASCADE,
    skill_level VARCHAR(50) DEFAULT 'intermediate',
    years_experience INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT FALSE,
    portfolio_items UUID[], -- references to media table
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(profile_id, specialization_id)
);

-- ==============================================
-- 4. ENHANCE EXISTING EQUIPMENT SYSTEM
-- ==============================================

-- Add software tools table to complement existing equipment system
CREATE TABLE IF NOT EXISTS software_tools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'editing', 'design', 'photography', 'video'
    description TEXT,
    version VARCHAR(50),
    is_subscription BOOLEAN DEFAULT FALSE,
    monthly_cost DECIMAL(10,2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user software proficiency table
CREATE TABLE IF NOT EXISTS user_software_proficiency (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
    software_id UUID NOT NULL REFERENCES software_tools(id) ON DELETE CASCADE,
    proficiency_level VARCHAR(50) DEFAULT 'intermediate',
    years_using INTEGER DEFAULT 0,
    certification BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(profile_id, software_id)
);

-- ==============================================
-- 5. CREATE GIG REQUIREMENTS SYSTEM
-- ==============================================

-- Create gig requirements table to extend existing gigs table
CREATE TABLE IF NOT EXISTS gig_requirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gig_id UUID NOT NULL REFERENCES gigs(id) ON DELETE CASCADE,
    
    -- Demographic requirements
    required_gender gender_identity[],
    required_ethnicity ethnicity[],
    age_range_min INTEGER,
    age_range_max INTEGER,
    height_range_min INTEGER,
    height_range_max INTEGER,
    
    -- Professional requirements
    required_experience_level experience_level,
    required_years_experience INTEGER,
    required_specializations UUID[], -- references specializations table
    
    -- Physical requirements
    required_body_type body_type[],
    required_eye_color VARCHAR(50)[],
    required_hair_color VARCHAR(50)[],
    tattoos_allowed BOOLEAN DEFAULT TRUE,
    piercings_allowed BOOLEAN DEFAULT FALSE,
    
    -- Location requirements
    must_be_local BOOLEAN DEFAULT FALSE,
    travel_required BOOLEAN DEFAULT FALSE,
    passport_required BOOLEAN DEFAULT FALSE,
    
    -- Equipment requirements
    must_have_equipment UUID[], -- references equipment tables
    must_have_software UUID[], -- references software_tools table
    
    -- Content requirements
    nudity_involved BOOLEAN DEFAULT FALSE,
    intimate_content BOOLEAN DEFAULT FALSE,
    model_release_required BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_age_range CHECK (
        age_range_min IS NULL OR age_range_max IS NULL OR age_range_min <= age_range_max
    ),
    CONSTRAINT valid_height_range CHECK (
        height_range_min IS NULL OR height_range_max IS NULL OR height_range_min <= height_range_max
    ),
    CONSTRAINT valid_experience CHECK (
        required_years_experience IS NULL OR required_years_experience >= 0
    )
);

-- ==============================================
-- 6. CREATE INDEXES FOR PERFORMANCE
-- ==============================================

-- Enhanced users_profile indexes
CREATE INDEX IF NOT EXISTS idx_users_profile_gender ON users_profile(gender_identity);
CREATE INDEX IF NOT EXISTS idx_users_profile_ethnicity ON users_profile(ethnicity);
CREATE INDEX IF NOT EXISTS idx_users_profile_nationality ON users_profile(nationality);
CREATE INDEX IF NOT EXISTS idx_users_profile_body_type ON users_profile(body_type);
CREATE INDEX IF NOT EXISTS idx_users_profile_experience_level ON users_profile(experience_level);
CREATE INDEX IF NOT EXISTS idx_users_profile_availability ON users_profile(availability_status);
CREATE INDEX IF NOT EXISTS idx_users_profile_tfp ON users_profile(accepts_tfp);
CREATE INDEX IF NOT EXISTS idx_users_profile_travel ON users_profile(available_for_travel, travel_radius_km);
CREATE INDEX IF NOT EXISTS idx_users_profile_location ON users_profile(country, state_province, city);

-- Specialization indexes
CREATE INDEX IF NOT EXISTS idx_specialization_categories_active ON specialization_categories(is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_specializations_category ON specializations(category_id, is_active);
CREATE INDEX IF NOT EXISTS idx_user_specializations_profile ON user_specializations(profile_id);
CREATE INDEX IF NOT EXISTS idx_user_specializations_specialization ON user_specializations(specialization_id);
CREATE INDEX IF NOT EXISTS idx_user_specializations_primary ON user_specializations(profile_id, is_primary) WHERE is_primary = TRUE;

-- Software proficiency indexes
CREATE INDEX IF NOT EXISTS idx_software_tools_category ON software_tools(category, is_active);
CREATE INDEX IF NOT EXISTS idx_user_software_proficiency_profile ON user_software_proficiency(profile_id);
CREATE INDEX IF NOT EXISTS idx_user_software_proficiency_software ON user_software_proficiency(software_id);

-- Gig requirements indexes
CREATE INDEX IF NOT EXISTS idx_gig_requirements_gig ON gig_requirements(gig_id);
CREATE INDEX IF NOT EXISTS idx_gig_requirements_gender ON gig_requirements USING GIN(required_gender);
CREATE INDEX IF NOT EXISTS idx_gig_requirements_ethnicity ON gig_requirements USING GIN(required_ethnicity);
CREATE INDEX IF NOT EXISTS idx_gig_requirements_age ON gig_requirements(age_range_min, age_range_max);
CREATE INDEX IF NOT EXISTS idx_gig_requirements_height ON gig_requirements(height_range_min, height_range_max);
CREATE INDEX IF NOT EXISTS idx_gig_requirements_experience ON gig_requirements(required_experience_level, required_years_experience);

-- ==============================================
-- 7. ROW LEVEL SECURITY POLICIES
-- ==============================================

-- Enable RLS on new tables
ALTER TABLE specialization_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE specializations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_specializations ENABLE ROW LEVEL SECURITY;
ALTER TABLE software_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_software_proficiency ENABLE ROW LEVEL SECURITY;
ALTER TABLE gig_requirements ENABLE ROW LEVEL SECURITY;

-- Specialization policies
CREATE POLICY "Anyone can view specialization categories" ON specialization_categories
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Anyone can view active specializations" ON specializations
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Anyone can view user specializations" ON user_specializations
    FOR SELECT USING (true);

CREATE POLICY "Users can manage own specializations" ON user_specializations
    FOR ALL USING (
        profile_id IN (SELECT id FROM users_profile WHERE user_id = auth.uid())
    );

-- Software tools policies
CREATE POLICY "Anyone can view software tools" ON software_tools
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Anyone can view user software proficiency" ON user_software_proficiency
    FOR SELECT USING (true);

CREATE POLICY "Users can manage own software proficiency" ON user_software_proficiency
    FOR ALL USING (
        profile_id IN (SELECT id FROM users_profile WHERE user_id = auth.uid())
    );

-- Gig requirements policies
CREATE POLICY "Anyone can view gig requirements" ON gig_requirements
    FOR SELECT USING (true);

CREATE POLICY "Gig owners can manage requirements" ON gig_requirements
    FOR ALL USING (
        gig_id IN (
            SELECT id FROM gigs 
            WHERE owner_user_id IN (SELECT id FROM users_profile WHERE user_id = auth.uid())
        )
    );

-- ==============================================
-- 8. MIGRATION FUNCTIONS
-- ==============================================

-- Function to migrate existing specializations TEXT[] to structured system
CREATE OR REPLACE FUNCTION migrate_existing_specializations()
RETURNS void AS $$
DECLARE
    rec RECORD;
    cat_id UUID;
    spec_id UUID;
BEGIN
    -- Create a general category for existing specializations
    INSERT INTO specialization_categories (name, display_name, description, sort_order)
    VALUES ('general', 'General', 'General specializations migrated from existing data', 999)
    ON CONFLICT (name) DO NOTHING;
    
    SELECT id INTO cat_id FROM specialization_categories WHERE name = 'general';
    
    -- Migrate existing specializations
    FOR rec IN 
        SELECT DISTINCT unnest(specializations) as spec_name
        FROM users_profile 
        WHERE specializations IS NOT NULL AND array_length(specializations, 1) > 0
    LOOP
        -- Insert specialization if it doesn't exist
        INSERT INTO specializations (category_id, name, display_name, description)
        VALUES (cat_id, rec.spec_name, rec.spec_name, 'Migrated from existing specializations')
        ON CONFLICT (category_id, name) DO NOTHING;
        
        -- Get the specialization ID
        SELECT id INTO spec_id FROM specializations 
        WHERE category_id = cat_id AND name = rec.spec_name;
        
        -- Create user specializations for users who have this specialization
        INSERT INTO user_specializations (profile_id, specialization_id, skill_level, is_primary)
        SELECT up.id, spec_id, 'intermediate', false
        FROM users_profile up
        WHERE rec.spec_name = ANY(up.specializations)
        ON CONFLICT (profile_id, specialization_id) DO NOTHING;
    END LOOP;
    
    RAISE NOTICE 'Migration of existing specializations completed';
END;
$$ LANGUAGE plpgsql;

-- Function to migrate existing editing_software TEXT[] to structured system
CREATE OR REPLACE FUNCTION migrate_existing_software()
RETURNS void AS $$
DECLARE
    rec RECORD;
    software_id UUID;
BEGIN
    -- Migrate existing editing software
    FOR rec IN 
        SELECT DISTINCT unnest(editing_software) as software_name
        FROM users_profile 
        WHERE editing_software IS NOT NULL AND array_length(editing_software, 1) > 0
    LOOP
        -- Insert software tool if it doesn't exist
        INSERT INTO software_tools (name, display_name, category, description)
        VALUES (rec.software_name, rec.software_name, 'editing', 'Migrated from existing editing software')
        ON CONFLICT (name) DO NOTHING;
        
        -- Get the software ID
        SELECT id INTO software_id FROM software_tools WHERE name = rec.software_name;
        
        -- Create user software proficiency for users who have this software
        INSERT INTO user_software_proficiency (profile_id, software_id, proficiency_level)
        SELECT up.id, software_id, 'intermediate'
        FROM users_profile up
        WHERE rec.software_name = ANY(up.editing_software)
        ON CONFLICT (profile_id, software_id) DO NOTHING;
    END LOOP;
    
    RAISE NOTICE 'Migration of existing editing software completed';
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- 9. MATCHMAKING FUNCTIONS
-- ==============================================

-- Function to calculate compatibility score between user and gig
CREATE OR REPLACE FUNCTION calculate_gig_compatibility(
    p_profile_id UUID,
    p_gig_id UUID
) RETURNS TABLE (
    compatibility_score DECIMAL(5,2),
    match_factors JSONB
) AS $$
DECLARE
    v_score DECIMAL(5,2) := 0;
    v_factors JSONB := '{}';
    v_profile RECORD;
    v_requirements RECORD;
    v_specializations INTEGER;
    v_total_requirements INTEGER;
BEGIN
    -- Get user profile data
    SELECT * INTO v_profile
    FROM users_profile
    WHERE id = p_profile_id;
    
    -- Get gig requirements
    SELECT * INTO v_requirements
    FROM gig_requirements
    WHERE gig_id = p_gig_id;
    
    -- If no requirements, return neutral score
    IF v_requirements IS NULL THEN
        RETURN QUERY SELECT 50.0::DECIMAL(5,2), '{"reason": "no_requirements"}'::JSONB;
        RETURN;
    END IF;
    
    -- Check gender compatibility (20 points)
    IF v_requirements.required_gender IS NULL OR 
       v_profile.gender_identity = ANY(v_requirements.required_gender) THEN
        v_score := v_score + 20;
        v_factors := v_factors || '{"gender_match": true}'::JSONB;
    ELSE
        v_factors := v_factors || '{"gender_match": false}'::JSONB;
    END IF;
    
    -- Check age compatibility (20 points)
    IF v_requirements.age_range_min IS NULL OR v_requirements.age_range_max IS NULL OR
       (EXTRACT(YEAR FROM AGE(v_profile.date_of_birth)) >= v_requirements.age_range_min AND 
        EXTRACT(YEAR FROM AGE(v_profile.date_of_birth)) <= v_requirements.age_range_max) THEN
        v_score := v_score + 20;
        v_factors := v_factors || '{"age_match": true}'::JSONB;
    ELSE
        v_factors := v_factors || '{"age_match": false}'::JSONB;
    END IF;
    
    -- Check height compatibility (15 points)
    IF v_requirements.height_range_min IS NULL OR v_requirements.height_range_max IS NULL OR
       (v_profile.height_cm >= v_requirements.height_range_min AND 
        v_profile.height_cm <= v_requirements.height_range_max) THEN
        v_score := v_score + 15;
        v_factors := v_factors || '{"height_match": true}'::JSONB;
    ELSE
        v_factors := v_factors || '{"height_match": false}'::JSONB;
    END IF;
    
    -- Check experience compatibility (25 points)
    IF v_requirements.required_years_experience IS NULL OR
       v_profile.years_experience >= v_requirements.required_years_experience THEN
        v_score := v_score + 25;
        v_factors := v_factors || '{"experience_match": true}'::JSONB;
    ELSE
        v_factors := v_factors || '{"experience_match": false}'::JSONB;
    END IF;
    
    -- Check specialization compatibility (20 points)
    IF v_requirements.required_specializations IS NULL THEN
        v_score := v_score + 20;
        v_factors := v_factors || '{"specialization_match": "no_requirements"}'::JSONB;
    ELSE
        SELECT COUNT(*) INTO v_specializations
        FROM user_specializations us
        WHERE us.profile_id = p_profile_id
        AND us.specialization_id = ANY(v_requirements.required_specializations);
        
        v_total_requirements := array_length(v_requirements.required_specializations, 1);
        
        IF v_specializations > 0 THEN
            v_score := v_score + (20.0 * v_specializations / v_total_requirements);
            v_factors := v_factors || jsonb_build_object('specialization_match', v_specializations, 'total_required', v_total_requirements);
        ELSE
            v_factors := v_factors || '{"specialization_match": 0}'::JSONB;
        END IF;
    END IF;
    
    RETURN QUERY SELECT v_score, v_factors;
END;
$$ LANGUAGE plpgsql;

-- Function to find compatible users for a gig
CREATE OR REPLACE FUNCTION find_compatible_users_for_gig(
    p_gig_id UUID,
    p_limit INTEGER DEFAULT 20
) RETURNS TABLE (
    profile_id UUID,
    compatibility_score DECIMAL(5,2),
    match_factors JSONB,
    display_name VARCHAR(255),
    city VARCHAR(255)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        up.id,
        cs.compatibility_score,
        cs.match_factors,
        up.display_name,
        up.city
    FROM users_profile up
    CROSS JOIN LATERAL calculate_gig_compatibility(up.id, p_gig_id) cs
    WHERE cs.compatibility_score >= 60.0 -- Minimum compatibility threshold
    ORDER BY cs.compatibility_score DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to find compatible gigs for a user
CREATE OR REPLACE FUNCTION find_compatible_gigs_for_user(
    p_profile_id UUID,
    p_limit INTEGER DEFAULT 20
) RETURNS TABLE (
    gig_id UUID,
    compatibility_score DECIMAL(5,2),
    match_factors JSONB,
    title VARCHAR(255),
    location_text VARCHAR(255),
    start_time TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        g.id,
        cs.compatibility_score,
        cs.match_factors,
        g.title,
        g.location_text,
        g.start_time
    FROM gigs g
    JOIN gig_requirements gr ON g.id = gr.gig_id
    CROSS JOIN LATERAL calculate_gig_compatibility(p_profile_id, g.id) cs
    WHERE g.status = 'PUBLISHED'
    AND cs.compatibility_score >= 60.0 -- Minimum compatibility threshold
    ORDER BY cs.compatibility_score DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- 10. POPULATE DEFAULT DATA
-- ==============================================

-- Insert default specialization categories
INSERT INTO specialization_categories (name, display_name, description, icon, sort_order) VALUES
('photography', 'Photography', 'Photography specializations', 'camera', 1),
('videography', 'Videography', 'Video production specializations', 'video', 2),
('modeling', 'Modeling', 'Modeling and posing specializations', 'user', 3),
('styling', 'Styling', 'Fashion and wardrobe styling', 'shirt', 4),
('makeup', 'Makeup', 'Makeup artistry specializations', 'palette', 5),
('hair', 'Hair Styling', 'Hair styling and design', 'scissors', 6),
('editing', 'Post-Production', 'Photo and video editing', 'edit', 7),
('production', 'Production', 'Production and coordination', 'users', 8)
ON CONFLICT (name) DO NOTHING;

-- Insert default specializations
INSERT INTO specializations (category_id, name, display_name, description, skill_levels) 
SELECT 
    sc.id,
    spec.name,
    spec.display_name,
    spec.description,
    spec.skill_levels
FROM specialization_categories sc
CROSS JOIN (VALUES
    ('portrait', 'Portrait Photography', 'Professional portrait photography', ARRAY['beginner', 'intermediate', 'advanced']),
    ('fashion', 'Fashion Photography', 'Fashion and editorial photography', ARRAY['intermediate', 'advanced']),
    ('commercial', 'Commercial Photography', 'Commercial and advertising photography', ARRAY['intermediate', 'advanced']),
    ('wedding', 'Wedding Photography', 'Wedding and event photography', ARRAY['beginner', 'intermediate', 'advanced']),
    ('street', 'Street Photography', 'Urban and street photography', ARRAY['beginner', 'intermediate', 'advanced']),
    ('nature', 'Nature Photography', 'Landscape and nature photography', ARRAY['beginner', 'intermediate', 'advanced']),
    ('product', 'Product Photography', 'Product and e-commerce photography', ARRAY['beginner', 'intermediate', 'advanced']),
    ('documentary', 'Documentary Photography', 'Documentary and photojournalism', ARRAY['intermediate', 'advanced'])
) AS spec(name, display_name, description, skill_levels)
WHERE sc.name = 'photography'
ON CONFLICT (category_id, name) DO NOTHING;

-- Insert video specializations
INSERT INTO specializations (category_id, name, display_name, description, skill_levels) 
SELECT 
    sc.id,
    spec.name,
    spec.display_name,
    spec.description,
    spec.skill_levels
FROM specialization_categories sc
CROSS JOIN (VALUES
    ('cinematography', 'Cinematography', 'Professional video cinematography', ARRAY['intermediate', 'advanced']),
    ('documentary', 'Documentary Video', 'Documentary and journalistic video', ARRAY['beginner', 'intermediate', 'advanced']),
    ('commercial', 'Commercial Video', 'Commercial and advertising video', ARRAY['intermediate', 'advanced']),
    ('music_video', 'Music Video', 'Music video production', ARRAY['intermediate', 'advanced']),
    ('event', 'Event Videography', 'Wedding and event videography', ARRAY['beginner', 'intermediate', 'advanced']),
    ('social_media', 'Social Media Content', 'Social media video content', ARRAY['beginner', 'intermediate', 'advanced'])
) AS spec(name, display_name, description, skill_levels)
WHERE sc.name = 'videography'
ON CONFLICT (category_id, name) DO NOTHING;

-- Insert modeling specializations
INSERT INTO specializations (category_id, name, display_name, description, skill_levels) 
SELECT 
    sc.id,
    spec.name,
    spec.display_name,
    spec.description,
    spec.skill_levels
FROM specialization_categories sc
CROSS JOIN (VALUES
    ('fashion_model', 'Fashion Model', 'Fashion and runway modeling', ARRAY['beginner', 'intermediate', 'advanced']),
    ('commercial_model', 'Commercial Model', 'Commercial and advertising modeling', ARRAY['beginner', 'intermediate', 'advanced']),
    ('portrait_model', 'Portrait Model', 'Portrait and artistic modeling', ARRAY['beginner', 'intermediate', 'advanced']),
    ('fitness_model', 'Fitness Model', 'Fitness and athletic modeling', ARRAY['intermediate', 'advanced']),
    ('plus_size_model', 'Plus Size Model', 'Plus size and curve modeling', ARRAY['beginner', 'intermediate', 'advanced']),
    ('mature_model', 'Mature Model', 'Mature and senior modeling', ARRAY['beginner', 'intermediate', 'advanced'])
) AS spec(name, display_name, description, skill_levels)
WHERE sc.name = 'modeling'
ON CONFLICT (category_id, name) DO NOTHING;

-- Insert default software tools
INSERT INTO software_tools (name, display_name, category, description, is_subscription, monthly_cost) VALUES
('photoshop', 'Adobe Photoshop', 'editing', 'Professional photo editing software', TRUE, 20.99),
('lightroom', 'Adobe Lightroom', 'editing', 'Photo organization and editing', TRUE, 9.99),
('premiere_pro', 'Adobe Premiere Pro', 'editing', 'Professional video editing', TRUE, 20.99),
('after_effects', 'Adobe After Effects', 'editing', 'Motion graphics and visual effects', TRUE, 20.99),
('final_cut_pro', 'Final Cut Pro', 'editing', 'Professional video editing for Mac', FALSE, NULL),
('davinci_resolve', 'DaVinci Resolve', 'editing', 'Professional color grading and editing', FALSE, NULL),
('capture_one', 'Capture One', 'editing', 'Professional photo editing and tethering', TRUE, 24.00),
('figma', 'Figma', 'design', 'Collaborative design tool', TRUE, 12.00),
('canva', 'Canva', 'design', 'Graphic design platform', TRUE, 12.99),
('blender', 'Blender', 'design', '3D creation and animation', FALSE, NULL)
ON CONFLICT (name) DO NOTHING;

-- ==============================================
-- 11. RUN MIGRATION FUNCTIONS
-- ==============================================

-- Migrate existing data
SELECT migrate_existing_specializations();
SELECT migrate_existing_software();

-- ==============================================
-- 12. UPDATE TRIGGERS
-- ==============================================

-- Create update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update triggers
CREATE TRIGGER update_gig_requirements_updated_at
    BEFORE UPDATE ON gig_requirements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- 13. COMMENTS AND DOCUMENTATION
-- ==============================================

COMMENT ON TABLE specialization_categories IS 'Categories for organizing professional specializations';
COMMENT ON TABLE specializations IS 'Individual specializations within categories';
COMMENT ON TABLE user_specializations IS 'User proficiency in specific specializations';
COMMENT ON TABLE software_tools IS 'Software and tools with subscription information';
COMMENT ON TABLE user_software_proficiency IS 'User proficiency in specific software tools';
COMMENT ON TABLE gig_requirements IS 'Detailed requirements for gigs to enable better matching';

COMMENT ON FUNCTION calculate_gig_compatibility IS 'Calculates compatibility score between user and gig based on requirements';
COMMENT ON FUNCTION find_compatible_users_for_gig IS 'Finds users compatible with a specific gig';
COMMENT ON FUNCTION find_compatible_gigs_for_user IS 'Finds gigs compatible with a specific user';
COMMENT ON FUNCTION migrate_existing_specializations IS 'Migrates existing specializations TEXT[] to structured system';
COMMENT ON FUNCTION migrate_existing_software IS 'Migrates existing editing_software TEXT[] to structured system';

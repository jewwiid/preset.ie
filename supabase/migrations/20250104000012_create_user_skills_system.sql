-- Create user skills system for per-skill years of experience
-- This allows users to specify years of experience for each specialization

-- Step 1: Create enum types (only if they don't exist)
DO $$ BEGIN
    CREATE TYPE skill_type AS ENUM ('technical', 'creative', 'equipment', 'software', 'interpersonal');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE proficiency_level AS ENUM ('beginner', 'intermediate', 'advanced', 'expert');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 2: Create user_skills table
CREATE TABLE IF NOT EXISTS user_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
    skill_type skill_type NOT NULL,
    skill_name VARCHAR(100) NOT NULL,
    proficiency_level proficiency_level DEFAULT 'intermediate',
    years_experience INTEGER CHECK (years_experience >= 0 AND years_experience <= 50),
    verified BOOLEAN DEFAULT false,
    verified_by UUID REFERENCES users_profile(id),
    verified_at TIMESTAMPTZ,
    description TEXT, -- Additional details about the skill
    is_featured BOOLEAN DEFAULT false, -- Show prominently on profile
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure unique combination of profile and skill
    UNIQUE(profile_id, skill_name)
);

-- Step 3: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_skills_profile_id ON user_skills(profile_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_type ON user_skills(skill_type);
CREATE INDEX IF NOT EXISTS idx_user_skills_name ON user_skills(skill_name);
CREATE INDEX IF NOT EXISTS idx_user_skills_proficiency ON user_skills(proficiency_level);
CREATE INDEX IF NOT EXISTS idx_user_skills_years ON user_skills(years_experience);
CREATE INDEX IF NOT EXISTS idx_user_skills_featured ON user_skills(profile_id, is_featured) WHERE is_featured = TRUE;

-- Step 4: Enable RLS
ALTER TABLE user_skills ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS policies
-- Public can view user skills
CREATE POLICY "Anyone can view user skills" ON user_skills
    FOR SELECT USING (true);

-- Users can manage their own skills
CREATE POLICY "Users can manage their own skills" ON user_skills
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users_profile up 
            WHERE up.id = user_skills.profile_id 
            AND up.user_id = auth.uid()
        )
    );

-- Step 6: Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_user_skills_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_skills_updated_at 
    BEFORE UPDATE ON user_skills 
    FOR EACH ROW EXECUTE FUNCTION update_user_skills_updated_at();

-- Step 7: Create view for user skills with proficiency details
CREATE OR REPLACE VIEW user_skills_view AS
SELECT 
    us.id,
    us.profile_id,
    up.display_name,
    up.handle,
    us.skill_type,
    us.skill_name,
    us.proficiency_level,
    us.years_experience,
    us.verified,
    us.description,
    us.is_featured,
    us.created_at,
    us.updated_at,
    -- Calculate experience level based on years
    CASE 
        WHEN us.years_experience IS NULL THEN 'Not specified'
        WHEN us.years_experience = 0 THEN 'Beginner'
        WHEN us.years_experience BETWEEN 1 AND 2 THEN 'Novice'
        WHEN us.years_experience BETWEEN 3 AND 5 THEN 'Intermediate'
        WHEN us.years_experience BETWEEN 6 AND 10 THEN 'Advanced'
        WHEN us.years_experience > 10 THEN 'Expert'
        ELSE 'Not specified'
    END as experience_level_label
FROM user_skills us
JOIN users_profile up ON us.profile_id = up.id;

-- Step 8: Create function to migrate existing specializations to user_skills
CREATE OR REPLACE FUNCTION migrate_specializations_to_user_skills()
RETURNS TEXT AS $$
DECLARE
    migration_count INTEGER := 0;
    profile_record RECORD;
    specialization_name TEXT;
BEGIN
    -- Loop through all users with specializations
    FOR profile_record IN 
        SELECT id, specializations 
        FROM users_profile 
        WHERE specializations IS NOT NULL 
        AND array_length(specializations, 1) > 0
    LOOP
        -- Loop through each specialization
        FOREACH specialization_name IN ARRAY profile_record.specializations
        LOOP
            -- Insert as user skill (assuming 'creative' type for specializations)
            INSERT INTO user_skills (profile_id, skill_type, skill_name, years_experience)
            VALUES (profile_record.id, 'creative', specialization_name, NULL)
            ON CONFLICT (profile_id, skill_name) DO NOTHING;
            
            migration_count := migration_count + 1;
        END LOOP;
    END LOOP;
    
    RETURN format('Migrated %s specializations to user_skills', migration_count);
END;
$$ LANGUAGE plpgsql;

-- Step 9: Add comments for documentation
COMMENT ON TABLE user_skills IS 'User skills with per-skill years of experience and proficiency levels';
COMMENT ON COLUMN user_skills.skill_type IS 'Type of skill: technical, creative, equipment, software, interpersonal';
COMMENT ON COLUMN user_skills.skill_name IS 'Name of the skill/specialization';
COMMENT ON COLUMN user_skills.proficiency_level IS 'User proficiency level: beginner, intermediate, advanced, expert';
COMMENT ON COLUMN user_skills.years_experience IS 'Years of experience in this specific skill (0-50)';
COMMENT ON COLUMN user_skills.verified IS 'Whether this skill has been verified by another user';
COMMENT ON COLUMN user_skills.is_featured IS 'Show this skill prominently on the profile';
COMMENT ON VIEW user_skills_view IS 'View of user skills with calculated experience level labels';

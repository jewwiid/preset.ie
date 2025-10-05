-- Create predefined professional skills table
-- This provides structured options for professional skills, tools, and certifications

-- Step 1: Create the table
CREATE TABLE IF NOT EXISTS predefined_professional_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skill_name TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Add comments
COMMENT ON TABLE predefined_professional_skills IS 'Predefined professional skills, tools, and certifications for contributors';
COMMENT ON COLUMN predefined_professional_skills.skill_name IS 'Name of the skill, tool, or certification';
COMMENT ON COLUMN predefined_professional_skills.category IS 'Category: software, tools, certifications, languages, methodologies';
COMMENT ON COLUMN predefined_professional_skills.description IS 'Description of what the skill involves';
COMMENT ON COLUMN predefined_professional_skills.is_active IS 'Whether this skill is currently available for selection';
COMMENT ON COLUMN predefined_professional_skills.sort_order IS 'Order for displaying skills within categories';

-- Step 3: Enable RLS
ALTER TABLE predefined_professional_skills ENABLE ROW LEVEL SECURITY;

-- Step 4: Create policies for public read access
CREATE POLICY "Anyone can read active professional skills" ON predefined_professional_skills
    FOR SELECT USING (is_active = true);

-- Step 5: Create indexes
CREATE INDEX IF NOT EXISTS idx_predefined_professional_skills_category ON predefined_professional_skills(category);
CREATE INDEX IF NOT EXISTS idx_predefined_professional_skills_active ON predefined_professional_skills(is_active);
CREATE INDEX IF NOT EXISTS idx_predefined_professional_skills_sort_order ON predefined_professional_skills(sort_order);

-- Step 6: Insert common professional skills
INSERT INTO predefined_professional_skills (skill_name, category, description, sort_order) VALUES
-- Software Tools
('Adobe Creative Suite', 'software', 'Adobe Photoshop, Illustrator, InDesign, Premiere Pro, After Effects', 1),
('Final Cut Pro', 'software', 'Professional video editing software', 2),
('DaVinci Resolve', 'software', 'Professional color grading and video editing', 3),
('Avid Media Composer', 'software', 'Professional video editing platform', 4),
('Pro Tools', 'software', 'Digital audio workstation for music and post-production', 5),
('Logic Pro', 'software', 'Digital audio workstation for Mac', 6),
('Ableton Live', 'software', 'Digital audio workstation for music production', 7),
('Cinema 4D', 'software', '3D modeling and animation software', 8),
('Blender', 'software', 'Free 3D creation suite', 9),
('Maya', 'software', '3D animation and modeling software', 10),
('3ds Max', 'software', '3D modeling and rendering software', 11),
('SketchUp', 'software', '3D modeling software', 12),
('Figma', 'software', 'Collaborative design tool', 13),
('Adobe XD', 'software', 'User experience design tool', 14),
('InVision', 'software', 'Digital product design platform', 15),
('Canva Pro', 'software', 'Graphic design platform', 16),
('Lightroom', 'software', 'Photo editing and organization software', 17),
('Capture One', 'software', 'Professional photo editing software', 18),
('Phase One', 'software', 'Professional photography software', 19),

-- Technical Skills
('Color Grading', 'technical', 'Post-production color correction and enhancement', 20),
('Motion Graphics', 'technical', 'Animated graphic design and visual effects', 21),
('Visual Effects (VFX)', 'technical', 'Digital visual effects creation', 22),
('Compositing', 'technical', 'Combining visual elements from different sources', 23),
('Sound Design', 'technical', 'Creating and manipulating audio for media', 24),
('Audio Mixing', 'technical', 'Balancing and enhancing audio tracks', 25),
('Audio Mastering', 'technical', 'Final audio processing and optimization', 26),
('Photography Lighting', 'technical', 'Professional lighting techniques', 27),
('Camera Operation', 'technical', 'Professional camera operation and cinematography', 28),
('Drone Operation', 'technical', 'Aerial photography and videography', 29),
('Gimbal Operation', 'technical', 'Stabilized camera movement', 30),
('LUT Creation', 'technical', 'Look-Up Table creation for color grading', 31),
('Workflow Optimization', 'technical', 'Streamlining production processes', 32),

-- Certifications
('Adobe Certified Expert (ACE)', 'certifications', 'Adobe software certification', 33),
('Avid Certified User', 'certifications', 'Avid software certification', 34),
('Apple Certified Pro', 'certifications', 'Apple software certification', 35),
('CompTIA A+', 'certifications', 'IT fundamentals certification', 36),
('Google Analytics Certified', 'certifications', 'Digital analytics certification', 37),
('HubSpot Content Marketing', 'certifications', 'Content marketing certification', 38),
('Facebook Blueprint', 'certifications', 'Facebook marketing certification', 39),
('Google Ads Certified', 'certifications', 'Google advertising certification', 40),
('PMP (Project Management)', 'certifications', 'Project Management Professional', 41),
('Scrum Master', 'certifications', 'Agile project management certification', 42),

-- Programming Languages
('JavaScript', 'programming', 'Web development programming language', 43),
('Python', 'programming', 'General-purpose programming language', 44),
('HTML/CSS', 'programming', 'Web markup and styling languages', 45),
('React', 'programming', 'JavaScript library for building user interfaces', 46),
('Node.js', 'programming', 'JavaScript runtime for server-side development', 47),
('PHP', 'programming', 'Server-side scripting language', 48),
('SQL', 'programming', 'Database query language', 49),
('Swift', 'programming', 'Apple development programming language', 50),
('Kotlin', 'programming', 'Android development programming language', 51),

-- Methodologies & Frameworks
('Agile Development', 'methodologies', 'Iterative development methodology', 52),
('Scrum', 'methodologies', 'Agile project management framework', 53),
('Design Thinking', 'methodologies', 'Human-centered design approach', 54),
('Lean Startup', 'methodologies', 'Business development methodology', 55),
('User Experience (UX) Design', 'methodologies', 'User-centered design process', 56),
('User Interface (UI) Design', 'methodologies', 'Visual design for digital interfaces', 57),
('Brand Strategy', 'methodologies', 'Strategic brand development', 58),
('Content Strategy', 'methodologies', 'Strategic content planning and creation', 59),
('SEO Optimization', 'methodologies', 'Search engine optimization techniques', 60),
('Social Media Marketing', 'methodologies', 'Marketing through social media platforms', 61),
('Email Marketing', 'methodologies', 'Marketing through email campaigns', 62),
('Influencer Marketing', 'methodologies', 'Marketing through influencer partnerships', 63),
('Performance Marketing', 'methodologies', 'Data-driven marketing approach', 64),

-- Equipment & Hardware
('Professional Cameras', 'equipment', 'DSLR, Mirrorless, Cinema cameras', 65),
('Lighting Equipment', 'equipment', 'Professional lighting setups', 66),
('Audio Equipment', 'equipment', 'Microphones, mixers, recording equipment', 67),
('Stabilization Systems', 'equipment', 'Gimbals, steadicams, tripods', 68),
('Studio Equipment', 'equipment', 'Professional studio setup and gear', 69),
('Green Screen Setup', 'equipment', 'Chroma key and virtual production', 70),
('Live Streaming Equipment', 'equipment', 'Streaming cameras, encoders, software', 71),
('Drone Equipment', 'equipment', 'Aerial photography and videography drones', 72),

-- Business Skills
('Project Management', 'business', 'Planning and executing projects', 73),
('Client Relations', 'business', 'Managing client relationships', 74),
('Budget Management', 'business', 'Financial planning and control', 75),
('Contract Negotiation', 'business', 'Business agreement management', 76),
('Team Leadership', 'business', 'Leading and managing teams', 77),
('Time Management', 'business', 'Efficient time allocation and prioritization', 78),
('Quality Assurance', 'business', 'Ensuring quality standards', 79),
('Risk Management', 'business', 'Identifying and mitigating risks', 80),
('Strategic Planning', 'business', 'Long-term business planning', 81),
('Market Research', 'business', 'Analyzing market trends and opportunities', 82);

-- Step 7: Create a function to validate professional skills
CREATE OR REPLACE FUNCTION validate_professional_skills(user_skills TEXT[])
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    skill_name TEXT;
    valid_skill_count INTEGER;
BEGIN
    -- Check if all skills in the array exist in predefined_professional_skills
    SELECT COUNT(*) INTO valid_skill_count
    FROM unnest(user_skills) AS skill_name
    WHERE skill_name IN (
        SELECT skill_name FROM predefined_professional_skills WHERE is_active = true
    );
    
    -- Return true if all skills are valid
    RETURN valid_skill_count = array_length(user_skills, 1);
END;
$$;

-- Step 8: Add a trigger to validate professional skills on insert/update
CREATE OR REPLACE FUNCTION validate_professional_skills_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Only validate if professional_skills is not empty
    IF NEW.professional_skills IS NOT NULL 
       AND array_length(NEW.professional_skills, 1) > 0 THEN
        
        IF NOT validate_professional_skills(NEW.professional_skills) THEN
            RAISE EXCEPTION 'Invalid professional skill(s) found. All skills must exist in predefined_professional_skills table.';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS trg_validate_professional_skills ON users_profile;
CREATE TRIGGER trg_validate_professional_skills
    BEFORE INSERT OR UPDATE ON users_profile
    FOR EACH ROW
    EXECUTE FUNCTION validate_professional_skills_trigger();

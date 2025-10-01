-- =====================================================
-- PREDEFINED ROLES AND SKILLS SYSTEM
-- =====================================================
-- Migration: 100_predefined_roles_skills.sql
-- Description: Create tables for predefined roles and skills for collaboration projects
-- Dependencies: 098_collaboration_system.sql

-- =====================================================
-- PREDEFINED ROLES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS predefined_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL, -- e.g., 'creative', 'technical', 'production', 'post-production'
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PREDEFINED SKILLS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS predefined_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL, -- e.g., 'technical', 'creative', 'equipment', 'software', 'interpersonal'
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PREDEFINED GEAR CATEGORIES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS predefined_gear_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL, -- e.g., 'camera', 'lighting', 'audio', 'accessories', 'studio'
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_predefined_roles_category ON predefined_roles(category);
CREATE INDEX IF NOT EXISTS idx_predefined_roles_active ON predefined_roles(is_active);
CREATE INDEX IF NOT EXISTS idx_predefined_roles_sort ON predefined_roles(sort_order);

CREATE INDEX IF NOT EXISTS idx_predefined_skills_category ON predefined_skills(category);
CREATE INDEX IF NOT EXISTS idx_predefined_skills_active ON predefined_skills(is_active);
CREATE INDEX IF NOT EXISTS idx_predefined_skills_sort ON predefined_skills(sort_order);

CREATE INDEX IF NOT EXISTS idx_predefined_gear_categories_category ON predefined_gear_categories(category);
CREATE INDEX IF NOT EXISTS idx_predefined_gear_categories_active ON predefined_gear_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_predefined_gear_categories_sort ON predefined_gear_categories(sort_order);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

ALTER TABLE predefined_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE predefined_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE predefined_gear_categories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then create new ones
DROP POLICY IF EXISTS "predefined_roles_read_all" ON predefined_roles;
DROP POLICY IF EXISTS "predefined_skills_read_all" ON predefined_skills;
DROP POLICY IF EXISTS "predefined_gear_categories_read_all" ON predefined_gear_categories;
DROP POLICY IF EXISTS "predefined_roles_read_authenticated" ON predefined_roles;
DROP POLICY IF EXISTS "predefined_skills_read_authenticated" ON predefined_skills;
DROP POLICY IF EXISTS "predefined_gear_categories_read_authenticated" ON predefined_gear_categories;

-- Anyone can read predefined roles, skills, and gear categories
CREATE POLICY "predefined_roles_read_all" ON predefined_roles 
  FOR SELECT USING (is_active = true);

CREATE POLICY "predefined_skills_read_all" ON predefined_skills 
  FOR SELECT USING (is_active = true);

CREATE POLICY "predefined_gear_categories_read_all" ON predefined_gear_categories 
  FOR SELECT USING (is_active = true);

-- Only authenticated users can read all (including inactive)
CREATE POLICY "predefined_roles_read_authenticated" ON predefined_roles 
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "predefined_skills_read_authenticated" ON predefined_skills 
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "predefined_gear_categories_read_authenticated" ON predefined_gear_categories 
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- =====================================================
-- INSERT PREDEFINED DATA
-- =====================================================

-- Insert predefined roles
INSERT INTO predefined_roles (name, category, description, sort_order) VALUES
-- Creative Roles
('Photographer', 'creative', 'Captures still images and photographs', 1),
('Videographer', 'creative', 'Records video content and footage', 2),
('Director', 'creative', 'Oversees creative vision and direction', 3),
('Cinematographer', 'creative', 'Manages camera work and visual storytelling', 4),
('Model', 'creative', 'Poses for photographs and videos', 5),
('Actor/Actress', 'creative', 'Performs in video content', 6),
('Makeup Artist', 'creative', 'Applies makeup for shoots', 7),
('Hair Stylist', 'creative', 'Styles hair for shoots', 8),
('Wardrobe Stylist', 'creative', 'Selects and coordinates clothing', 9),
('Fashion Stylist', 'creative', 'Creates fashion looks and concepts', 10),

-- Technical Roles
('Lighting Technician', 'technical', 'Sets up and operates lighting equipment', 11),
('Sound Engineer', 'technical', 'Manages audio recording and mixing', 12),
('Audio Technician', 'technical', 'Handles audio equipment and recording', 13),
('Gaffer', 'technical', 'Chief lighting technician', 14),
('Grip', 'technical', 'Handles camera support and rigging', 15),
('Drone Operator', 'technical', 'Operates drone equipment for aerial shots', 16),

-- Production Roles
('Producer', 'production', 'Manages overall production logistics', 17),
('Production Assistant', 'production', 'Assists with production tasks', 18),
('Assistant', 'production', 'General production support', 19),
('Location Scout', 'production', 'Finds and secures shooting locations', 20),
('Script Supervisor', 'production', 'Maintains continuity and script notes', 21),

-- Post-Production Roles
('Editor', 'post-production', 'Edits video and photo content', 22),
('Color Grader', 'post-production', 'Adjusts color and tone in post', 23),
('Motion Graphics Designer', 'post-production', 'Creates animated graphics and effects', 24),
('Visual Effects Artist', 'post-production', 'Creates digital effects and compositing', 25),

-- Design Roles
('Art Director', 'design', 'Oversees visual design and aesthetics', 26),
('Set Designer', 'design', 'Designs and creates sets', 27),
('Props Master', 'design', 'Manages props and set pieces', 28),
('Costume Designer', 'design', 'Designs costumes and wardrobe', 29),
('Storyboard Artist', 'design', 'Creates visual storyboards', 30),

-- Marketing & Content
('Social Media Manager', 'marketing', 'Manages social media presence', 31),
('Content Creator', 'marketing', 'Creates marketing content', 32),
('Brand Manager', 'marketing', 'Manages brand identity and messaging', 33),
('Marketing Coordinator', 'marketing', 'Coordinates marketing activities', 34),

-- Writing & Creative
('Writer', 'creative', 'Creates written content and scripts', 35),
('Copywriter', 'creative', 'Writes marketing copy and content', 36),
('Script Writer', 'creative', 'Writes scripts for video content', 37),

-- Other Specialized Roles
('Event Coordinator', 'production', 'Coordinates events and shoots', 38),
('Equipment Manager', 'technical', 'Manages and maintains equipment', 39),
('Safety Coordinator', 'production', 'Ensures safety on set', 40),
('Transportation Coordinator', 'production', 'Manages transportation logistics', 41)
ON CONFLICT (name) DO NOTHING;

-- Insert predefined skills
INSERT INTO predefined_skills (name, category, description, sort_order) VALUES
-- Technical Skills
('Photography', 'technical', 'Capturing still images with cameras', 1),
('Videography', 'technical', 'Recording video content', 2),
('Cinematography', 'technical', 'Visual storytelling through camera work', 3),
('Lighting', 'technical', 'Setting up and operating lighting equipment', 4),
('Sound Recording', 'technical', 'Recording and capturing audio', 5),
('Audio Engineering', 'technical', 'Mixing and mastering audio', 6),
('Drone Operation', 'technical', 'Operating drone equipment safely', 7),
('Equipment Operation', 'technical', 'Operating various technical equipment', 8),

-- Creative Skills
('Modeling', 'creative', 'Posing and performing for camera', 9),
('Acting', 'creative', 'Performing in front of camera', 10),
('Directing', 'creative', 'Leading creative vision and direction', 11),
('Styling', 'creative', 'Creating visual looks and aesthetics', 12),
('Makeup Artistry', 'creative', 'Applying makeup for shoots', 13),
('Hair Styling', 'creative', 'Styling hair for shoots', 14),
('Fashion Styling', 'creative', 'Coordinating fashion and wardrobe', 15),
('Set Design', 'creative', 'Designing and creating sets', 16),
('Props Design', 'creative', 'Creating and managing props', 17),
('Costume Design', 'creative', 'Designing costumes and wardrobe', 18),

-- Post-Production Skills
('Video Editing', 'post-production', 'Editing video content', 19),
('Photo Editing', 'post-production', 'Editing and retouching photos', 20),
('Color Grading', 'post-production', 'Adjusting color and tone', 21),
('Motion Graphics', 'post-production', 'Creating animated graphics', 22),
('Visual Effects', 'post-production', 'Creating digital effects', 23),
('Animation', 'post-production', 'Creating animated content', 24),
('Audio Post-Production', 'post-production', 'Post-processing audio', 25),

-- Software Skills
('Adobe Creative Suite', 'software', 'Proficiency in Adobe software', 26),
('Final Cut Pro', 'software', 'Video editing with Final Cut Pro', 27),
('DaVinci Resolve', 'software', 'Color grading and editing', 28),
('Avid Media Composer', 'software', 'Professional video editing', 29),
('Pro Tools', 'software', 'Audio editing and mixing', 30),
('Logic Pro', 'software', 'Music production and audio editing', 31),
('After Effects', 'software', 'Motion graphics and effects', 32),
('Photoshop', 'software', 'Photo editing and manipulation', 33),
('Lightroom', 'software', 'Photo organization and editing', 34),
('Premiere Pro', 'software', 'Video editing with Premiere Pro', 35),

-- Interpersonal Skills
('Communication', 'interpersonal', 'Effective communication skills', 36),
('Leadership', 'interpersonal', 'Leading teams and projects', 37),
('Project Management', 'interpersonal', 'Managing projects and timelines', 38),
('Team Collaboration', 'interpersonal', 'Working effectively in teams', 39),
('Client Relations', 'interpersonal', 'Managing client relationships', 40),
('Problem Solving', 'interpersonal', 'Solving creative and technical problems', 41),
('Time Management', 'interpersonal', 'Managing time and deadlines', 42),

-- Marketing & Business Skills
('Social Media Management', 'marketing', 'Managing social media presence', 43),
('Content Creation', 'marketing', 'Creating marketing content', 44),
('Brand Management', 'marketing', 'Managing brand identity', 45),
('Digital Marketing', 'marketing', 'Online marketing strategies', 46),
('SEO', 'marketing', 'Search engine optimization', 47),
('Analytics', 'marketing', 'Analyzing performance data', 48),
('Copywriting', 'marketing', 'Writing marketing copy', 49),

-- Specialized Skills
('Live Streaming', 'specialized', 'Producing live video content', 50),
('Podcast Production', 'specialized', 'Creating podcast content', 51),
('Music Production', 'specialized', 'Producing music and audio', 52),
('Event Planning', 'specialized', 'Planning and coordinating events', 53),
('Location Scouting', 'specialized', 'Finding suitable shooting locations', 54),
('Safety Management', 'specialized', 'Ensuring safety on set', 55),
('Transportation Logistics', 'specialized', 'Managing transportation needs', 56),
('Equipment Maintenance', 'specialized', 'Maintaining technical equipment', 57),
('Budget Management', 'specialized', 'Managing project budgets', 58),
('Contract Negotiation', 'specialized', 'Negotiating contracts and agreements', 59)
ON CONFLICT (name) DO NOTHING;

-- Insert predefined gear categories
INSERT INTO predefined_gear_categories (name, category, description, sort_order) VALUES
-- Camera Equipment
('Camera', 'camera', 'Digital cameras and camera bodies', 1),
('Lens', 'camera', 'Camera lenses and optics', 2),
('Tripod', 'camera', 'Camera support and stabilization', 3),
('Monopod', 'camera', 'Single-leg camera support', 4),
('Gimbal', 'camera', 'Camera stabilization systems', 5),
('Stabilizer', 'camera', 'Camera stabilization equipment', 6),
('Drone', 'camera', 'Aerial photography and videography drones', 7),

-- Lighting Equipment
('Lighting', 'lighting', 'Professional lighting equipment', 8),
('Monitor', 'lighting', 'Field monitors and displays', 9),
('Field Monitor', 'lighting', 'On-set monitoring displays', 10),
('Backdrop', 'lighting', 'Background and backdrop materials', 11),
('Background', 'lighting', 'Background materials and surfaces', 12),
('Reflector', 'lighting', 'Light reflection and diffusion', 13),
('Diffuser', 'lighting', 'Light diffusion materials', 14),
('Softbox', 'lighting', 'Soft lighting modifiers', 15),

-- Audio Equipment
('Audio Equipment', 'audio', 'Professional audio recording equipment', 16),
('Microphone', 'audio', 'Recording microphones and accessories', 17),
('Recording Equipment', 'audio', 'Audio recording devices and interfaces', 18),

-- Post-Production
('Editing Setup', 'post-production', 'Video and photo editing workstations', 19),
('Computer/Laptop', 'post-production', 'Computing equipment for editing', 20),

-- Props & Wardrobe
('Props', 'props', 'Props and set decoration items', 21),
('Wardrobe', 'props', 'Clothing and costume items', 22),
('Makeup Kit', 'props', 'Makeup and beauty supplies', 23),
('Hair Styling Tools', 'props', 'Hair styling equipment and supplies', 24),

-- Grip & Accessories
('Grip Equipment', 'accessories', 'Camera support and rigging equipment', 25),
('Cables & Accessories', 'accessories', 'Cables, adapters, and small accessories', 26),
('Storage & Media', 'accessories', 'Memory cards, drives, and storage solutions', 27),
('Other Equipment', 'accessories', 'Miscellaneous equipment and tools', 28)
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- FUNCTIONS FOR EASY QUERYING
-- =====================================================

-- Function to get all active roles by category
CREATE OR REPLACE FUNCTION get_roles_by_category(role_category TEXT DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  name TEXT,
  category TEXT,
  description TEXT,
  sort_order INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pr.id,
    pr.name,
    pr.category,
    pr.description,
    pr.sort_order
  FROM predefined_roles pr
  WHERE pr.is_active = true
    AND (role_category IS NULL OR pr.category = role_category)
  ORDER BY pr.sort_order, pr.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all active skills by category
CREATE OR REPLACE FUNCTION get_skills_by_category(skill_category TEXT DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  name TEXT,
  category TEXT,
  description TEXT,
  sort_order INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ps.id,
    ps.name,
    ps.category,
    ps.description,
    ps.sort_order
  FROM predefined_skills ps
  WHERE ps.is_active = true
    AND (skill_category IS NULL OR ps.category = skill_category)
  ORDER BY ps.sort_order, ps.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all active gear categories by category
CREATE OR REPLACE FUNCTION get_gear_categories_by_category(gear_category TEXT DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  name TEXT,
  category TEXT,
  description TEXT,
  sort_order INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pgc.id,
    pgc.name,
    pgc.category,
    pgc.description,
    pgc.sort_order
  FROM predefined_gear_categories pgc
  WHERE pgc.is_active = true
    AND (gear_category IS NULL OR pgc.category = gear_category)
  ORDER BY pgc.sort_order, pgc.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to search roles and skills
CREATE OR REPLACE FUNCTION search_roles_and_skills(search_term TEXT)
RETURNS TABLE (
  type TEXT,
  id UUID,
  name TEXT,
  category TEXT,
  description TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'role'::TEXT as type,
    pr.id,
    pr.name,
    pr.category,
    pr.description
  FROM predefined_roles pr
  WHERE pr.is_active = true
    AND (pr.name ILIKE '%' || search_term || '%' OR pr.description ILIKE '%' || search_term || '%')
  
  UNION ALL
  
  SELECT 
    'skill'::TEXT as type,
    ps.id,
    ps.name,
    ps.category,
    ps.description
  FROM predefined_skills ps
  WHERE ps.is_active = true
    AND (ps.name ILIKE '%' || search_term || '%' OR ps.description ILIKE '%' || search_term || '%')
  
  ORDER BY name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_predefined_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist, then create new ones
DROP TRIGGER IF EXISTS update_predefined_roles_updated_at ON predefined_roles;
DROP TRIGGER IF EXISTS update_predefined_skills_updated_at ON predefined_skills;
DROP TRIGGER IF EXISTS update_predefined_gear_categories_updated_at ON predefined_gear_categories;

-- Triggers for updated_at
CREATE TRIGGER update_predefined_roles_updated_at
    BEFORE UPDATE ON predefined_roles
    FOR EACH ROW
    EXECUTE FUNCTION update_predefined_updated_at_column();

CREATE TRIGGER update_predefined_skills_updated_at
    BEFORE UPDATE ON predefined_skills
    FOR EACH ROW
    EXECUTE FUNCTION update_predefined_updated_at_column();

CREATE TRIGGER update_predefined_gear_categories_updated_at
    BEFORE UPDATE ON predefined_gear_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_predefined_updated_at_column();

-- =====================================================
-- COMMENTS AND DOCUMENTATION
-- =====================================================

COMMENT ON TABLE predefined_roles IS 'Predefined roles available for collaboration projects';
COMMENT ON TABLE predefined_skills IS 'Predefined skills available for collaboration projects';

COMMENT ON COLUMN predefined_roles.category IS 'Role category: creative, technical, production, post-production, design, marketing';
COMMENT ON COLUMN predefined_skills.category IS 'Skill category: technical, creative, post-production, software, interpersonal, marketing, specialized';

COMMENT ON FUNCTION get_roles_by_category IS 'Get all active roles, optionally filtered by category';
COMMENT ON FUNCTION get_skills_by_category IS 'Get all active skills, optionally filtered by category';
COMMENT ON FUNCTION search_roles_and_skills IS 'Search both roles and skills by name or description';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Migration completed successfully
-- Tables created: predefined_roles, predefined_skills, predefined_gear_categories
-- Data inserted: 41 roles, 59 skills, 28 gear categories
-- Functions created: get_roles_by_category, get_skills_by_category, get_gear_categories_by_category, search_roles_and_skills

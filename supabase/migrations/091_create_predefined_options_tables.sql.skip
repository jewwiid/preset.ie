-- Create comprehensive predefined options tables for profile completion
-- This migration creates all the predefined option tables that should be fetched from the database

-- Gender Identities Table
CREATE TABLE IF NOT EXISTS predefined_gender_identities (
  id SERIAL PRIMARY KEY,
  identity_name VARCHAR(50) NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert predefined gender identities
INSERT INTO predefined_gender_identities (identity_name, sort_order) VALUES
('Male', 1),
('Female', 2),
('Non-binary', 3),
('Genderfluid', 4),
('Agender', 5),
('Transgender Male', 6),
('Transgender Female', 7),
('Prefer not to say', 8),
('Other', 9)
ON CONFLICT (identity_name) DO NOTHING;

-- Ethnicities Table
CREATE TABLE IF NOT EXISTS predefined_ethnicities (
  id SERIAL PRIMARY KEY,
  ethnicity_name VARCHAR(50) NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert predefined ethnicities
INSERT INTO predefined_ethnicities (ethnicity_name, sort_order) VALUES
('African American', 1),
('Asian', 2),
('Caucasian', 3),
('Hispanic/Latino', 4),
('Middle Eastern', 5),
('Native American', 6),
('Pacific Islander', 7),
('Mixed Race', 8),
('Other', 9),
('Prefer not to say', 10)
ON CONFLICT (ethnicity_name) DO NOTHING;

-- Body Types Table
CREATE TABLE IF NOT EXISTS predefined_body_types (
  id SERIAL PRIMARY KEY,
  body_type_name VARCHAR(50) NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert predefined body types
INSERT INTO predefined_body_types (body_type_name, sort_order) VALUES
('Petite', 1),
('Slim', 2),
('Athletic', 3),
('Average', 4),
('Curvy', 5),
('Plus Size', 6),
('Muscular', 7),
('Tall', 8),
('Short', 9),
('Other', 10)
ON CONFLICT (body_type_name) DO NOTHING;

-- Experience Levels Table
CREATE TABLE IF NOT EXISTS predefined_experience_levels (
  id SERIAL PRIMARY KEY,
  level_name VARCHAR(50) NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert predefined experience levels
INSERT INTO predefined_experience_levels (level_name, sort_order) VALUES
('Beginner', 1),
('Intermediate', 2),
('Advanced', 3),
('Professional', 4),
('Expert', 5)
ON CONFLICT (level_name) DO NOTHING;

-- Availability Statuses Table
CREATE TABLE IF NOT EXISTS predefined_availability_statuses (
  id SERIAL PRIMARY KEY,
  status_name VARCHAR(50) NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert predefined availability statuses
INSERT INTO predefined_availability_statuses (status_name, sort_order) VALUES
('Available', 1),
('Busy', 2),
('Unavailable', 3),
('Limited', 4),
('Weekends Only', 5),
('Weekdays Only', 6)
ON CONFLICT (status_name) DO NOTHING;

-- Hair Lengths Table
CREATE TABLE IF NOT EXISTS predefined_hair_lengths (
  id SERIAL PRIMARY KEY,
  length_name VARCHAR(50) NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert predefined hair lengths
INSERT INTO predefined_hair_lengths (length_name, sort_order) VALUES
('Very Short', 1),
('Short', 2),
('Medium', 3),
('Long', 4),
('Very Long', 5)
ON CONFLICT (length_name) DO NOTHING;

-- Skin Tones Table
CREATE TABLE IF NOT EXISTS predefined_skin_tones (
  id SERIAL PRIMARY KEY,
  tone_name VARCHAR(50) NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert predefined skin tones
INSERT INTO predefined_skin_tones (tone_name, sort_order) VALUES
('Very Fair', 1),
('Fair', 2),
('Light', 3),
('Medium', 4),
('Olive', 5),
('Tan', 6),
('Dark', 7),
('Very Dark', 8)
ON CONFLICT (tone_name) DO NOTHING;

-- Style Tags Table (for creative preferences)
CREATE TABLE IF NOT EXISTS predefined_style_tags (
  id SERIAL PRIMARY KEY,
  tag_name VARCHAR(50) NOT NULL UNIQUE,
  category VARCHAR(50) DEFAULT 'general',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert predefined style tags
INSERT INTO predefined_style_tags (tag_name, category, sort_order) VALUES
-- Photography Styles
('Portrait', 'photography', 1),
('Fashion', 'photography', 2),
('Editorial', 'photography', 3),
('Commercial', 'photography', 4),
('Lifestyle', 'photography', 5),
('Wedding', 'photography', 6),
('Event', 'photography', 7),
('Product', 'photography', 8),
('Architecture', 'photography', 9),
('Street', 'photography', 10),
('Conceptual', 'photography', 11),
('Fine Art', 'photography', 12),
('Documentary', 'photography', 13),
('Sports', 'photography', 14),
('Nature', 'photography', 15),

-- Videography Styles
('Cinematic', 'videography', 16),
('Documentary', 'videography', 17),
('Commercial', 'videography', 18),
('Event', 'videography', 19),
('Music Video', 'videography', 20),
('Short Film', 'videography', 21),
('Corporate', 'videography', 22),
('Wedding', 'videography', 23),
('Social Media', 'videography', 24),
('Live Streaming', 'videography', 25),

-- Makeup Styles
('Natural', 'makeup', 26),
('Glamour', 'makeup', 27),
('Editorial', 'makeup', 28),
('Fashion', 'makeup', 29),
('Bridal', 'makeup', 30),
('Special Effects', 'makeup', 31),
('Character', 'makeup', 32),
('Avant-garde', 'makeup', 33),

-- Styling Styles
('Fashion', 'styling', 34),
('Editorial', 'styling', 35),
('Commercial', 'styling', 36),
('Bridal', 'styling', 37),
('Costume', 'styling', 38),
('Vintage', 'styling', 39),
('Contemporary', 'styling', 40),
('Minimalist', 'styling', 41)
ON CONFLICT (tag_name) DO NOTHING;

-- Vibe Tags Table (for mood and atmosphere)
CREATE TABLE IF NOT EXISTS predefined_vibe_tags (
  id SERIAL PRIMARY KEY,
  tag_name VARCHAR(50) NOT NULL UNIQUE,
  category VARCHAR(50) DEFAULT 'general',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert predefined vibe tags
INSERT INTO predefined_vibe_tags (tag_name, category, sort_order) VALUES
-- Mood Categories
('Elegant', 'mood', 1),
('Edgy', 'mood', 2),
('Romantic', 'mood', 3),
('Playful', 'mood', 4),
('Mysterious', 'mood', 5),
('Confident', 'mood', 6),
('Vulnerable', 'mood', 7),
('Powerful', 'mood', 8),
('Gentle', 'mood', 9),
('Bold', 'mood', 10),

-- Atmosphere Categories
('Urban', 'atmosphere', 11),
('Natural', 'atmosphere', 12),
('Industrial', 'atmosphere', 13),
('Luxury', 'atmosphere', 14),
('Minimalist', 'atmosphere', 15),
('Vintage', 'atmosphere', 16),
('Modern', 'atmosphere', 17),
('Rustic', 'atmosphere', 18),
('Futuristic', 'atmosphere', 19),
('Bohemian', 'atmosphere', 20),

-- Energy Categories
('High Energy', 'energy', 21),
('Calm', 'energy', 22),
('Dynamic', 'energy', 23),
('Serene', 'energy', 24),
('Intense', 'energy', 25),
('Relaxed', 'energy', 26),
('Passionate', 'energy', 27),
('Peaceful', 'energy', 28)
ON CONFLICT (tag_name) DO NOTHING;

-- Equipment Options Table (for contributors)
CREATE TABLE IF NOT EXISTS predefined_equipment_options (
  id SERIAL PRIMARY KEY,
  equipment_name VARCHAR(100) NOT NULL UNIQUE,
  category VARCHAR(50) DEFAULT 'general',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert predefined equipment options
INSERT INTO predefined_equipment_options (equipment_name, category, sort_order) VALUES
-- Cameras
('Canon EOS R5', 'camera', 1),
('Canon EOS R6', 'camera', 2),
('Canon 5D Mark IV', 'camera', 3),
('Sony A7R IV', 'camera', 4),
('Sony A7 III', 'camera', 5),
('Nikon Z7', 'camera', 6),
('Nikon D850', 'camera', 7),
('Fujifilm X-T4', 'camera', 8),
('Leica Q2', 'camera', 9),
('Other Camera', 'camera', 10),

-- Lenses
('24-70mm f/2.8', 'lens', 11),
('70-200mm f/2.8', 'lens', 12),
('85mm f/1.4', 'lens', 13),
('50mm f/1.4', 'lens', 14),
('35mm f/1.4', 'lens', 15),
('16-35mm f/2.8', 'lens', 16),
('100mm Macro', 'lens', 17),
('Other Lens', 'lens', 18),

-- Lighting
('Studio Strobes', 'lighting', 19),
('Continuous Lights', 'lighting', 20),
('Speedlights', 'lighting', 21),
('LED Panels', 'lighting', 22),
('Ring Light', 'lighting', 23),
('Softboxes', 'lighting', 24),
('Umbrellas', 'lighting', 25),
('Other Lighting', 'lighting', 26),

-- Video Equipment
('Gimbal Stabilizer', 'video', 27),
('Tripod', 'video', 28),
('Slider', 'video', 29),
('Drone', 'video', 30),
('External Monitor', 'video', 31),
('Audio Recorder', 'video', 32),
('Other Video Equipment', 'video', 33)
ON CONFLICT (equipment_name) DO NOTHING;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_predefined_gender_identities_active ON predefined_gender_identities(is_active);
CREATE INDEX IF NOT EXISTS idx_predefined_gender_identities_sort_order ON predefined_gender_identities(sort_order);

CREATE INDEX IF NOT EXISTS idx_predefined_ethnicities_active ON predefined_ethnicities(is_active);
CREATE INDEX IF NOT EXISTS idx_predefined_ethnicities_sort_order ON predefined_ethnicities(sort_order);

CREATE INDEX IF NOT EXISTS idx_predefined_body_types_active ON predefined_body_types(is_active);
CREATE INDEX IF NOT EXISTS idx_predefined_body_types_sort_order ON predefined_body_types(sort_order);

CREATE INDEX IF NOT EXISTS idx_predefined_experience_levels_active ON predefined_experience_levels(is_active);
CREATE INDEX IF NOT EXISTS idx_predefined_experience_levels_sort_order ON predefined_experience_levels(sort_order);

CREATE INDEX IF NOT EXISTS idx_predefined_availability_statuses_active ON predefined_availability_statuses(is_active);
CREATE INDEX IF NOT EXISTS idx_predefined_availability_statuses_sort_order ON predefined_availability_statuses(sort_order);

CREATE INDEX IF NOT EXISTS idx_predefined_hair_lengths_active ON predefined_hair_lengths(is_active);
CREATE INDEX IF NOT EXISTS idx_predefined_hair_lengths_sort_order ON predefined_hair_lengths(sort_order);

CREATE INDEX IF NOT EXISTS idx_predefined_skin_tones_active ON predefined_skin_tones(is_active);
CREATE INDEX IF NOT EXISTS idx_predefined_skin_tones_sort_order ON predefined_skin_tones(sort_order);

CREATE INDEX IF NOT EXISTS idx_predefined_style_tags_active ON predefined_style_tags(is_active);
CREATE INDEX IF NOT EXISTS idx_predefined_style_tags_category ON predefined_style_tags(category);
CREATE INDEX IF NOT EXISTS idx_predefined_style_tags_sort_order ON predefined_style_tags(sort_order);

CREATE INDEX IF NOT EXISTS idx_predefined_vibe_tags_active ON predefined_vibe_tags(is_active);
CREATE INDEX IF NOT EXISTS idx_predefined_vibe_tags_category ON predefined_vibe_tags(category);
CREATE INDEX IF NOT EXISTS idx_predefined_vibe_tags_sort_order ON predefined_vibe_tags(sort_order);

CREATE INDEX IF NOT EXISTS idx_predefined_equipment_options_active ON predefined_equipment_options(is_active);
CREATE INDEX IF NOT EXISTS idx_predefined_equipment_options_category ON predefined_equipment_options(category);
CREATE INDEX IF NOT EXISTS idx_predefined_equipment_options_sort_order ON predefined_equipment_options(sort_order);

-- Add triggers to update updated_at timestamp for all tables
CREATE OR REPLACE FUNCTION update_predefined_options_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all predefined tables
CREATE TRIGGER trigger_update_predefined_gender_identities_updated_at
  BEFORE UPDATE ON predefined_gender_identities
  FOR EACH ROW
  EXECUTE FUNCTION update_predefined_options_updated_at();

CREATE TRIGGER trigger_update_predefined_ethnicities_updated_at
  BEFORE UPDATE ON predefined_ethnicities
  FOR EACH ROW
  EXECUTE FUNCTION update_predefined_options_updated_at();

CREATE TRIGGER trigger_update_predefined_body_types_updated_at
  BEFORE UPDATE ON predefined_body_types
  FOR EACH ROW
  EXECUTE FUNCTION update_predefined_options_updated_at();

CREATE TRIGGER trigger_update_predefined_experience_levels_updated_at
  BEFORE UPDATE ON predefined_experience_levels
  FOR EACH ROW
  EXECUTE FUNCTION update_predefined_options_updated_at();

CREATE TRIGGER trigger_update_predefined_availability_statuses_updated_at
  BEFORE UPDATE ON predefined_availability_statuses
  FOR EACH ROW
  EXECUTE FUNCTION update_predefined_options_updated_at();

CREATE TRIGGER trigger_update_predefined_hair_lengths_updated_at
  BEFORE UPDATE ON predefined_hair_lengths
  FOR EACH ROW
  EXECUTE FUNCTION update_predefined_options_updated_at();

CREATE TRIGGER trigger_update_predefined_skin_tones_updated_at
  BEFORE UPDATE ON predefined_skin_tones
  FOR EACH ROW
  EXECUTE FUNCTION update_predefined_options_updated_at();

CREATE TRIGGER trigger_update_predefined_style_tags_updated_at
  BEFORE UPDATE ON predefined_style_tags
  FOR EACH ROW
  EXECUTE FUNCTION update_predefined_options_updated_at();

CREATE TRIGGER trigger_update_predefined_vibe_tags_updated_at
  BEFORE UPDATE ON predefined_vibe_tags
  FOR EACH ROW
  EXECUTE FUNCTION update_predefined_options_updated_at();

CREATE TRIGGER trigger_update_predefined_equipment_options_updated_at
  BEFORE UPDATE ON predefined_equipment_options
  FOR EACH ROW
  EXECUTE FUNCTION update_predefined_options_updated_at();

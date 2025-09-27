-- Create missing predefined tables for profile options
-- These tables store dropdown/selection options for user profiles

-- 1. Gender Identities
CREATE TABLE IF NOT EXISTS predefined_gender_identities (
    id SERIAL PRIMARY KEY,
    identity_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Body Types
CREATE TABLE IF NOT EXISTS predefined_body_types (
    id SERIAL PRIMARY KEY,
    body_type_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Ethnicities
CREATE TABLE IF NOT EXISTS predefined_ethnicities (
    id SERIAL PRIMARY KEY,
    ethnicity_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Hair Colors
CREATE TABLE IF NOT EXISTS predefined_hair_colors (
    id SERIAL PRIMARY KEY,
    color_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Skin Tones
CREATE TABLE IF NOT EXISTS predefined_skin_tones (
    id SERIAL PRIMARY KEY,
    tone_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Hair Lengths
CREATE TABLE IF NOT EXISTS predefined_hair_lengths (
    id SERIAL PRIMARY KEY,
    length_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Availability Statuses
CREATE TABLE IF NOT EXISTS predefined_availability_statuses (
    id SERIAL PRIMARY KEY,
    status_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Experience Levels
CREATE TABLE IF NOT EXISTS predefined_experience_levels (
    id SERIAL PRIMARY KEY,
    level_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Equipment Options
CREATE TABLE IF NOT EXISTS predefined_equipment_options (
    id SERIAL PRIMARY KEY,
    equipment_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Eye Colors
CREATE TABLE IF NOT EXISTS predefined_eye_colors (
    id SERIAL PRIMARY KEY,
    color_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security for all tables
ALTER TABLE predefined_gender_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE predefined_body_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE predefined_ethnicities ENABLE ROW LEVEL SECURITY;
ALTER TABLE predefined_hair_colors ENABLE ROW LEVEL SECURITY;
ALTER TABLE predefined_skin_tones ENABLE ROW LEVEL SECURITY;
ALTER TABLE predefined_hair_lengths ENABLE ROW LEVEL SECURITY;
ALTER TABLE predefined_availability_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE predefined_experience_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE predefined_equipment_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE predefined_eye_colors ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (these are reference data)
CREATE POLICY "Allow public read access to predefined_gender_identities" ON predefined_gender_identities FOR SELECT USING (true);
CREATE POLICY "Allow public read access to predefined_body_types" ON predefined_body_types FOR SELECT USING (true);
CREATE POLICY "Allow public read access to predefined_ethnicities" ON predefined_ethnicities FOR SELECT USING (true);
CREATE POLICY "Allow public read access to predefined_hair_colors" ON predefined_hair_colors FOR SELECT USING (true);
CREATE POLICY "Allow public read access to predefined_skin_tones" ON predefined_skin_tones FOR SELECT USING (true);
CREATE POLICY "Allow public read access to predefined_hair_lengths" ON predefined_hair_lengths FOR SELECT USING (true);
CREATE POLICY "Allow public read access to predefined_availability_statuses" ON predefined_availability_statuses FOR SELECT USING (true);
CREATE POLICY "Allow public read access to predefined_experience_levels" ON predefined_experience_levels FOR SELECT USING (true);
CREATE POLICY "Allow public read access to predefined_equipment_options" ON predefined_equipment_options FOR SELECT USING (true);
CREATE POLICY "Allow public read access to predefined_eye_colors" ON predefined_eye_colors FOR SELECT USING (true);

-- Populate tables with default values

-- Gender Identities
INSERT INTO predefined_gender_identities (identity_name, sort_order) VALUES
('Male', 1),
('Female', 2),
('Non-binary', 3),
('Genderfluid', 4),
('Agender', 5),
('Other', 6),
('Prefer not to say', 7);

-- Body Types
INSERT INTO predefined_body_types (body_type_name, sort_order) VALUES
('Slim', 1),
('Athletic', 2),
('Average', 3),
('Curvy', 4),
('Plus Size', 5),
('Muscular', 6),
('Petite', 7),
('Tall', 8);

-- Ethnicities
INSERT INTO predefined_ethnicities (ethnicity_name, sort_order) VALUES
('White/Caucasian', 1),
('Black/African American', 2),
('Hispanic/Latino', 3),
('Asian', 4),
('Native American', 5),
('Pacific Islander', 6),
('Middle Eastern', 7),
('Mixed Race', 8),
('Other', 9),
('Prefer not to say', 10);

-- Hair Colors
INSERT INTO predefined_hair_colors (color_name, sort_order) VALUES
('Black', 1),
('Brown', 2),
('Blonde', 3),
('Red', 4),
('Gray', 5),
('White', 6),
('Auburn', 7),
('Chestnut', 8),
('Other', 9);

-- Skin Tones
INSERT INTO predefined_skin_tones (tone_name, sort_order) VALUES
('Fair', 1),
('Light', 2),
('Medium', 3),
('Olive', 4),
('Tan', 5),
('Dark', 6),
('Deep', 7);

-- Hair Lengths
INSERT INTO predefined_hair_lengths (length_name, sort_order) VALUES
('Very Short', 1),
('Short', 2),
('Medium', 3),
('Long', 4),
('Very Long', 5),
('Bald', 6);

-- Availability Statuses
INSERT INTO predefined_availability_statuses (status_name, sort_order) VALUES
('Available', 1),
('Busy', 2),
('Away', 3),
('On Vacation', 4),
('Not Available', 5);

-- Experience Levels
INSERT INTO predefined_experience_levels (level_name, sort_order) VALUES
('Beginner', 1),
('Amateur', 2),
('Semi-Professional', 3),
('Professional', 4),
('Expert', 5);

-- Equipment Options
INSERT INTO predefined_equipment_options (equipment_name, sort_order) VALUES
('Camera', 1),
('Lighting', 2),
('Audio Equipment', 3),
('Tripods', 4),
('Lenses', 5),
('Studio Space', 6),
('Props', 7),
('Makeup Kit', 8),
('Wardrobe', 9),
('Transportation', 10);

-- Eye Colors
INSERT INTO predefined_eye_colors (color_name, sort_order) VALUES
('Brown', 1),
('Blue', 2),
('Green', 3),
('Hazel', 4),
('Gray', 5),
('Amber', 6),
('Other', 7);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at columns
CREATE TRIGGER update_predefined_gender_identities_updated_at BEFORE UPDATE ON predefined_gender_identities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_predefined_body_types_updated_at BEFORE UPDATE ON predefined_body_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_predefined_ethnicities_updated_at BEFORE UPDATE ON predefined_ethnicities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_predefined_hair_colors_updated_at BEFORE UPDATE ON predefined_hair_colors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_predefined_skin_tones_updated_at BEFORE UPDATE ON predefined_skin_tones FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_predefined_hair_lengths_updated_at BEFORE UPDATE ON predefined_hair_lengths FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_predefined_availability_statuses_updated_at BEFORE UPDATE ON predefined_availability_statuses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_predefined_experience_levels_updated_at BEFORE UPDATE ON predefined_experience_levels FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_predefined_equipment_options_updated_at BEFORE UPDATE ON predefined_equipment_options FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_predefined_eye_colors_updated_at BEFORE UPDATE ON predefined_eye_colors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Migration: Create Clothing Tables
-- This migration creates all the clothing-related tables needed for the TalentSpecificSection functionality

DO $$
BEGIN
    RAISE NOTICE 'Starting clothing tables creation...';
END $$;

-- Step 1: Create clothing_size_systems table
CREATE TABLE IF NOT EXISTS clothing_size_systems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(50) NOT NULL,
    region VARCHAR(50) NOT NULL,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Create user_clothing_sizes table
CREATE TABLE IF NOT EXISTS user_clothing_sizes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
    clothing_type VARCHAR(50) NOT NULL CHECK (clothing_type IN (
        'tops', 'bottoms', 'dresses', 'outerwear', 'underwear', 
        'shoes', 'accessories', 'hats', 'gloves', 'scarves'
    )),
    size_system_id UUID NOT NULL REFERENCES clothing_size_systems(id) ON DELETE CASCADE,
    size_value VARCHAR(20) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(profile_id, clothing_type, size_system_id)
);

-- Step 3: Create user_measurements table
CREATE TABLE IF NOT EXISTS user_measurements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
    measurement_type VARCHAR(50) NOT NULL CHECK (measurement_type IN (
        'chest', 'waist', 'hips', 'inseam', 'sleeve_length', 
        'neck', 'shoulder_width', 'bicep', 'thigh', 'calf'
    )),
    measurement_value DECIMAL(5,2) NOT NULL,
    unit VARCHAR(10) NOT NULL DEFAULT 'cm' CHECK (unit IN ('cm', 'inches')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(profile_id, measurement_type)
);

-- Step 4: Create user_shoe_sizes table
CREATE TABLE IF NOT EXISTS user_shoe_sizes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
    size_system_id UUID NOT NULL REFERENCES clothing_size_systems(id) ON DELETE CASCADE,
    size_value VARCHAR(20) NOT NULL,
    shoe_type VARCHAR(50) DEFAULT 'general' CHECK (shoe_type IN (
        'general', 'running', 'dress', 'casual', 'boots', 'sandals', 'heels'
    )),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(profile_id, size_system_id)
);

-- Step 5: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_clothing_size_systems_region ON clothing_size_systems(region);
CREATE INDEX IF NOT EXISTS idx_clothing_size_systems_sort_order ON clothing_size_systems(sort_order);
CREATE INDEX IF NOT EXISTS idx_user_clothing_sizes_profile_id ON user_clothing_sizes(profile_id);
CREATE INDEX IF NOT EXISTS idx_user_clothing_sizes_clothing_type ON user_clothing_sizes(clothing_type);
CREATE INDEX IF NOT EXISTS idx_user_clothing_sizes_size_system_id ON user_clothing_sizes(size_system_id);
CREATE INDEX IF NOT EXISTS idx_user_measurements_profile_id ON user_measurements(profile_id);
CREATE INDEX IF NOT EXISTS idx_user_measurements_measurement_type ON user_measurements(measurement_type);
CREATE INDEX IF NOT EXISTS idx_user_shoe_sizes_profile_id ON user_shoe_sizes(profile_id);
CREATE INDEX IF NOT EXISTS idx_user_shoe_sizes_size_system_id ON user_shoe_sizes(size_system_id);

-- Step 6: Insert sample clothing size systems
INSERT INTO clothing_size_systems (name, display_name, region, sort_order) VALUES
('us_women', 'US Women', 'North America', 1),
('us_men', 'US Men', 'North America', 2),
('uk_women', 'UK Women', 'Europe', 3),
('uk_men', 'UK Men', 'Europe', 4),
('eu_women', 'EU Women', 'Europe', 5),
('eu_men', 'EU Men', 'Europe', 6),
('jp_women', 'JP Women', 'Asia', 7),
('jp_men', 'JP Men', 'Asia', 8),
('au_women', 'AU Women', 'Oceania', 9),
('au_men', 'AU Men', 'Oceania', 10)
ON CONFLICT (name) DO NOTHING;

-- Step 7: Enable RLS on all tables
ALTER TABLE clothing_size_systems ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_clothing_sizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_shoe_sizes ENABLE ROW LEVEL SECURITY;

-- Step 8: Create RLS policies
-- Clothing size systems are publicly readable
CREATE POLICY "Clothing size systems are publicly readable" ON clothing_size_systems FOR SELECT USING (true);

-- User clothing data is private to the user
CREATE POLICY "Users can view their own clothing sizes" ON user_clothing_sizes FOR SELECT 
USING (auth.uid() = (SELECT user_id FROM users_profile WHERE id = profile_id));

CREATE POLICY "Users can insert their own clothing sizes" ON user_clothing_sizes FOR INSERT 
WITH CHECK (auth.uid() = (SELECT user_id FROM users_profile WHERE id = profile_id));

CREATE POLICY "Users can update their own clothing sizes" ON user_clothing_sizes FOR UPDATE 
USING (auth.uid() = (SELECT user_id FROM users_profile WHERE id = profile_id));

CREATE POLICY "Users can delete their own clothing sizes" ON user_clothing_sizes FOR DELETE 
USING (auth.uid() = (SELECT user_id FROM users_profile WHERE id = profile_id));

CREATE POLICY "Users can view their own measurements" ON user_measurements FOR SELECT 
USING (auth.uid() = (SELECT user_id FROM users_profile WHERE id = profile_id));

CREATE POLICY "Users can insert their own measurements" ON user_measurements FOR INSERT 
WITH CHECK (auth.uid() = (SELECT user_id FROM users_profile WHERE id = profile_id));

CREATE POLICY "Users can update their own measurements" ON user_measurements FOR UPDATE 
USING (auth.uid() = (SELECT user_id FROM users_profile WHERE id = profile_id));

CREATE POLICY "Users can delete their own measurements" ON user_measurements FOR DELETE 
USING (auth.uid() = (SELECT user_id FROM users_profile WHERE id = profile_id));

CREATE POLICY "Users can view their own shoe sizes" ON user_shoe_sizes FOR SELECT 
USING (auth.uid() = (SELECT user_id FROM users_profile WHERE id = profile_id));

CREATE POLICY "Users can insert their own shoe sizes" ON user_shoe_sizes FOR INSERT 
WITH CHECK (auth.uid() = (SELECT user_id FROM users_profile WHERE id = profile_id));

CREATE POLICY "Users can update their own shoe sizes" ON user_shoe_sizes FOR UPDATE 
USING (auth.uid() = (SELECT user_id FROM users_profile WHERE id = profile_id));

CREATE POLICY "Users can delete their own shoe sizes" ON user_shoe_sizes FOR DELETE 
USING (auth.uid() = (SELECT user_id FROM users_profile WHERE id = profile_id));

-- Step 9: Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_clothing_size_systems_updated_at BEFORE UPDATE ON clothing_size_systems FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_clothing_sizes_updated_at BEFORE UPDATE ON user_clothing_sizes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_measurements_updated_at BEFORE UPDATE ON user_measurements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_shoe_sizes_updated_at BEFORE UPDATE ON user_shoe_sizes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 10: Add comments for documentation
COMMENT ON TABLE clothing_size_systems IS 'Different clothing size systems (US, UK, EU, etc.)';
COMMENT ON TABLE user_clothing_sizes IS 'User-specific clothing sizes for different types and systems';
COMMENT ON TABLE user_measurements IS 'User body measurements for custom sizing';
COMMENT ON TABLE user_shoe_sizes IS 'User shoe sizes for different systems';

COMMENT ON COLUMN user_clothing_sizes.clothing_type IS 'Type of clothing: tops, bottoms, dresses, outerwear, etc.';
COMMENT ON COLUMN user_clothing_sizes.size_value IS 'The actual size value (e.g., "M", "12", "Large")';
COMMENT ON COLUMN user_measurements.measurement_type IS 'Type of measurement: chest, waist, hips, etc.';
COMMENT ON COLUMN user_measurements.measurement_value IS 'Measurement value in specified unit';
COMMENT ON COLUMN user_measurements.unit IS 'Unit of measurement: cm or inches';

-- Step 11: Update user_id_relationships view if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'user_id_relationships') THEN
        INSERT INTO user_id_relationships (table_name, column_name, description, usage) VALUES
        ('user_clothing_sizes', 'profile_id', 'Foreign key to users_profile.id', 'Links clothing sizes to user profile'),
        ('user_measurements', 'profile_id', 'Foreign key to users_profile.id', 'Links measurements to user profile'),
        ('user_shoe_sizes', 'profile_id', 'Foreign key to users_profile.id', 'Links shoe sizes to user profile')
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- Step 12: Success message
DO $$
BEGIN
    RAISE NOTICE 'Clothing tables creation completed successfully!';
    RAISE NOTICE 'Created tables:';
    RAISE NOTICE '- clothing_size_systems';
    RAISE NOTICE '- user_clothing_sizes';
    RAISE NOTICE '- user_measurements';
    RAISE NOTICE '- user_shoe_sizes';
    RAISE NOTICE 'Added sample data and RLS policies';
    RAISE NOTICE 'Supported clothing types: tops, bottoms, dresses, outerwear, underwear, shoes, accessories, hats, gloves, scarves';
    RAISE NOTICE 'Supported measurement types: chest, waist, hips, inseam, sleeve_length, neck, shoulder_width, bicep, thigh, calf';
END $$;

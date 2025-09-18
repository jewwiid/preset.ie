-- Migration: Create Equipment Tables
-- This migration creates all the equipment-related tables needed for the EquipmentSection functionality

DO $$
BEGIN
    RAISE NOTICE 'Starting equipment tables creation...';
END $$;

-- Step 1: Create equipment_types table
CREATE TABLE IF NOT EXISTS equipment_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    icon VARCHAR(10),
    category VARCHAR(50) NOT NULL,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Create equipment_brands table
CREATE TABLE IF NOT EXISTS equipment_brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Create equipment_models table
CREATE TABLE IF NOT EXISTS equipment_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_type_id UUID NOT NULL REFERENCES equipment_types(id) ON DELETE CASCADE,
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(200) NOT NULL,
    description TEXT,
    condition VARCHAR(20) DEFAULT 'excellent',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(equipment_type_id, brand, model)
);

-- Step 4: Create equipment_predefined_models table (for predefined options)
CREATE TABLE IF NOT EXISTS equipment_predefined_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_type_id UUID NOT NULL REFERENCES equipment_types(id) ON DELETE CASCADE,
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(200) NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(equipment_type_id, brand, model)
);

-- Step 5: Create user_equipment table
CREATE TABLE IF NOT EXISTS user_equipment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
    equipment_model_id UUID NOT NULL REFERENCES equipment_models(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(profile_id, equipment_model_id)
);

-- Step 6: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_equipment_types_category ON equipment_types(category);
CREATE INDEX IF NOT EXISTS idx_equipment_types_sort_order ON equipment_types(sort_order);
CREATE INDEX IF NOT EXISTS idx_equipment_brands_sort_order ON equipment_brands(sort_order);
CREATE INDEX IF NOT EXISTS idx_equipment_models_type_id ON equipment_models(equipment_type_id);
CREATE INDEX IF NOT EXISTS idx_equipment_predefined_models_type_id ON equipment_predefined_models(equipment_type_id);
CREATE INDEX IF NOT EXISTS idx_user_equipment_profile_id ON user_equipment(profile_id);
CREATE INDEX IF NOT EXISTS idx_user_equipment_model_id ON user_equipment(equipment_model_id);

-- Step 7: Create user_equipment_view for easy querying
CREATE OR REPLACE VIEW user_equipment_view AS
SELECT 
    ue.id,
    ue.profile_id,
    ue.is_primary,
    ue.display_order,
    ue.created_at,
    ue.updated_at,
    em.brand,
    em.model,
    em.description,
    em.condition,
    et.name as equipment_type_name,
    et.display_name as equipment_type_display_name,
    et.icon as equipment_type_icon,
    et.category as equipment_type_category
FROM user_equipment ue
JOIN equipment_models em ON ue.equipment_model_id = em.id
JOIN equipment_types et ON em.equipment_type_id = et.id
ORDER BY ue.display_order ASC, et.sort_order ASC, em.brand ASC, em.model ASC;

-- Step 8: Insert sample equipment types
INSERT INTO equipment_types (name, display_name, icon, category, sort_order) VALUES
('camera', 'Camera', '📷', 'photography', 1),
('lens', 'Lens', '🔍', 'photography', 2),
('lighting', 'Lighting', '💡', 'photography', 3),
('audio', 'Audio Equipment', '🎤', 'audio', 4),
('video', 'Video Equipment', '📹', 'video', 5),
('computer', 'Computer', '💻', 'computing', 6),
('software', 'Software', '💿', 'computing', 7),
('accessories', 'Accessories', '🔧', 'general', 8)
ON CONFLICT (name) DO NOTHING;

-- Step 9: Insert sample equipment brands
INSERT INTO equipment_brands (name, display_name, sort_order) VALUES
('canon', 'Canon', 1),
('nikon', 'Nikon', 2),
('sony', 'Sony', 3),
('panasonic', 'Panasonic', 4),
('fujifilm', 'Fujifilm', 5),
('olympus', 'Olympus', 6),
('apple', 'Apple', 7),
('microsoft', 'Microsoft', 8),
('adobe', 'Adobe', 9),
('final_cut', 'Final Cut Pro', 10),
('premiere', 'Adobe Premiere Pro', 11),
('photoshop', 'Adobe Photoshop', 12),
('lightroom', 'Adobe Lightroom', 13)
ON CONFLICT (name) DO NOTHING;

-- Step 10: Insert sample predefined models
INSERT INTO equipment_predefined_models (equipment_type_id, brand, model, description, sort_order) VALUES
-- Cameras
((SELECT id FROM equipment_types WHERE name = 'camera'), 'canon', 'EOS R5', 'Professional mirrorless camera', 1),
((SELECT id FROM equipment_types WHERE name = 'camera'), 'canon', 'EOS R6', 'Advanced mirrorless camera', 2),
((SELECT id FROM equipment_types WHERE name = 'camera'), 'sony', 'A7R IV', 'High-resolution mirrorless camera', 3),
((SELECT id FROM equipment_types WHERE name = 'camera'), 'sony', 'A7 III', 'Full-frame mirrorless camera', 4),
((SELECT id FROM equipment_types WHERE name = 'camera'), 'nikon', 'Z6 II', 'Professional mirrorless camera', 5),
-- Lenses
((SELECT id FROM equipment_types WHERE name = 'lens'), 'canon', 'RF 24-70mm f/2.8L IS USM', 'Professional zoom lens', 1),
((SELECT id FROM equipment_types WHERE name = 'lens'), 'canon', 'RF 70-200mm f/2.8L IS USM', 'Professional telephoto zoom', 2),
((SELECT id FROM equipment_types WHERE name = 'lens'), 'sony', 'FE 24-70mm f/2.8 GM', 'Professional zoom lens', 3),
((SELECT id FROM equipment_types WHERE name = 'lens'), 'sony', 'FE 85mm f/1.4 GM', 'Portrait lens', 4),
-- Software
((SELECT id FROM equipment_types WHERE name = 'software'), 'adobe', 'Photoshop CC', 'Image editing software', 1),
((SELECT id FROM equipment_types WHERE name = 'software'), 'adobe', 'Lightroom Classic', 'Photo management and editing', 2),
((SELECT id FROM equipment_types WHERE name = 'software'), 'adobe', 'Premiere Pro', 'Video editing software', 3),
((SELECT id FROM equipment_types WHERE name = 'software'), 'final_cut', 'Final Cut Pro X', 'Professional video editing', 4)
ON CONFLICT (equipment_type_id, brand, model) DO NOTHING;

-- Step 11: Enable RLS on all tables
ALTER TABLE equipment_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_predefined_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_equipment ENABLE ROW LEVEL SECURITY;

-- Step 12: Create RLS policies
-- Equipment types, brands, and predefined models are publicly readable
CREATE POLICY "Equipment types are publicly readable" ON equipment_types FOR SELECT USING (true);
CREATE POLICY "Equipment brands are publicly readable" ON equipment_brands FOR SELECT USING (true);
CREATE POLICY "Equipment models are publicly readable" ON equipment_models FOR SELECT USING (true);
CREATE POLICY "Predefined models are publicly readable" ON equipment_predefined_models FOR SELECT USING (true);

-- User equipment is private to the user
CREATE POLICY "Users can view their own equipment" ON user_equipment FOR SELECT 
USING (auth.uid() = (SELECT user_id FROM users_profile WHERE id = profile_id));

CREATE POLICY "Users can insert their own equipment" ON user_equipment FOR INSERT 
WITH CHECK (auth.uid() = (SELECT user_id FROM users_profile WHERE id = profile_id));

CREATE POLICY "Users can update their own equipment" ON user_equipment FOR UPDATE 
USING (auth.uid() = (SELECT user_id FROM users_profile WHERE id = profile_id));

CREATE POLICY "Users can delete their own equipment" ON user_equipment FOR DELETE 
USING (auth.uid() = (SELECT user_id FROM users_profile WHERE id = profile_id));

-- Step 13: Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_equipment_types_updated_at BEFORE UPDATE ON equipment_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_equipment_brands_updated_at BEFORE UPDATE ON equipment_brands FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_equipment_models_updated_at BEFORE UPDATE ON equipment_models FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_equipment_predefined_models_updated_at BEFORE UPDATE ON equipment_predefined_models FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_equipment_updated_at BEFORE UPDATE ON user_equipment FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 14: Add comments for documentation
COMMENT ON TABLE equipment_types IS 'Types of equipment available in the system (cameras, lenses, etc.)';
COMMENT ON TABLE equipment_brands IS 'Brands of equipment (Canon, Sony, Nikon, etc.)';
COMMENT ON TABLE equipment_models IS 'Specific equipment models with details';
COMMENT ON TABLE equipment_predefined_models IS 'Predefined equipment models for quick selection';
COMMENT ON TABLE user_equipment IS 'User-specific equipment inventory';
COMMENT ON VIEW user_equipment_view IS 'View combining user equipment with model and type details';

-- Step 15: Update user_id_relationships view
INSERT INTO user_id_relationships (table_name, column_name, description, usage) VALUES
('user_equipment', 'profile_id', 'Foreign key to users_profile.id', 'Links equipment to user profile'),
('equipment_models', 'equipment_type_id', 'Foreign key to equipment_types.id', 'Links model to equipment type'),
('equipment_predefined_models', 'equipment_type_id', 'Foreign key to equipment_types.id', 'Links predefined model to equipment type')
ON CONFLICT DO NOTHING;

-- Step 16: Success message
DO $$
BEGIN
    RAISE NOTICE 'Equipment tables creation completed successfully!';
    RAISE NOTICE 'Created tables:';
    RAISE NOTICE '- equipment_types';
    RAISE NOTICE '- equipment_brands';
    RAISE NOTICE '- equipment_models';
    RAISE NOTICE '- equipment_predefined_models';
    RAISE NOTICE '- user_equipment';
    RAISE NOTICE 'Created view: user_equipment_view';
    RAISE NOTICE 'Added sample data and RLS policies';
END $$;

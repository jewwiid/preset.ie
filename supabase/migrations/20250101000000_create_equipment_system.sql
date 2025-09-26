-- Create comprehensive equipment system for marketplace
-- This migration creates all equipment-related tables with predefined data

-- Step 1: Create equipment_types table
CREATE TABLE IF NOT EXISTS equipment_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(10), -- Emoji or icon identifier
    category VARCHAR(50) NOT NULL, -- Photography, Video, Audio, Lighting, etc.
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Create equipment_brands table
CREATE TABLE IF NOT EXISTS equipment_brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 3: Create equipment_models table
CREATE TABLE IF NOT EXISTS equipment_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_type_id UUID NOT NULL REFERENCES equipment_types(id) ON DELETE CASCADE,
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(200) NOT NULL,
    description TEXT,
    condition VARCHAR(20) DEFAULT 'excellent',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
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
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(equipment_type_id, brand, model)
);

-- Step 5: Create user_equipment table
CREATE TABLE IF NOT EXISTS user_equipment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
    equipment_model_id UUID NOT NULL REFERENCES equipment_models(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
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

-- Step 7: Insert predefined equipment types
INSERT INTO equipment_types (name, display_name, description, icon, category, sort_order) VALUES
-- Photography Equipment
('camera_body', 'Camera Body', 'Digital camera bodies (DSLR, Mirrorless, etc.)', '📷', 'Photography', 1),
('lens', 'Lens', 'Camera lenses (prime, zoom, macro, etc.)', '🔍', 'Photography', 2),
('flash', 'Flash/Strobe', 'External flash units and studio strobes', '⚡', 'Photography', 3),
('tripod', 'Tripod', 'Camera support and stabilization', '📐', 'Photography', 4),
('memory_card', 'Memory Card', 'Storage cards (SD, CF, etc.)', '💾', 'Photography', 5),
('battery', 'Battery', 'Camera batteries and chargers', '🔋', 'Photography', 6),
('filter', 'Filter', 'Camera filters (UV, ND, polarizing, etc.)', '🔍', 'Photography', 7),
('bag', 'Camera Bag', 'Equipment bags and cases', '🎒', 'Photography', 8),

-- Video Equipment
('video_camera', 'Video Camera', 'Camcorders, cinema cameras, action cameras', '🎥', 'Video', 10),
('gimbal', 'Gimbal', 'Camera stabilization systems', '📱', 'Video', 11),
('monitor', 'Monitor', 'External monitors and viewfinders', '📺', 'Video', 12),
('recorder', 'Recorder', 'Audio/video recording devices', '🎙️', 'Video', 13),

-- Audio Equipment
('microphone', 'Microphone', 'Audio recording microphones', '🎤', 'Audio', 20),
('audio_recorder', 'Audio Recorder', 'Portable audio recording devices', '🎵', 'Audio', 21),
('headphones', 'Headphones', 'Monitoring headphones', '🎧', 'Audio', 22),
('speaker', 'Speaker', 'Audio playback speakers', '🔊', 'Audio', 23),

-- Lighting Equipment
('continuous_light', 'Continuous Light', 'LED panels, tungsten lights', '💡', 'Lighting', 30),
('strobe_light', 'Strobe Light', 'Studio strobes and flash units', '⚡', 'Lighting', 31),
('light_modifier', 'Light Modifier', 'Softboxes, umbrellas, reflectors', '☂️', 'Lighting', 32),
('light_stand', 'Light Stand', 'Lighting support equipment', '🏗️', 'Lighting', 33),

-- Studio Equipment
('backdrop', 'Backdrop', 'Backgrounds and backdrops', '🖼️', 'Studio', 40),
('prop', 'Prop', 'Photography props and accessories', '🎭', 'Studio', 41),
('reflector', 'Reflector', 'Light reflectors and bounce cards', '🪞', 'Studio', 42),
('diffuser', 'Diffuser', 'Light diffusion materials', '☁️', 'Studio', 43),

-- Computer & Software
('computer', 'Computer', 'Workstations and laptops', '💻', 'Computing', 50),
('software', 'Software', 'Creative software licenses', '💿', 'Computing', 51),
('storage', 'Storage', 'External drives and NAS systems', '💾', 'Computing', 52),
('tablet', 'Tablet', 'Graphics tablets and iPads', '📱', 'Computing', 53),

-- Transportation
('vehicle', 'Vehicle', 'Transportation for equipment', '🚗', 'Transportation', 60),
('drone', 'Drone', 'Aerial photography drones', '🚁', 'Transportation', 61),

-- Other
('other', 'Other', 'Miscellaneous equipment', '🔧', 'Other', 99)
ON CONFLICT (name) DO NOTHING;

-- Step 8: Insert predefined equipment brands
INSERT INTO equipment_brands (name, display_name, sort_order) VALUES
('canon', 'Canon', 1),
('nikon', 'Nikon', 2),
('sony', 'Sony', 3),
('panasonic', 'Panasonic', 4),
('fujifilm', 'Fujifilm', 5),
('olympus', 'Olympus', 6),
('leica', 'Leica', 7),
('apple', 'Apple', 8),
('microsoft', 'Microsoft', 9),
('adobe', 'Adobe', 10),
('final_cut', 'Final Cut Pro', 11),
('premiere', 'Adobe Premiere Pro', 12),
('photoshop', 'Adobe Photoshop', 13),
('lightroom', 'Adobe Lightroom', 14),
('davinci', 'DaVinci Resolve', 15),
('after_effects', 'Adobe After Effects', 16),
('other', 'Other', 99)
ON CONFLICT (name) DO NOTHING;

-- Step 9: Insert sample predefined models
INSERT INTO equipment_predefined_models (equipment_type_id, brand, model, description, sort_order) VALUES
-- Cameras
((SELECT id FROM equipment_types WHERE name = 'camera_body'), 'canon', 'EOS R5', 'Professional mirrorless camera', 1),
((SELECT id FROM equipment_types WHERE name = 'camera_body'), 'canon', 'EOS R6', 'Advanced mirrorless camera', 2),
((SELECT id FROM equipment_types WHERE name = 'camera_body'), 'sony', 'A7R IV', 'High-resolution mirrorless camera', 3),
((SELECT id FROM equipment_types WHERE name = 'camera_body'), 'sony', 'A7 III', 'Full-frame mirrorless camera', 4),
((SELECT id FROM equipment_types WHERE name = 'camera_body'), 'nikon', 'Z6 II', 'Professional mirrorless camera', 5),
((SELECT id FROM equipment_types WHERE name = 'camera_body'), 'nikon', 'Z7 II', 'High-resolution mirrorless camera', 6),
((SELECT id FROM equipment_types WHERE name = 'camera_body'), 'fujifilm', 'X-T4', 'APS-C mirrorless camera', 7),
((SELECT id FROM equipment_types WHERE name = 'camera_body'), 'leica', 'Q2', 'Compact full-frame camera', 8),

-- Lenses
((SELECT id FROM equipment_types WHERE name = 'lens'), 'canon', 'RF 24-70mm f/2.8L IS USM', 'Professional zoom lens', 1),
((SELECT id FROM equipment_types WHERE name = 'lens'), 'canon', 'RF 70-200mm f/2.8L IS USM', 'Professional telephoto zoom', 2),
((SELECT id FROM equipment_types WHERE name = 'lens'), 'canon', 'RF 85mm f/1.2L USM', 'Portrait lens', 3),
((SELECT id FROM equipment_types WHERE name = 'lens'), 'sony', 'FE 24-70mm f/2.8 GM', 'Professional zoom lens', 4),
((SELECT id FROM equipment_types WHERE name = 'lens'), 'sony', 'FE 85mm f/1.4 GM', 'Portrait lens', 5),
((SELECT id FROM equipment_types WHERE name = 'lens'), 'sony', 'FE 70-200mm f/2.8 GM OSS', 'Professional telephoto zoom', 6),
((SELECT id FROM equipment_types WHERE name = 'lens'), 'nikon', 'NIKKOR Z 24-70mm f/2.8 S', 'Professional zoom lens', 7),
((SELECT id FROM equipment_types WHERE name = 'lens'), 'nikon', 'NIKKOR Z 85mm f/1.8 S', 'Portrait lens', 8),

-- Software
((SELECT id FROM equipment_types WHERE name = 'software'), 'adobe', 'Photoshop CC', 'Image editing software', 1),
((SELECT id FROM equipment_types WHERE name = 'software'), 'adobe', 'Lightroom Classic', 'Photo management and editing', 2),
((SELECT id FROM equipment_types WHERE name = 'software'), 'adobe', 'Premiere Pro', 'Video editing software', 3),
((SELECT id FROM equipment_types WHERE name = 'software'), 'adobe', 'After Effects', 'Motion graphics and VFX', 4),
((SELECT id FROM equipment_types WHERE name = 'software'), 'final_cut', 'Final Cut Pro X', 'Professional video editing', 5),
((SELECT id FROM equipment_types WHERE name = 'software'), 'davinci', 'DaVinci Resolve', 'Professional color grading and editing', 6),

-- Lighting
((SELECT id FROM equipment_types WHERE name = 'continuous_light'), 'other', 'LED Panel', 'Continuous lighting panel', 1),
((SELECT id FROM equipment_types WHERE name = 'strobe_light'), 'other', 'Studio Strobe', 'Professional studio flash', 2),
((SELECT id FROM equipment_types WHERE name = 'light_modifier'), 'other', 'Softbox', 'Light diffusion modifier', 3),
((SELECT id FROM equipment_types WHERE name = 'light_modifier'), 'other', 'Umbrella', 'Light reflection modifier', 4)
ON CONFLICT (equipment_type_id, brand, model) DO NOTHING;

-- Step 10: Enable RLS on all tables
ALTER TABLE equipment_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_predefined_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_equipment ENABLE ROW LEVEL SECURITY;

-- Step 11: Create RLS policies
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

-- Step 12: Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_equipment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_equipment_types_updated_at BEFORE UPDATE ON equipment_types FOR EACH ROW EXECUTE FUNCTION update_equipment_updated_at();
CREATE TRIGGER update_equipment_brands_updated_at BEFORE UPDATE ON equipment_brands FOR EACH ROW EXECUTE FUNCTION update_equipment_updated_at();
CREATE TRIGGER update_equipment_models_updated_at BEFORE UPDATE ON equipment_models FOR EACH ROW EXECUTE FUNCTION update_equipment_updated_at();
CREATE TRIGGER update_equipment_predefined_models_updated_at BEFORE UPDATE ON equipment_predefined_models FOR EACH ROW EXECUTE FUNCTION update_equipment_updated_at();
CREATE TRIGGER update_user_equipment_updated_at BEFORE UPDATE ON user_equipment FOR EACH ROW EXECUTE FUNCTION update_equipment_updated_at();

-- Step 13: Create view for easy access to user equipment
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

-- Step 14: Add comments for documentation
COMMENT ON TABLE equipment_types IS 'Types of equipment available in the system (cameras, lenses, etc.)';
COMMENT ON TABLE equipment_brands IS 'Brands of equipment (Canon, Sony, Nikon, etc.)';
COMMENT ON TABLE equipment_models IS 'Specific equipment models with details';
COMMENT ON TABLE equipment_predefined_models IS 'Predefined equipment models for quick selection';
COMMENT ON TABLE user_equipment IS 'User-specific equipment inventory';
COMMENT ON VIEW user_equipment_view IS 'View combining user equipment with model and type details';

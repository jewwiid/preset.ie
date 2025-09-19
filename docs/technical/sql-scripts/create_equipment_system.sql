-- Comprehensive Equipment System for Creative Professionals
-- This creates a structured equipment system with types and custom models

-- Create equipment_types table for predefined equipment categories
CREATE TABLE IF NOT EXISTS equipment_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Create equipment_models table for custom equipment entries
CREATE TABLE IF NOT EXISTS equipment_models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    equipment_type_id UUID NOT NULL REFERENCES equipment_types(id) ON DELETE CASCADE,
    brand VARCHAR(100),
    model VARCHAR(200) NOT NULL,
    description TEXT,
    specifications JSONB, -- Store technical specs as JSON
    purchase_date DATE,
    condition VARCHAR(20) CHECK (condition IN ('excellent', 'good', 'fair', 'poor')),
    is_available_for_rent BOOLEAN DEFAULT FALSE,
    rental_price_per_day DECIMAL(10,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_equipment table to link users with their equipment (simplified view)
CREATE TABLE IF NOT EXISTS user_equipment (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    equipment_model_id UUID NOT NULL REFERENCES equipment_models(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT FALSE, -- Mark primary equipment
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_equipment_types_category ON equipment_types(category);
CREATE INDEX IF NOT EXISTS idx_equipment_types_active ON equipment_types(is_active);
CREATE INDEX IF NOT EXISTS idx_equipment_models_user_id ON equipment_models(user_id);
CREATE INDEX IF NOT EXISTS idx_equipment_models_type_id ON equipment_models(equipment_type_id);
CREATE INDEX IF NOT EXISTS idx_user_equipment_user_id ON user_equipment(user_id);
CREATE INDEX IF NOT EXISTS idx_user_equipment_model_id ON user_equipment(equipment_model_id);

-- Insert predefined equipment types for creative professionals
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
('other', 'Other', 'Miscellaneous equipment', '🔧', 'Other', 99);

-- Add comments for documentation
COMMENT ON TABLE equipment_types IS 'Predefined equipment categories for creative professionals';
COMMENT ON TABLE equipment_models IS 'Custom equipment entries with detailed specifications';
COMMENT ON TABLE user_equipment IS 'Links users to their equipment models';

COMMENT ON COLUMN equipment_types.category IS 'Equipment category (Photography, Video, Audio, Lighting, etc.)';
COMMENT ON COLUMN equipment_models.specifications IS 'Technical specifications stored as JSON';
COMMENT ON COLUMN equipment_models.condition IS 'Equipment condition rating';
COMMENT ON COLUMN equipment_models.is_available_for_rent IS 'Whether equipment can be rented to others';
COMMENT ON COLUMN user_equipment.is_primary IS 'Mark primary equipment for quick access';

-- Create function to get user equipment with details
CREATE OR REPLACE FUNCTION get_user_equipment_details(user_uuid UUID)
RETURNS TABLE (
    id UUID,
    equipment_type_name VARCHAR(100),
    equipment_type_display_name VARCHAR(100),
    equipment_type_icon VARCHAR(10),
    equipment_type_category VARCHAR(50),
    brand VARCHAR(100),
    model VARCHAR(200),
    description TEXT,
    condition VARCHAR(20),
    is_primary BOOLEAN,
    display_order INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ue.id,
        et.name,
        et.display_name,
        et.icon,
        et.category,
        em.brand,
        em.model,
        em.description,
        em.condition,
        ue.is_primary,
        ue.display_order
    FROM user_equipment ue
    JOIN equipment_models em ON ue.equipment_model_id = em.id
    JOIN equipment_types et ON em.equipment_type_id = et.id
    WHERE ue.user_id = user_uuid
    ORDER BY ue.display_order ASC, et.sort_order ASC, em.brand ASC, em.model ASC;
END;
$$ LANGUAGE plpgsql;

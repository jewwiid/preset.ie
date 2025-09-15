-- Update Equipment Structure to Comprehensive System
-- This migration updates the current simple equipment system to the comprehensive one

DO $$
BEGIN
    RAISE NOTICE 'Starting comprehensive equipment structure update...';

    -- Step 1: Add equipment_type_id column to equipment_brands
    ALTER TABLE equipment_brands 
    ADD COLUMN IF NOT EXISTS equipment_type_id UUID REFERENCES equipment_types(id) ON DELETE CASCADE;
    
    RAISE NOTICE 'Added equipment_type_id column to equipment_brands';

    -- Step 2: Add missing equipment types
    INSERT INTO equipment_types (name, display_name, icon, category, sort_order) VALUES
    ('memory_card', 'Memory Card', '💾', 'accessories', 15),
    ('battery', 'Battery', '🔋', 'accessories', 16),
    ('filter', 'Filter', '🔍', 'accessories', 17),
    ('bag', 'Camera Bag', '🎒', 'accessories', 18),
    ('video_camera', 'Video Camera', '📹', 'video', 19),
    ('gimbal', 'Gimbal', '📱', 'video', 20),
    ('monitor', 'Monitor', '📺', 'video', 21),
    ('recorder', 'Recorder', '🎙️', 'audio', 22),
    ('audio_recorder', 'Audio Recorder', '🎤', 'audio', 23),
    ('headphones', 'Headphones', '🎧', 'audio', 24),
    ('speaker', 'Speaker', '🔊', 'audio', 25),
    ('continuous_light', 'Continuous Light', '💡', 'lighting', 26),
    ('strobe_light', 'Strobe Light', '⚡', 'lighting', 27),
    ('light_modifier', 'Light Modifier', '🎭', 'lighting', 28),
    ('light_stand', 'Light Stand', '🦵', 'lighting', 29),
    ('backdrop', 'Backdrop', '🖼️', 'accessories', 30),
    ('prop', 'Prop', '🎪', 'accessories', 31),
    ('reflector', 'Reflector', '✨', 'lighting', 32),
    ('diffuser', 'Diffuser', '☁️', 'lighting', 33),
    ('storage', 'Storage', '💿', 'computer', 34),
    ('tablet', 'Tablet', '📱', 'computer', 35),
    ('drone', 'Drone', '🚁', 'video', 36),
    ('other', 'Other', '🔧', 'accessories', 99)
    ON CONFLICT (name) DO NOTHING;

    RAISE NOTICE 'Added 23 new equipment types';

    -- Step 3: Update existing brands to link to equipment types
    -- Camera brands
    UPDATE equipment_brands SET equipment_type_id = (SELECT id FROM equipment_types WHERE name = 'camera') WHERE name IN ('canon', 'nikon', 'sony', 'panasonic', 'fujifilm', 'olympus');
    
    -- Software brands
    UPDATE equipment_brands SET equipment_type_id = (SELECT id FROM equipment_types WHERE name = 'software') WHERE name IN ('apple', 'microsoft', 'adobe', 'final_cut', 'premiere', 'photoshop', 'lightroom');

    RAISE NOTICE 'Updated existing brands to link to equipment types';

    -- Step 4: Add comprehensive brands for all equipment types
    -- Memory Cards
    INSERT INTO equipment_brands (name, display_name, equipment_type_id, is_popular, sort_order) VALUES
    ('sandisk', 'SanDisk', (SELECT id FROM equipment_types WHERE name = 'memory_card'), true, 1),
    ('lexar', 'Lexar', (SELECT id FROM equipment_types WHERE name = 'memory_card'), true, 2),
    ('sony', 'Sony', (SELECT id FROM equipment_types WHERE name = 'memory_card'), true, 3),
    ('kingston', 'Kingston', (SELECT id FROM equipment_types WHERE name = 'memory_card'), true, 4)
    ON CONFLICT (name, equipment_type_id) DO NOTHING;

    -- Batteries
    INSERT INTO equipment_brands (name, display_name, equipment_type_id, is_popular, sort_order) VALUES
    ('canon', 'Canon', (SELECT id FROM equipment_types WHERE name = 'battery'), true, 1),
    ('sony', 'Sony', (SELECT id FROM equipment_types WHERE name = 'battery'), true, 2),
    ('nikon', 'Nikon', (SELECT id FROM equipment_types WHERE name = 'battery'), true, 3),
    ('panasonic', 'Panasonic', (SELECT id FROM equipment_types WHERE name = 'battery'), true, 4)
    ON CONFLICT (name, equipment_type_id) DO NOTHING;

    -- Lenses (add to existing camera brands)
    INSERT INTO equipment_brands (name, display_name, equipment_type_id, is_popular, sort_order) VALUES
    ('canon', 'Canon', (SELECT id FROM equipment_types WHERE name = 'lens'), true, 1),
    ('sony', 'Sony', (SELECT id FROM equipment_types WHERE name = 'lens'), true, 2),
    ('nikon', 'Nikon', (SELECT id FROM equipment_types WHERE name = 'lens'), true, 3),
    ('sigma', 'Sigma', (SELECT id FROM equipment_types WHERE name = 'lens'), true, 4),
    ('tamron', 'Tamron', (SELECT id FROM equipment_types WHERE name = 'lens'), true, 5)
    ON CONFLICT (name, equipment_type_id) DO NOTHING;

    -- Video Cameras
    INSERT INTO equipment_brands (name, display_name, equipment_type_id, is_popular, sort_order) VALUES
    ('sony', 'Sony', (SELECT id FROM equipment_types WHERE name = 'video_camera'), true, 1),
    ('canon', 'Canon', (SELECT id FROM equipment_types WHERE name = 'video_camera'), true, 2),
    ('panasonic', 'Panasonic', (SELECT id FROM equipment_types WHERE name = 'video_camera'), true, 3),
    ('blackmagic', 'Blackmagic Design', (SELECT id FROM equipment_types WHERE name = 'video_camera'), true, 4)
    ON CONFLICT (name, equipment_type_id) DO NOTHING;

    -- Gimbals
    INSERT INTO equipment_brands (name, display_name, equipment_type_id, is_popular, sort_order) VALUES
    ('dji', 'DJI', (SELECT id FROM equipment_types WHERE name = 'gimbal'), true, 1),
    ('zhiyun', 'Zhiyun', (SELECT id FROM equipment_types WHERE name = 'gimbal'), true, 2),
    ('moza', 'MOZA', (SELECT id FROM equipment_types WHERE name = 'gimbal'), true, 3)
    ON CONFLICT (name, equipment_type_id) DO NOTHING;

    -- Monitors
    INSERT INTO equipment_brands (name, display_name, equipment_type_id, is_popular, sort_order) VALUES
    ('atomos', 'Atomos', (SELECT id FROM equipment_types WHERE name = 'monitor'), true, 1),
    ('smallhd', 'SmallHD', (SELECT id FROM equipment_types WHERE name = 'monitor'), true, 2),
    ('feelworld', 'FeelWorld', (SELECT id FROM equipment_types WHERE name = 'monitor'), true, 3)
    ON CONFLICT (name, equipment_type_id) DO NOTHING;

    -- Audio Equipment
    INSERT INTO equipment_brands (name, display_name, equipment_type_id, is_popular, sort_order) VALUES
    ('rode', 'Rode', (SELECT id FROM equipment_types WHERE name = 'audio'), true, 1),
    ('shure', 'Shure', (SELECT id FROM equipment_types WHERE name = 'audio'), true, 2),
    ('sennheiser', 'Sennheiser', (SELECT id FROM equipment_types WHERE name = 'audio'), true, 3),
    ('audio_technica', 'Audio-Technica', (SELECT id FROM equipment_types WHERE name = 'audio'), true, 4)
    ON CONFLICT (name, equipment_type_id) DO NOTHING;

    -- Recorders
    INSERT INTO equipment_brands (name, display_name, equipment_type_id, is_popular, sort_order) VALUES
    ('zoom', 'Zoom', (SELECT id FROM equipment_types WHERE name = 'recorder'), true, 1),
    ('tascam', 'Tascam', (SELECT id FROM equipment_types WHERE name = 'recorder'), true, 2),
    ('roland', 'Roland', (SELECT id FROM equipment_types WHERE name = 'recorder'), true, 3)
    ON CONFLICT (name, equipment_type_id) DO NOTHING;

    -- Headphones
    INSERT INTO equipment_brands (name, display_name, equipment_type_id, is_popular, sort_order) VALUES
    ('sony', 'Sony', (SELECT id FROM equipment_types WHERE name = 'headphones'), true, 1),
    ('sennheiser', 'Sennheiser', (SELECT id FROM equipment_types WHERE name = 'headphones'), true, 2),
    ('audio_technica', 'Audio-Technica', (SELECT id FROM equipment_types WHERE name = 'headphones'), true, 3)
    ON CONFLICT (name, equipment_type_id) DO NOTHING;

    -- Lighting
    INSERT INTO equipment_brands (name, display_name, equipment_type_id, is_popular, sort_order) VALUES
    ('profoto', 'Profoto', (SELECT id FROM equipment_types WHERE name = 'lighting'), true, 1),
    ('broncolor', 'Broncolor', (SELECT id FROM equipment_types WHERE name = 'lighting'), true, 2),
    ('elinchrom', 'Elinchrom', (SELECT id FROM equipment_types WHERE name = 'lighting'), true, 3),
    ('godox', 'Godox', (SELECT id FROM equipment_types WHERE name = 'lighting'), true, 4)
    ON CONFLICT (name, equipment_type_id) DO NOTHING;

    -- Continuous Lights
    INSERT INTO equipment_brands (name, display_name, equipment_type_id, is_popular, sort_order) VALUES
    ('arri', 'ARRI', (SELECT id FROM equipment_types WHERE name = 'continuous_light'), true, 1),
    ('kino_flo', 'Kino Flo', (SELECT id FROM equipment_types WHERE name = 'continuous_light'), true, 2),
    ('litepanels', 'Litepanels', (SELECT id FROM equipment_types WHERE name = 'continuous_light'), true, 3)
    ON CONFLICT (name, equipment_type_id) DO NOTHING;

    -- Strobe Lights
    INSERT INTO equipment_brands (name, display_name, equipment_type_id, is_popular, sort_order) VALUES
    ('profoto', 'Profoto', (SELECT id FROM equipment_types WHERE name = 'strobe_light'), true, 1),
    ('broncolor', 'Broncolor', (SELECT id FROM equipment_types WHERE name = 'strobe_light'), true, 2),
    ('elinchrom', 'Elinchrom', (SELECT id FROM equipment_types WHERE name = 'strobe_light'), true, 3)
    ON CONFLICT (name, equipment_type_id) DO NOTHING;

    -- Tripods
    INSERT INTO equipment_brands (name, display_name, equipment_type_id, is_popular, sort_order) VALUES
    ('manfrotto', 'Manfrotto', (SELECT id FROM equipment_types WHERE name = 'accessories'), true, 1),
    ('gitzo', 'Gitzo', (SELECT id FROM equipment_types WHERE name = 'accessories'), true, 2),
    ('peak_design', 'Peak Design', (SELECT id FROM equipment_types WHERE name = 'accessories'), true, 3)
    ON CONFLICT (name, equipment_type_id) DO NOTHING;

    -- Camera Bags
    INSERT INTO equipment_brands (name, display_name, equipment_type_id, is_popular, sort_order) VALUES
    ('peak_design', 'Peak Design', (SELECT id FROM equipment_types WHERE name = 'bag'), true, 1),
    ('lowepro', 'Lowepro', (SELECT id FROM equipment_types WHERE name = 'bag'), true, 2),
    ('think_tank', 'Think Tank', (SELECT id FROM equipment_types WHERE name = 'bag'), true, 3)
    ON CONFLICT (name, equipment_type_id) DO NOTHING;

    -- Computers
    INSERT INTO equipment_brands (name, display_name, equipment_type_id, is_popular, sort_order) VALUES
    ('apple', 'Apple', (SELECT id FROM equipment_types WHERE name = 'computer'), true, 1),
    ('dell', 'Dell', (SELECT id FROM equipment_types WHERE name = 'computer'), true, 2),
    ('hp', 'HP', (SELECT id FROM equipment_types WHERE name = 'computer'), true, 3),
    ('lenovo', 'Lenovo', (SELECT id FROM equipment_types WHERE name = 'computer'), true, 4)
    ON CONFLICT (name, equipment_type_id) DO NOTHING;

    -- Storage
    INSERT INTO equipment_brands (name, display_name, equipment_type_id, is_popular, sort_order) VALUES
    ('western_digital', 'Western Digital', (SELECT id FROM equipment_types WHERE name = 'storage'), true, 1),
    ('seagate', 'Seagate', (SELECT id FROM equipment_types WHERE name = 'storage'), true, 2),
    ('samsung', 'Samsung', (SELECT id FROM equipment_types WHERE name = 'storage'), true, 3)
    ON CONFLICT (name, equipment_type_id) DO NOTHING;

    -- Tablets
    INSERT INTO equipment_brands (name, display_name, equipment_type_id, is_popular, sort_order) VALUES
    ('apple', 'Apple', (SELECT id FROM equipment_types WHERE name = 'tablet'), true, 1),
    ('samsung', 'Samsung', (SELECT id FROM equipment_types WHERE name = 'tablet'), true, 2),
    ('wacom', 'Wacom', (SELECT id FROM equipment_types WHERE name = 'tablet'), true, 3)
    ON CONFLICT (name, equipment_type_id) DO NOTHING;

    -- Drones
    INSERT INTO equipment_brands (name, display_name, equipment_type_id, is_popular, sort_order) VALUES
    ('dji', 'DJI', (SELECT id FROM equipment_types WHERE name = 'drone'), true, 1),
    ('autel', 'Autel Robotics', (SELECT id FROM equipment_types WHERE name = 'drone'), true, 2),
    ('parrot', 'Parrot', (SELECT id FROM equipment_types WHERE name = 'drone'), true, 3)
    ON CONFLICT (name, equipment_type_id) DO NOTHING;

    RAISE NOTICE 'Added comprehensive brands for all equipment types';

    -- Step 5: Add comprehensive predefined models
    -- Camera Models
    INSERT INTO equipment_predefined_models (equipment_type_id, equipment_brand_id, brand, model, description, sort_order) VALUES
    ((SELECT id FROM equipment_types WHERE name = 'camera'), (SELECT id FROM equipment_brands WHERE name = 'canon' AND equipment_type_id = (SELECT id FROM equipment_types WHERE name = 'camera')), 'Canon', 'EOS R5', 'Professional mirrorless camera', 1),
    ((SELECT id FROM equipment_types WHERE name = 'camera'), (SELECT id FROM equipment_brands WHERE name = 'canon' AND equipment_type_id = (SELECT id FROM equipment_types WHERE name = 'camera')), 'Canon', 'EOS R6', 'Advanced mirrorless camera', 2),
    ((SELECT id FROM equipment_types WHERE name = 'camera'), (SELECT id FROM equipment_brands WHERE name = 'sony' AND equipment_type_id = (SELECT id FROM equipment_types WHERE name = 'camera')), 'Sony', 'A7R IV', 'High-resolution mirrorless camera', 3),
    ((SELECT id FROM equipment_types WHERE name = 'camera'), (SELECT id FROM equipment_brands WHERE name = 'sony' AND equipment_type_id = (SELECT id FROM equipment_types WHERE name = 'camera')), 'Sony', 'A7 III', 'Full-frame mirrorless camera', 4),
    ((SELECT id FROM equipment_types WHERE name = 'camera'), (SELECT id FROM equipment_brands WHERE name = 'nikon' AND equipment_type_id = (SELECT id FROM equipment_types WHERE name = 'camera')), 'Nikon', 'Z6 II', 'Versatile mirrorless camera', 5)
    ON CONFLICT (equipment_type_id, brand, model) DO NOTHING;

    -- Lens Models
    INSERT INTO equipment_predefined_models (equipment_type_id, equipment_brand_id, brand, model, description, sort_order) VALUES
    ((SELECT id FROM equipment_types WHERE name = 'lens'), (SELECT id FROM equipment_brands WHERE name = 'canon' AND equipment_type_id = (SELECT id FROM equipment_types WHERE name = 'lens')), 'Canon', 'RF 24-70mm f/2.8L IS USM', 'Professional zoom lens', 1),
    ((SELECT id FROM equipment_types WHERE name = 'lens'), (SELECT id FROM equipment_brands WHERE name = 'canon' AND equipment_type_id = (SELECT id FROM equipment_types WHERE name = 'lens')), 'Canon', 'RF 70-200mm f/2.8L IS USM', 'Professional telephoto zoom', 2),
    ((SELECT id FROM equipment_types WHERE name = 'lens'), (SELECT id FROM equipment_brands WHERE name = 'sony' AND equipment_type_id = (SELECT id FROM equipment_types WHERE name = 'lens')), 'Sony', 'FE 24-70mm f/2.8 GM', 'Professional zoom lens', 3),
    ((SELECT id FROM equipment_types WHERE name = 'lens'), (SELECT id FROM equipment_brands WHERE name = 'sony' AND equipment_type_id = (SELECT id FROM equipment_types WHERE name = 'lens')), 'Sony', 'FE 85mm f/1.4 GM', 'Professional portrait lens', 4),
    ((SELECT id FROM equipment_types WHERE name = 'lens'), (SELECT id FROM equipment_brands WHERE name = 'sigma' AND equipment_type_id = (SELECT id FROM equipment_types WHERE name = 'lens')), 'Sigma', '24-70mm f/2.8 DG OS HSM Art', 'Professional zoom lens', 5)
    ON CONFLICT (equipment_type_id, brand, model) DO NOTHING;

    -- Memory Card Models
    INSERT INTO equipment_predefined_models (equipment_type_id, equipment_brand_id, brand, model, description, sort_order) VALUES
    ((SELECT id FROM equipment_types WHERE name = 'memory_card'), (SELECT id FROM equipment_brands WHERE name = 'sandisk' AND equipment_type_id = (SELECT id FROM equipment_types WHERE name = 'memory_card')), 'SanDisk', 'Extreme Pro 128GB', 'High-speed SD card', 1),
    ((SELECT id FROM equipment_types WHERE name = 'memory_card'), (SELECT id FROM equipment_brands WHERE name = 'sandisk' AND equipment_type_id = (SELECT id FROM equipment_types WHERE name = 'memory_card')), 'SanDisk', 'Extreme Pro 64GB', 'High-speed SD card', 2),
    ((SELECT id FROM equipment_types WHERE name = 'memory_card'), (SELECT id FROM equipment_brands WHERE name = 'lexar' AND equipment_type_id = (SELECT id FROM equipment_types WHERE name = 'memory_card')), 'Lexar', 'Professional 1066x 128GB', 'Professional SD card', 3)
    ON CONFLICT (equipment_type_id, brand, model) DO NOTHING;

    -- Battery Models
    INSERT INTO equipment_predefined_models (equipment_type_id, equipment_brand_id, brand, model, description, sort_order) VALUES
    ((SELECT id FROM equipment_types WHERE name = 'battery'), (SELECT id FROM equipment_brands WHERE name = 'canon' AND equipment_type_id = (SELECT id FROM equipment_types WHERE name = 'battery')), 'Canon', 'LP-E6NH', 'High-capacity battery', 1),
    ((SELECT id FROM equipment_types WHERE name = 'battery'), (SELECT id FROM equipment_brands WHERE name = 'sony' AND equipment_type_id = (SELECT id FROM equipment_types WHERE name = 'battery')), 'Sony', 'NP-FZ100', 'High-capacity battery', 2),
    ((SELECT id FROM equipment_types WHERE name = 'battery'), (SELECT id FROM equipment_brands WHERE name = 'nikon' AND equipment_type_id = (SELECT id FROM equipment_types WHERE name = 'battery')), 'Nikon', 'EN-EL15C', 'High-capacity battery', 3)
    ON CONFLICT (equipment_type_id, brand, model) DO NOTHING;

    -- Video Camera Models
    INSERT INTO equipment_predefined_models (equipment_type_id, equipment_brand_id, brand, model, description, sort_order) VALUES
    ((SELECT id FROM equipment_types WHERE name = 'video_camera'), (SELECT id FROM equipment_brands WHERE name = 'sony' AND equipment_type_id = (SELECT id FROM equipment_types WHERE name = 'video_camera')), 'Sony', 'FX3', 'Cinema camera', 1),
    ((SELECT id FROM equipment_types WHERE name = 'video_camera'), (SELECT id FROM equipment_brands WHERE name = 'sony' AND equipment_type_id = (SELECT id FROM equipment_types WHERE name = 'video_camera')), 'Sony', 'FX6', 'Professional cinema camera', 2),
    ((SELECT id FROM equipment_types WHERE name = 'video_camera'), (SELECT id FROM equipment_brands WHERE name = 'canon' AND equipment_type_id = (SELECT id FROM equipment_types WHERE name = 'video_camera')), 'Canon', 'EOS R5 C', 'Cinema camera', 3)
    ON CONFLICT (equipment_type_id, brand, model) DO NOTHING;

    -- Gimbal Models
    INSERT INTO equipment_predefined_models (equipment_type_id, equipment_brand_id, brand, model, description, sort_order) VALUES
    ((SELECT id FROM equipment_types WHERE name = 'gimbal'), (SELECT id FROM equipment_brands WHERE name = 'dji' AND equipment_type_id = (SELECT id FROM equipment_types WHERE name = 'gimbal')), 'DJI', 'RS 3 Pro', 'Professional gimbal', 1),
    ((SELECT id FROM equipment_types WHERE name = 'gimbal'), (SELECT id FROM equipment_brands WHERE name = 'dji' AND equipment_type_id = (SELECT id FROM equipment_types WHERE name = 'gimbal')), 'DJI', 'RS 3', 'Advanced gimbal', 2),
    ((SELECT id FROM equipment_types WHERE name = 'gimbal'), (SELECT id FROM equipment_brands WHERE name = 'zhiyun' AND equipment_type_id = (SELECT id FROM equipment_types WHERE name = 'gimbal')), 'Zhiyun', 'Crane 4', 'Professional gimbal', 3)
    ON CONFLICT (equipment_type_id, brand, model) DO NOTHING;

    -- Monitor Models
    INSERT INTO equipment_predefined_models (equipment_type_id, equipment_brand_id, brand, model, description, sort_order) VALUES
    ((SELECT id FROM equipment_types WHERE name = 'monitor'), (SELECT id FROM equipment_brands WHERE name = 'atomos' AND equipment_type_id = (SELECT id FROM equipment_types WHERE name = 'monitor')), 'Atomos', 'Ninja V', 'Professional monitor', 1),
    ((SELECT id FROM equipment_types WHERE name = 'monitor'), (SELECT id FROM equipment_brands WHERE name = 'smallhd' AND equipment_type_id = (SELECT id FROM equipment_types WHERE name = 'monitor')), 'SmallHD', 'Focus 7', 'Professional monitor', 2),
    ((SELECT id FROM equipment_types WHERE name = 'monitor'), (SELECT id FROM equipment_brands WHERE name = 'feelworld' AND equipment_type_id = (SELECT id FROM equipment_types WHERE name = 'monitor')), 'FeelWorld', 'F7 Pro', 'Professional monitor', 3)
    ON CONFLICT (equipment_type_id, brand, model) DO NOTHING;

    -- Audio Models
    INSERT INTO equipment_predefined_models (equipment_type_id, equipment_brand_id, brand, model, description, sort_order) VALUES
    ((SELECT id FROM equipment_types WHERE name = 'audio'), (SELECT id FROM equipment_brands WHERE name = 'rode' AND equipment_type_id = (SELECT id FROM equipment_types WHERE name = 'audio')), 'Rode', 'VideoMic Pro Plus', 'Professional microphone', 1),
    ((SELECT id FROM equipment_types WHERE name = 'audio'), (SELECT id FROM equipment_brands WHERE name = 'rode' AND equipment_type_id = (SELECT id FROM equipment_types WHERE name = 'audio')), 'Rode', 'Wireless GO II', 'Wireless microphone', 2),
    ((SELECT id FROM equipment_types WHERE name = 'audio'), (SELECT id FROM equipment_brands WHERE name = 'shure' AND equipment_type_id = (SELECT id FROM equipment_types WHERE name = 'audio')), 'Shure', 'SM7B', 'Dynamic microphone', 3)
    ON CONFLICT (equipment_type_id, brand, model) DO NOTHING;

    -- Recorder Models
    INSERT INTO equipment_predefined_models (equipment_type_id, equipment_brand_id, brand, model, description, sort_order) VALUES
    ((SELECT id FROM equipment_types WHERE name = 'recorder'), (SELECT id FROM equipment_brands WHERE name = 'zoom' AND equipment_type_id = (SELECT id FROM equipment_types WHERE name = 'recorder')), 'Zoom', 'H6 Handy Recorder', 'Professional recorder', 1),
    ((SELECT id FROM equipment_types WHERE name = 'recorder'), (SELECT id FROM equipment_brands WHERE name = 'zoom' AND equipment_type_id = (SELECT id FROM equipment_types WHERE name = 'recorder')), 'Zoom', 'PodTrak P4', 'Podcast recorder', 2),
    ((SELECT id FROM equipment_types WHERE name = 'recorder'), (SELECT id FROM equipment_brands WHERE name = 'tascam' AND equipment_type_id = (SELECT id FROM equipment_types WHERE name = 'recorder')), 'Tascam', 'DR-40X', 'Professional recorder', 3)
    ON CONFLICT (equipment_type_id, brand, model) DO NOTHING;

    -- Headphone Models
    INSERT INTO equipment_predefined_models (equipment_type_id, equipment_brand_id, brand, model, description, sort_order) VALUES
    ((SELECT id FROM equipment_types WHERE name = 'headphones'), (SELECT id FROM equipment_brands WHERE name = 'sony' AND equipment_type_id = (SELECT id FROM equipment_types WHERE name = 'headphones')), 'Sony', 'WH-1000XM5', 'Noise-canceling headphones', 1),
    ((SELECT id FROM equipment_types WHERE name = 'headphones'), (SELECT id FROM equipment_brands WHERE name = 'sennheiser' AND equipment_type_id = (SELECT id FROM equipment_types WHERE name = 'headphones')), 'Sennheiser', 'HD 660S', 'Professional headphones', 2),
    ((SELECT id FROM equipment_types WHERE name = 'headphones'), (SELECT id FROM equipment_brands WHERE name = 'audio_technica' AND equipment_type_id = (SELECT id FROM equipment_types WHERE name = 'headphones')), 'Audio-Technica', 'ATH-M50x', 'Professional headphones', 3)
    ON CONFLICT (equipment_type_id, brand, model) DO NOTHING;

    -- Lighting Models
    INSERT INTO equipment_predefined_models (equipment_type_id, equipment_brand_id, brand, model, description, sort_order) VALUES
    ((SELECT id FROM equipment_types WHERE name = 'lighting'), (SELECT id FROM equipment_brands WHERE name = 'profoto' AND equipment_type_id = (SELECT id FROM equipment_types WHERE name = 'lighting')), 'Profoto', 'A1X', 'Professional flash', 1),
    ((SELECT id FROM equipment_types WHERE name = 'lighting'), (SELECT id FROM equipment_brands WHERE name = 'profoto' AND equipment_type_id = (SELECT id FROM equipment_types WHERE name = 'lighting')), 'Profoto', 'B10 Plus', 'Professional strobe', 2),
    ((SELECT id FROM equipment_types WHERE name = 'lighting'), (SELECT id FROM equipment_brands WHERE name = 'godox' AND equipment_type_id = (SELECT id FROM equipment_types WHERE name = 'lighting')), 'Godox', 'AD200 Pro', 'Professional strobe', 3)
    ON CONFLICT (equipment_type_id, brand, model) DO NOTHING;

    -- Continuous Light Models
    INSERT INTO equipment_predefined_models (equipment_type_id, equipment_brand_id, brand, model, description, sort_order) VALUES
    ((SELECT id FROM equipment_types WHERE name = 'continuous_light'), (SELECT id FROM equipment_brands WHERE name = 'arri' AND equipment_type_id = (SELECT id FROM equipment_types WHERE name = 'continuous_light')), 'ARRI', 'Orbiter', 'Professional LED light', 1),
    ((SELECT id FROM equipment_types WHERE name = 'continuous_light'), (SELECT id FROM equipment_brands WHERE name = 'kino_flo' AND equipment_type_id = (SELECT id FROM equipment_types WHERE name = 'continuous_light')), 'Kino Flo', 'Diva-Lite 400', 'Professional LED light', 2),
    ((SELECT id FROM equipment_types WHERE name = 'continuous_light'), (SELECT id FROM equipment_brands WHERE name = 'litepanels' AND equipment_type_id = (SELECT id FROM equipment_types WHERE name = 'continuous_light')), 'Litepanels', 'Astra 6X', 'Professional LED light', 3)
    ON CONFLICT (equipment_type_id, brand, model) DO NOTHING;

    -- Strobe Light Models
    INSERT INTO equipment_predefined_models (equipment_type_id, equipment_brand_id, brand, model, description, sort_order) VALUES
    ((SELECT id FROM equipment_types WHERE name = 'strobe_light'), (SELECT id FROM equipment_brands WHERE name = 'profoto' AND equipment_type_id = (SELECT id FROM equipment_types WHERE name = 'strobe_light')), 'Profoto', 'A1X', 'Professional strobe', 1),
    ((SELECT id FROM equipment_types WHERE name = 'strobe_light'), (SELECT id FROM equipment_brands WHERE name = 'profoto' AND equipment_type_id = (SELECT id FROM equipment_types WHERE name = 'strobe_light')), 'Profoto', 'B10 Plus', 'Professional strobe', 2),
    ((SELECT id FROM equipment_types WHERE name = 'strobe_light'), (SELECT id FROM equipment_brands WHERE name = 'broncolor' AND equipment_type_id = (SELECT id FROM equipment_types WHERE name = 'strobe_light')), 'Broncolor', 'Siros L 400Ws', 'Professional strobe', 3)
    ON CONFLICT (equipment_type_id, brand, model) DO NOTHING;

    -- Tripod Models
    INSERT INTO equipment_predefined_models (equipment_type_id, equipment_brand_id, brand, model, description, sort_order) VALUES
    ((SELECT id FROM equipment_types WHERE name = 'accessories'), (SELECT id FROM equipment_brands WHERE name = 'manfrotto' AND equipment_type_id = (SELECT id FROM equipment_types WHERE name = 'accessories')), 'Manfrotto', 'MT055CXPRO4', 'Professional tripod', 1),
    ((SELECT id FROM equipment_types WHERE name = 'accessories'), (SELECT id FROM equipment_brands WHERE name = 'gitzo' AND equipment_type_id = (SELECT id FROM equipment_types WHERE name = 'accessories')), 'Gitzo', 'GT3543XLS', 'Professional tripod', 2),
    ((SELECT id FROM equipment_types WHERE name = 'accessories'), (SELECT id FROM equipment_brands WHERE name = 'peak_design' AND equipment_type_id = (SELECT id FROM equipment_types WHERE name = 'accessories')), 'Peak Design', 'Travel Tripod', 'Travel tripod', 3)
    ON CONFLICT (equipment_type_id, brand, model) DO NOTHING;

    -- Camera Bag Models
    INSERT INTO equipment_predefined_models (equipment_type_id, equipment_brand_id, brand, model, description, sort_order) VALUES
    ((SELECT id FROM equipment_types WHERE name = 'bag'), (SELECT id FROM equipment_brands WHERE name = 'peak_design' AND equipment_type_id = (SELECT id FROM equipment_types WHERE name = 'bag')), 'Peak Design', 'Everyday Backpack 30L', 'Professional camera backpack', 1),
    ((SELECT id FROM equipment_types WHERE name = 'bag'), (SELECT id FROM equipment_brands WHERE name = 'peak_design' AND equipment_type_id = (SELECT id FROM equipment_types WHERE name = 'bag')), 'Peak Design', 'Everyday Sling 6L', 'Professional camera sling', 2),
    ((SELECT id FROM equipment_types WHERE name = 'bag'), (SELECT id FROM equipment_brands WHERE name = 'lowepro' AND equipment_type_id = (SELECT id FROM equipment_types WHERE name = 'bag')), 'Lowepro', 'ProTactic BP 450 AW II', 'Professional camera backpack', 3)
    ON CONFLICT (equipment_type_id, brand, model) DO NOTHING;

    -- Computer Models
    INSERT INTO equipment_predefined_models (equipment_type_id, equipment_brand_id, brand, model, description, sort_order) VALUES
    ((SELECT id FROM equipment_types WHERE name = 'computer'), (SELECT id FROM equipment_brands WHERE name = 'apple' AND equipment_type_id = (SELECT id FROM equipment_types WHERE name = 'computer')), 'Apple', 'MacBook Pro M3', 'Professional laptop', 1),
    ((SELECT id FROM equipment_types WHERE name = 'computer'), (SELECT id FROM equipment_brands WHERE name = 'apple' AND equipment_type_id = (SELECT id FROM equipment_types WHERE name = 'computer')), 'Apple', 'Mac Studio M2', 'Professional desktop', 2),
    ((SELECT id FROM equipment_types WHERE name = 'computer'), (SELECT id FROM equipment_brands WHERE name = 'dell' AND equipment_type_id = (SELECT id FROM equipment_types WHERE name = 'computer')), 'Dell', 'XPS 15', 'Professional laptop', 3)
    ON CONFLICT (equipment_type_id, brand, model) DO NOTHING;

    -- Software Models
    INSERT INTO equipment_predefined_models (equipment_type_id, equipment_brand_id, brand, model, description, sort_order) VALUES
    ((SELECT id FROM equipment_types WHERE name = 'software'), (SELECT id FROM equipment_brands WHERE name = 'adobe' AND equipment_type_id = (SELECT id FROM equipment_types WHERE name = 'software')), 'Adobe', 'Photoshop', 'Photo editing software', 1),
    ((SELECT id FROM equipment_types WHERE name = 'software'), (SELECT id FROM equipment_brands WHERE name = 'adobe' AND equipment_type_id = (SELECT id FROM equipment_types WHERE name = 'software')), 'Adobe', 'Lightroom Classic', 'Photo management software', 2),
    ((SELECT id FROM equipment_types WHERE name = 'software'), (SELECT id FROM equipment_brands WHERE name = 'adobe' AND equipment_type_id = (SELECT id FROM equipment_types WHERE name = 'software')), 'Adobe', 'Premiere Pro', 'Video editing software', 3),
    ((SELECT id FROM equipment_types WHERE name = 'software'), (SELECT id FROM equipment_brands WHERE name = 'apple' AND equipment_type_id = (SELECT id FROM equipment_types WHERE name = 'software')), 'Apple', 'Final Cut Pro', 'Video editing software', 4)
    ON CONFLICT (equipment_type_id, brand, model) DO NOTHING;

    -- Storage Models
    INSERT INTO equipment_predefined_models (equipment_type_id, equipment_brand_id, brand, model, description, sort_order) VALUES
    ((SELECT id FROM equipment_types WHERE name = 'storage'), (SELECT id FROM equipment_brands WHERE name = 'western_digital' AND equipment_type_id = (SELECT id FROM equipment_types WHERE name = 'storage')), 'Western Digital', 'My Passport 2TB', 'Portable hard drive', 1),
    ((SELECT id FROM equipment_types WHERE name = 'storage'), (SELECT id FROM equipment_brands WHERE name = 'seagate' AND equipment_type_id = (SELECT id FROM equipment_types WHERE name = 'storage')), 'Seagate', 'Backup Plus 4TB', 'External hard drive', 2),
    ((SELECT id FROM equipment_types WHERE name = 'storage'), (SELECT id FROM equipment_brands WHERE name = 'samsung' AND equipment_type_id = (SELECT id FROM equipment_types WHERE name = 'storage')), 'Samsung', 'T7 Portable SSD 1TB', 'Portable SSD', 3)
    ON CONFLICT (equipment_type_id, brand, model) DO NOTHING;

    -- Tablet Models
    INSERT INTO equipment_predefined_models (equipment_type_id, equipment_brand_id, brand, model, description, sort_order) VALUES
    ((SELECT id FROM equipment_types WHERE name = 'tablet'), (SELECT id FROM equipment_brands WHERE name = 'apple' AND equipment_type_id = (SELECT id FROM equipment_types WHERE name = 'tablet')), 'Apple', 'iPad Pro 12.9"', 'Professional tablet', 1),
    ((SELECT id FROM equipment_types WHERE name = 'tablet'), (SELECT id FROM equipment_brands WHERE name = 'apple' AND equipment_type_id = (SELECT id FROM equipment_types WHERE name = 'tablet')), 'Apple', 'iPad Air', 'Professional tablet', 2),
    ((SELECT id FROM equipment_types WHERE name = 'tablet'), (SELECT id FROM equipment_brands WHERE name = 'samsung' AND equipment_type_id = (SELECT id FROM equipment_types WHERE name = 'tablet')), 'Samsung', 'Galaxy Tab S9', 'Professional tablet', 3)
    ON CONFLICT (equipment_type_id, brand, model) DO NOTHING;

    -- Drone Models
    INSERT INTO equipment_predefined_models (equipment_type_id, equipment_brand_id, brand, model, description, sort_order) VALUES
    ((SELECT id FROM equipment_types WHERE name = 'drone'), (SELECT id FROM equipment_brands WHERE name = 'dji' AND equipment_type_id = (SELECT id FROM equipment_types WHERE name = 'drone')), 'DJI', 'Mavic 3 Pro', 'Professional drone', 1),
    ((SELECT id FROM equipment_types WHERE name = 'drone'), (SELECT id FROM equipment_brands WHERE name = 'dji' AND equipment_type_id = (SELECT id FROM equipment_types WHERE name = 'drone')), 'DJI', 'Air 3', 'Professional drone', 2),
    ((SELECT id FROM equipment_types WHERE name = 'drone'), (SELECT id FROM equipment_brands WHERE name = 'dji' AND equipment_type_id = (SELECT id FROM equipment_types WHERE name = 'drone')), 'DJI', 'Mini 4 Pro', 'Compact drone', 3)
    ON CONFLICT (equipment_type_id, brand, model) DO NOTHING;

    RAISE NOTICE 'Added comprehensive predefined models for all equipment types';

    -- Step 6: Update the unique constraint on equipment_brands
    -- Drop the old unique constraint on name only
    ALTER TABLE equipment_brands DROP CONSTRAINT IF EXISTS equipment_brands_name_key;
    
    -- Add new composite unique constraint
    ALTER TABLE equipment_brands 
    ADD CONSTRAINT equipment_brands_name_type_unique 
    UNIQUE (name, equipment_type_id);

    RAISE NOTICE 'Updated unique constraint to allow same brand name for different equipment types';

    -- Step 7: Add indexes for performance
    CREATE INDEX IF NOT EXISTS idx_equipment_brands_type_id ON equipment_brands(equipment_type_id);
    CREATE INDEX IF NOT EXISTS idx_equipment_brands_popular ON equipment_brands(is_popular);
    CREATE INDEX IF NOT EXISTS idx_equipment_predefined_models_brand_id ON equipment_predefined_models(equipment_brand_id);
    CREATE INDEX IF NOT EXISTS idx_equipment_predefined_models_popular ON equipment_predefined_models(is_popular);

    RAISE NOTICE 'Added performance indexes';

    -- Step 8: Update the user_equipment table to use the new structure
    -- The user_equipment table should now work with the updated equipment_models table
    -- No changes needed as it already references equipment_models.id

    RAISE NOTICE 'Equipment structure update completed successfully!';
    RAISE NOTICE 'Summary:';
    RAISE NOTICE '- Added 23 new equipment types';
    RAISE NOTICE '- Added equipment_type_id column to equipment_brands';
    RAISE NOTICE '- Added comprehensive brands for all equipment types';
    RAISE NOTICE '- Added comprehensive predefined models for all equipment types';
    RAISE NOTICE '- Updated unique constraints to allow same brand for different equipment types';
    RAISE NOTICE '- Added performance indexes';
    RAISE NOTICE 'The equipment system is now comprehensive and ready for production use!';

END $$;

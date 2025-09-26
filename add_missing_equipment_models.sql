-- Add missing predefined equipment models to populate the marketplace
-- This script adds comprehensive models for categories that are currently empty

-- Add Audio Equipment Models
INSERT INTO equipment_predefined_models (equipment_type_id, brand, model, description, sort_order) VALUES
-- Microphones
((SELECT id FROM equipment_types WHERE name = 'microphone'), 'rode', 'NTG5', 'Professional shotgun microphone', 1),
((SELECT id FROM equipment_types WHERE name = 'microphone'), 'rode', 'Wireless GO II', 'Wireless microphone system', 2),
((SELECT id FROM equipment_types WHERE name = 'microphone'), 'shure', 'SM7B', 'Dynamic microphone for broadcasting', 3),
((SELECT id FROM equipment_types WHERE name = 'microphone'), 'shure', 'SM58', 'Dynamic vocal microphone', 4),
((SELECT id FROM equipment_types WHERE name = 'microphone'), 'audio-technica', 'AT2020', 'Condenser microphone', 5),
((SELECT id FROM equipment_types WHERE name = 'microphone'), 'sennheiser', 'MKE 600', 'Shotgun microphone', 6),

-- Headphones
((SELECT id FROM equipment_types WHERE name = 'headphones'), 'sony', 'WH1000XM4', 'Noise-cancelling headphones', 1),
((SELECT id FROM equipment_types WHERE name = 'headphones'), 'sony', 'WH1000XM5', 'Premium noise-cancelling headphones', 2),
((SELECT id FROM equipment_types WHERE name = 'headphones'), 'bose', 'QuietComfort 45', 'Noise-cancelling headphones', 3),
((SELECT id FROM equipment_types WHERE name = 'headphones'), 'audio-technica', 'ATH-M50x', 'Professional monitoring headphones', 4),
((SELECT id FROM equipment_types WHERE name = 'headphones'), 'sennheiser', 'HD 600', 'Open-back reference headphones', 5),

-- Audio Recorders
((SELECT id FROM equipment_types WHERE name = 'audio_recorder'), 'zoom', 'H6', 'Handy recorder with interchangeable capsules', 1),
((SELECT id FROM equipment_types WHERE name = 'audio_recorder'), 'zoom', 'PodTrak P4', 'Podcast recording interface', 2),
((SELECT id FROM equipment_types WHERE name = 'audio_recorder'), 'tascam', 'DR-40X', '4-track portable recorder', 3),
((SELECT id FROM equipment_types WHERE name = 'audio_recorder'), 'roland', 'R-07', 'High-resolution portable recorder', 4),

-- Speakers
((SELECT id FROM equipment_types WHERE name = 'speaker'), 'jbl', 'Charge 4', 'Portable Bluetooth speaker', 1),
((SELECT id FROM equipment_types WHERE name = 'speaker'), 'bose', 'SoundLink Revolve', '360-degree portable speaker', 2),
((SELECT id FROM equipment_types WHERE name = 'speaker'), 'sony', 'SRS-XB43', 'Extra bass portable speaker', 3);

-- Add Video Equipment Models
INSERT INTO equipment_predefined_models (equipment_type_id, brand, model, description, sort_order) VALUES
-- Video Cameras
((SELECT id FROM equipment_types WHERE name = 'video_camera'), 'canon', 'EOS R5 C', 'Cinema camera with 8K recording', 1),
((SELECT id FROM equipment_types WHERE name = 'video_camera'), 'sony', 'FX3', 'Full-frame cinema camera', 2),
((SELECT id FROM equipment_types WHERE name = 'video_camera'), 'panasonic', 'GH6', 'Micro Four Thirds video camera', 3),
((SELECT id FROM equipment_types WHERE name = 'video_camera'), 'blackmagic', 'Pocket Cinema Camera 6K', 'Professional cinema camera', 4),
((SELECT id FROM equipment_types WHERE name = 'video_camera'), 'red', 'Komodo', 'Professional cinema camera', 5),

-- Gimbals
((SELECT id FROM equipment_types WHERE name = 'gimbal'), 'dji', 'RS 3 Pro', 'Professional 3-axis gimbal', 1),
((SELECT id FROM equipment_types WHERE name = 'gimbal'), 'dji', 'RS 3 Mini', 'Compact 3-axis gimbal', 2),
((SELECT id FROM equipment_types WHERE name = 'gimbal'), 'zhiyun', 'Crane 4', 'Professional gimbal stabilizer', 3),
((SELECT id FROM equipment_types WHERE name = 'gimbal'), 'moza', 'AirCross 3', '3-axis handheld gimbal', 4),

-- Monitors
((SELECT id FROM equipment_types WHERE name = 'monitor'), 'atomos', 'Ninja V', '5-inch 4K HDR monitor-recorder', 1),
((SELECT id FROM equipment_types WHERE name = 'monitor'), 'smallhd', 'Focus 7', '7-inch on-camera monitor', 2),
((SELECT id FROM equipment_types WHERE name = 'monitor'), 'feelworld', 'F7', '7-inch 4K monitor', 3),

-- Recorders
((SELECT id FROM equipment_types WHERE name = 'recorder'), 'atomos', 'Shinobi', '5-inch 4K monitor', 1),
((SELECT id FROM equipment_types WHERE name = 'recorder'), 'blackmagic', 'Video Assist 12G', '5-inch 12G-SDI monitor-recorder', 2);

-- Add Studio Equipment Models
INSERT INTO equipment_predefined_models (equipment_type_id, brand, model, description, sort_order) VALUES
-- Backdrops
((SELECT id FROM equipment_types WHERE name = 'backdrop'), 'seamless', 'Paper Roll', 'Seamless background paper', 1),
((SELECT id FROM equipment_types WHERE name = 'backdrop'), 'muslin', 'Cotton Backdrop', 'Washable muslin backdrop', 2),
((SELECT id FROM equipment_types WHERE name = 'backdrop'), 'vinyl', 'Vinyl Backdrop', 'Durable vinyl backdrop', 3),

-- Props
((SELECT id FROM equipment_types WHERE name = 'prop'), 'vintage', 'Antique Chair', 'Vintage photography prop', 1),
((SELECT id FROM equipment_types WHERE name = 'prop'), 'modern', 'Contemporary Sofa', 'Modern furniture prop', 2),
((SELECT id FROM equipment_types WHERE name = 'prop'), 'decorative', 'Flower Arrangement', 'Decorative floral prop', 3),

-- Reflectors
((SELECT id FROM equipment_types WHERE name = 'reflector'), '5-in-1', 'Reflector Kit', '5-in-1 collapsible reflector', 1),
((SELECT id FROM equipment_types WHERE name = 'reflector'), 'silver', 'Silver Reflector', 'Silver reflective surface', 2),
((SELECT id FROM equipment_types WHERE name = 'reflector'), 'gold', 'Gold Reflector', 'Gold reflective surface', 3),

-- Diffusers
((SELECT id FROM equipment_types WHERE name = 'diffuser'), 'softbox', 'Softbox Diffuser', 'Light diffusion softbox', 1),
((SELECT id FROM equipment_types WHERE name = 'diffuser'), 'umbrella', 'Shoot-through Umbrella', 'Light diffusion umbrella', 2);

-- Add Computing Equipment Models
INSERT INTO equipment_predefined_models (equipment_type_id, brand, model, description, sort_order) VALUES
-- Computers
((SELECT id FROM equipment_types WHERE name = 'computer'), 'apple', 'MacBook Pro M2', 'Professional laptop with M2 chip', 1),
((SELECT id FROM equipment_types WHERE name = 'computer'), 'apple', 'Mac Studio M2', 'Desktop workstation with M2 chip', 2),
((SELECT id FROM equipment_types WHERE name = 'computer'), 'dell', 'XPS 15', 'High-performance laptop', 3),
((SELECT id FROM equipment_types WHERE name = 'computer'), 'hp', 'ZBook Studio', 'Mobile workstation', 4),

-- Storage
((SELECT id FROM equipment_types WHERE name = 'storage'), 'samsung', 'T7 SSD', 'Portable SSD drive', 1),
((SELECT id FROM equipment_types WHERE name = 'storage'), 'sandisk', 'Extreme Pro', 'High-speed memory card', 2),
((SELECT id FROM equipment_types WHERE name = 'storage'), 'seagate', 'Backup Plus', 'External hard drive', 3),

-- Tablets
((SELECT id FROM equipment_types WHERE name = 'tablet'), 'apple', 'iPad Pro', 'Professional tablet', 1),
((SELECT id FROM equipment_types WHERE name = 'tablet'), 'wacom', 'Cintiq 22', 'Drawing tablet display', 2),
((SELECT id FROM equipment_types WHERE name = 'tablet'), 'huion', 'Kamvas Pro', 'Graphics tablet', 3);

-- Add Transportation Equipment Models
INSERT INTO equipment_predefined_models (equipment_type_id, brand, model, description, sort_order) VALUES
-- Vehicles
((SELECT id FROM equipment_types WHERE name = 'vehicle'), 'equipment', 'Van Rental', 'Equipment transport van', 1),
((SELECT id FROM equipment_types WHERE name = 'vehicle'), 'equipment', 'Truck Rental', 'Heavy equipment truck', 2),

-- Drones
((SELECT id FROM equipment_types WHERE name = 'drone'), 'dji', 'Mavic 3 Pro', 'Professional aerial drone', 1),
((SELECT id FROM equipment_types WHERE name = 'drone'), 'dji', 'Air 2S', 'Consumer aerial drone', 2),
((SELECT id FROM equipment_types WHERE name = 'drone'), 'dji', 'Mini 3 Pro', 'Compact aerial drone', 3);

-- Add Photography Equipment Models (additional)
INSERT INTO equipment_predefined_models (equipment_type_id, brand, model, description, sort_order) VALUES
-- Tripods
((SELECT id FROM equipment_types WHERE name = 'tripod'), 'manfrotto', '055 Carbon Fiber', 'Professional carbon fiber tripod', 1),
((SELECT id FROM equipment_types WHERE name = 'tripod'), 'gitzo', 'GT3543XLS', 'Systematic carbon fiber tripod', 2),
((SELECT id FROM equipment_types WHERE name = 'tripod'), 'peak design', 'Travel Tripod', 'Compact travel tripod', 3),

-- Memory Cards
((SELECT id FROM equipment_types WHERE name = 'memory_card'), 'sandisk', 'Extreme Pro CFexpress', 'High-speed CFexpress card', 1),
((SELECT id FROM equipment_types WHERE name = 'memory_card'), 'lexar', 'Professional CFast', 'Professional CFast card', 2),
((SELECT id FROM equipment_types WHERE name = 'memory_card'), 'prograde', 'Digital Film', 'Professional SD card', 3),

-- Batteries
((SELECT id FROM equipment_types WHERE name = 'battery'), 'canon', 'LP-E6NH', 'High-capacity camera battery', 1),
((SELECT id FROM equipment_types WHERE name = 'battery'), 'sony', 'NP-FZ100', 'High-capacity mirrorless battery', 2),
((SELECT id FROM equipment_types WHERE name = 'battery'), 'anker', 'PowerCore', 'Portable power bank', 3),

-- Filters
((SELECT id FROM equipment_types WHERE name = 'filter'), 'hoya', 'HD UV Filter', 'High-definition UV filter', 1),
((SELECT id FROM equipment_types WHERE name = 'filter'), 'tiffen', 'Circular Polarizer', 'Circular polarizing filter', 2),
((SELECT id FROM equipment_types WHERE name = 'filter'), 'lee', 'Big Stopper', '10-stop neutral density filter', 3),

-- Camera Bags
((SELECT id FROM equipment_types WHERE name = 'bag'), 'peak design', 'Everyday Backpack', 'Professional camera backpack', 1),
((SELECT id FROM equipment_types WHERE name = 'bag'), 'lowepro', 'ProTactic', 'Professional camera bag', 2),
((SELECT id FROM equipment_types WHERE name = 'bag'), 'thinktank', 'Airport Security', 'Rolling camera case', 3);

-- Add Flash Equipment Models
INSERT INTO equipment_predefined_models (equipment_type_id, brand, model, description, sort_order) VALUES
-- Flashes
((SELECT id FROM equipment_types WHERE name = 'flash'), 'canon', 'Speedlite 600EX II-RT', 'Professional flash unit', 1),
((SELECT id FROM equipment_types WHERE name = 'flash'), 'sony', 'HVL-F60RM', 'Wireless flash unit', 2),
((SELECT id FROM equipment_types WHERE name = 'flash'), 'nikon', 'SB-5000', 'Professional flash unit', 3),
((SELECT id FROM equipment_types WHERE name = 'flash'), 'godox', 'V1', 'Round head flash', 4);

-- Add Light Stand Models
INSERT INTO equipment_predefined_models (equipment_type_id, brand, model, description, sort_order) VALUES
-- Light Stands
((SELECT id FROM equipment_types WHERE name = 'light_stand'), 'manfrotto', '1005BAC', 'Heavy-duty light stand', 1),
((SELECT id FROM equipment_types WHERE name = 'light_stand'), 'impact', 'Light Stand', 'Professional light stand', 2),
((SELECT id FROM equipment_types WHERE name = 'light_stand'), 'avenger', 'A2031B', 'Heavy-duty c-stand', 3);

-- Add more Lighting Equipment Models
INSERT INTO equipment_predefined_models (equipment_type_id, brand, model, description, sort_order) VALUES
-- Continuous Lights
((SELECT id FROM equipment_types WHERE name = 'continuous_light'), 'arri', 'SkyPanel S30', 'Professional LED panel', 1),
((SELECT id FROM equipment_types WHERE name = 'continuous_light'), 'aperture', 'MC Pro', 'RGBWW LED panel', 2),
((SELECT id FROM equipment_types WHERE name = 'continuous_light'), 'godox', 'SL-60W', 'LED video light', 3),

-- Strobe Lights
((SELECT id FROM equipment_types WHERE name = 'strobe_light'), 'profoto', 'A1X', 'Compact studio strobe', 1),
((SELECT id FROM equipment_types WHERE name = 'strobe_light'), 'broncolor', 'Siros L', 'Battery-powered strobe', 2),
((SELECT id FROM equipment_types WHERE name = 'strobe_light'), 'elinchrom', 'ELM8', 'Compact studio strobe', 3);

-- Update equipment_brands table with new brands
INSERT INTO equipment_brands (name, display_name, sort_order) VALUES
('rode', 'Rode', 20),
('shure', 'Shure', 21),
('audio-technica', 'Audio-Technica', 22),
('sennheiser', 'Sennheiser', 23),
('bose', 'Bose', 24),
('zoom', 'Zoom', 25),
('tascam', 'Tascam', 26),
('roland', 'Roland', 27),
('jbl', 'JBL', 28),
('panasonic', 'Panasonic', 29),
('blackmagic', 'Blackmagic Design', 30),
('red', 'RED', 31),
('dji', 'DJI', 32),
('zhiyun', 'Zhiyun', 33),
('moza', 'Moza', 34),
('atomos', 'Atomos', 35),
('smallhd', 'SmallHD', 36),
('feelworld', 'Feelworld', 37),
('manfrotto', 'Manfrotto', 38),
('gitzo', 'Gitzo', 39),
('peak design', 'Peak Design', 40),
('lexar', 'Lexar', 41),
('prograde', 'ProGrade Digital', 42),
('anker', 'Anker', 43),
('hoya', 'Hoya', 44),
('tiffen', 'Tiffen', 45),
('lee', 'Lee Filters', 46),
('lowepro', 'Lowepro', 47),
('thinktank', 'Think Tank Photo', 48),
('godox', 'Godox', 49),
('arri', 'ARRI', 50),
('aperture', 'Aputure', 51),
('profoto', 'Profoto', 52),
('broncolor', 'Broncolor', 53),
('elinchrom', 'Elinchrom', 54),
('impact', 'Impact', 55),
('avenger', 'Avenger', 56),
('seamless', 'Seamless', 57),
('muslin', 'Muslin', 58),
('vinyl', 'Vinyl', 59),
('vintage', 'Vintage', 60),
('modern', 'Modern', 61),
('decorative', 'Decorative', 62),
('equipment', 'Equipment', 63),
('dell', 'Dell', 64),
('hp', 'HP', 65),
('samsung', 'Samsung', 66),
('sandisk', 'SanDisk', 67),
('seagate', 'Seagate', 68),
('wacom', 'Wacom', 69),
('huion', 'Huion', 70)
ON CONFLICT (name) DO NOTHING;

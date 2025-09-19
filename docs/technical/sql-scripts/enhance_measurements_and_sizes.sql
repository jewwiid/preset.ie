-- Enhanced Measurements and Sizes System
-- This migration adds structured tables for better data organization

-- 1. Create predefined clothing size systems
CREATE TABLE IF NOT EXISTS predefined_clothing_size_systems (
  id SERIAL PRIMARY KEY,
  system_name VARCHAR(50) NOT NULL UNIQUE,
  system_type VARCHAR(20) NOT NULL CHECK (system_type IN ('letter', 'number', 'mixed')),
  region VARCHAR(20) NOT NULL CHECK (region IN ('US', 'EU', 'UK', 'AU', 'JP', 'KR', 'CN')),
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create predefined clothing sizes
CREATE TABLE IF NOT EXISTS predefined_clothing_sizes (
  id SERIAL PRIMARY KEY,
  size_system_id INTEGER REFERENCES predefined_clothing_size_systems(id) ON DELETE CASCADE,
  size_value VARCHAR(20) NOT NULL,
  size_label VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(size_system_id, size_value)
);

-- 3. Create predefined shoe size systems
CREATE TABLE IF NOT EXISTS predefined_shoe_size_systems (
  id SERIAL PRIMARY KEY,
  system_name VARCHAR(50) NOT NULL UNIQUE,
  region VARCHAR(20) NOT NULL CHECK (region IN ('US', 'EU', 'UK', 'AU', 'JP', 'KR', 'CN')),
  gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'unisex')),
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create predefined shoe sizes
CREATE TABLE IF NOT EXISTS predefined_shoe_sizes (
  id SERIAL PRIMARY KEY,
  size_system_id INTEGER REFERENCES predefined_shoe_size_systems(id) ON DELETE CASCADE,
  size_value VARCHAR(10) NOT NULL,
  size_label VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(size_system_id, size_value)
);

-- 5. Create user measurements table
CREATE TABLE IF NOT EXISTS user_measurements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
  measurement_type VARCHAR(50) NOT NULL CHECK (measurement_type IN ('bust', 'waist', 'hips', 'chest', 'inseam', 'sleeve', 'neck', 'custom')),
  measurement_value DECIMAL(8,2) NOT NULL,
  unit VARCHAR(10) NOT NULL DEFAULT 'cm' CHECK (unit IN ('cm', 'in', 'mm')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, measurement_type)
);

-- 6. Create user clothing sizes table
CREATE TABLE IF NOT EXISTS user_clothing_sizes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
  clothing_type VARCHAR(50) NOT NULL CHECK (clothing_type IN ('tops', 'bottoms', 'dresses', 'jackets', 'shoes', 'accessories', 'underwear', 'swimwear', 'custom')),
  size_system_id INTEGER REFERENCES predefined_clothing_size_systems(id),
  size_value VARCHAR(20) NOT NULL,
  custom_size_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, clothing_type, size_system_id)
);

-- 7. Create user shoe sizes table
CREATE TABLE IF NOT EXISTS user_shoe_sizes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
  size_system_id INTEGER REFERENCES predefined_shoe_size_systems(id),
  size_value VARCHAR(10) NOT NULL,
  custom_size_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, size_system_id)
);

-- Insert predefined clothing size systems
INSERT INTO predefined_clothing_size_systems (system_name, system_type, region, sort_order) VALUES
('US Letter Sizes', 'letter', 'US', 1),
('EU Letter Sizes', 'letter', 'EU', 2),
('UK Letter Sizes', 'letter', 'UK', 3),
('US Number Sizes', 'number', 'US', 4),
('EU Number Sizes', 'number', 'EU', 5),
('UK Number Sizes', 'number', 'UK', 6),
('Asian Sizes', 'mixed', 'JP', 7),
('Custom', 'mixed', 'US', 8)
ON CONFLICT (system_name) DO NOTHING;

-- Insert predefined clothing sizes for US Letter
INSERT INTO predefined_clothing_sizes (size_system_id, size_value, size_label, sort_order) VALUES
((SELECT id FROM predefined_clothing_size_systems WHERE system_name = 'US Letter Sizes'), 'XXS', 'Extra Extra Small', 1),
((SELECT id FROM predefined_clothing_size_systems WHERE system_name = 'US Letter Sizes'), 'XS', 'Extra Small', 2),
((SELECT id FROM predefined_clothing_size_systems WHERE system_name = 'US Letter Sizes'), 'S', 'Small', 3),
((SELECT id FROM predefined_clothing_size_systems WHERE system_name = 'US Letter Sizes'), 'M', 'Medium', 4),
((SELECT id FROM predefined_clothing_size_systems WHERE system_name = 'US Letter Sizes'), 'L', 'Large', 5),
((SELECT id FROM predefined_clothing_size_systems WHERE system_name = 'US Letter Sizes'), 'XL', 'Extra Large', 6),
((SELECT id FROM predefined_clothing_size_systems WHERE system_name = 'US Letter Sizes'), 'XXL', 'Extra Extra Large', 7),
((SELECT id FROM predefined_clothing_size_systems WHERE system_name = 'US Letter Sizes'), 'XXXL', 'Triple Extra Large', 8)
ON CONFLICT (size_system_id, size_value) DO NOTHING;

-- Insert predefined clothing sizes for US Number
INSERT INTO predefined_clothing_sizes (size_system_id, size_value, size_label, sort_order) VALUES
((SELECT id FROM predefined_clothing_size_systems WHERE system_name = 'US Number Sizes'), '0', 'Size 0', 1),
((SELECT id FROM predefined_clothing_size_systems WHERE system_name = 'US Number Sizes'), '2', 'Size 2', 2),
((SELECT id FROM predefined_clothing_size_systems WHERE system_name = 'US Number Sizes'), '4', 'Size 4', 3),
((SELECT id FROM predefined_clothing_size_systems WHERE system_name = 'US Number Sizes'), '6', 'Size 6', 4),
((SELECT id FROM predefined_clothing_size_systems WHERE system_name = 'US Number Sizes'), '8', 'Size 8', 5),
((SELECT id FROM predefined_clothing_size_systems WHERE system_name = 'US Number Sizes'), '10', 'Size 10', 6),
((SELECT id FROM predefined_clothing_size_systems WHERE system_name = 'US Number Sizes'), '12', 'Size 12', 7),
((SELECT id FROM predefined_clothing_size_systems WHERE system_name = 'US Number Sizes'), '14', 'Size 14', 8),
((SELECT id FROM predefined_clothing_size_systems WHERE system_name = 'US Number Sizes'), '16', 'Size 16', 9),
((SELECT id FROM predefined_clothing_size_systems WHERE system_name = 'US Number Sizes'), '18', 'Size 18', 10),
((SELECT id FROM predefined_clothing_size_systems WHERE system_name = 'US Number Sizes'), '20', 'Size 20', 11)
ON CONFLICT (size_system_id, size_value) DO NOTHING;

-- Insert predefined shoe size systems
INSERT INTO predefined_shoe_size_systems (system_name, region, gender, sort_order) VALUES
('US Men', 'US', 'male', 1),
('US Women', 'US', 'female', 2),
('EU Unisex', 'EU', 'unisex', 3),
('UK Unisex', 'UK', 'unisex', 4),
('Custom', 'US', 'unisex', 5)
ON CONFLICT (system_name) DO NOTHING;

-- Insert predefined shoe sizes for US Men
INSERT INTO predefined_shoe_sizes (size_system_id, size_value, sort_order) VALUES
((SELECT id FROM predefined_shoe_size_systems WHERE system_name = 'US Men'), '6', 1),
((SELECT id FROM predefined_shoe_size_systems WHERE system_name = 'US Men'), '6.5', 2),
((SELECT id FROM predefined_shoe_size_systems WHERE system_name = 'US Men'), '7', 3),
((SELECT id FROM predefined_shoe_size_systems WHERE system_name = 'US Men'), '7.5', 4),
((SELECT id FROM predefined_shoe_size_systems WHERE system_name = 'US Men'), '8', 5),
((SELECT id FROM predefined_shoe_size_systems WHERE system_name = 'US Men'), '8.5', 6),
((SELECT id FROM predefined_shoe_size_systems WHERE system_name = 'US Men'), '9', 7),
((SELECT id FROM predefined_shoe_size_systems WHERE system_name = 'US Men'), '9.5', 8),
((SELECT id FROM predefined_shoe_size_systems WHERE system_name = 'US Men'), '10', 9),
((SELECT id FROM predefined_shoe_size_systems WHERE system_name = 'US Men'), '10.5', 10),
((SELECT id FROM predefined_shoe_size_systems WHERE system_name = 'US Men'), '11', 11),
((SELECT id FROM predefined_shoe_size_systems WHERE system_name = 'US Men'), '11.5', 12),
((SELECT id FROM predefined_shoe_size_systems WHERE system_name = 'US Men'), '12', 13),
((SELECT id FROM predefined_shoe_size_systems WHERE system_name = 'US Men'), '13', 14),
((SELECT id FROM predefined_shoe_size_systems WHERE system_name = 'US Men'), '14', 15)
ON CONFLICT (size_system_id, size_value) DO NOTHING;

-- Insert predefined shoe sizes for US Women
INSERT INTO predefined_shoe_sizes (size_system_id, size_value, sort_order) VALUES
((SELECT id FROM predefined_shoe_size_systems WHERE system_name = 'US Women'), '5', 1),
((SELECT id FROM predefined_shoe_size_systems WHERE system_name = 'US Women'), '5.5', 2),
((SELECT id FROM predefined_shoe_size_systems WHERE system_name = 'US Women'), '6', 3),
((SELECT id FROM predefined_shoe_size_systems WHERE system_name = 'US Women'), '6.5', 4),
((SELECT id FROM predefined_shoe_size_systems WHERE system_name = 'US Women'), '7', 5),
((SELECT id FROM predefined_shoe_size_systems WHERE system_name = 'US Women'), '7.5', 6),
((SELECT id FROM predefined_shoe_size_systems WHERE system_name = 'US Women'), '8', 7),
((SELECT id FROM predefined_shoe_size_systems WHERE system_name = 'US Women'), '8.5', 8),
((SELECT id FROM predefined_shoe_size_systems WHERE system_name = 'US Women'), '9', 9),
((SELECT id FROM predefined_shoe_size_systems WHERE system_name = 'US Women'), '9.5', 10),
((SELECT id FROM predefined_shoe_size_systems WHERE system_name = 'US Women'), '10', 11),
((SELECT id FROM predefined_shoe_size_systems WHERE system_name = 'US Women'), '10.5', 12),
((SELECT id FROM predefined_shoe_size_systems WHERE system_name = 'US Women'), '11', 13),
((SELECT id FROM predefined_shoe_size_systems WHERE system_name = 'US Women'), '11.5', 14),
((SELECT id FROM predefined_shoe_size_systems WHERE system_name = 'US Women'), '12', 15)
ON CONFLICT (size_system_id, size_value) DO NOTHING;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_measurements_user_id ON user_measurements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_measurements_type ON user_measurements(measurement_type);
CREATE INDEX IF NOT EXISTS idx_user_clothing_sizes_user_id ON user_clothing_sizes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_clothing_sizes_type ON user_clothing_sizes(clothing_type);
CREATE INDEX IF NOT EXISTS idx_user_shoe_sizes_user_id ON user_shoe_sizes(user_id);

-- Add triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_measurements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_user_measurements_updated_at ON user_measurements;
CREATE TRIGGER trigger_update_user_measurements_updated_at
  BEFORE UPDATE ON user_measurements
  FOR EACH ROW
  EXECUTE FUNCTION update_measurements_updated_at();

DROP TRIGGER IF EXISTS trigger_update_user_clothing_sizes_updated_at ON user_clothing_sizes;
CREATE TRIGGER trigger_update_user_clothing_sizes_updated_at
  BEFORE UPDATE ON user_clothing_sizes
  FOR EACH ROW
  EXECUTE FUNCTION update_measurements_updated_at();

DROP TRIGGER IF EXISTS trigger_update_user_shoe_sizes_updated_at ON user_shoe_sizes;
CREATE TRIGGER trigger_update_user_shoe_sizes_updated_at
  BEFORE UPDATE ON user_shoe_sizes
  FOR EACH ROW
  EXECUTE FUNCTION update_measurements_updated_at();

-- Add comments for documentation
COMMENT ON TABLE user_measurements IS 'Structured body measurements for talent profiles';
COMMENT ON TABLE user_clothing_sizes IS 'Structured clothing sizes for different clothing types';
COMMENT ON TABLE user_shoe_sizes IS 'Structured shoe sizes for different size systems';
COMMENT ON TABLE predefined_clothing_size_systems IS 'Available clothing size systems (US, EU, UK, etc.)';
COMMENT ON TABLE predefined_shoe_size_systems IS 'Available shoe size systems by region and gender';

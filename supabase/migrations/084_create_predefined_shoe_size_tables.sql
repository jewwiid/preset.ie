-- Create predefined shoe size tables
-- This migration creates the missing predefined shoe size tables that the UI expects

-- 1. Create predefined shoe size systems table
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

-- 2. Create predefined shoe sizes table
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

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_predefined_shoe_size_systems_active ON predefined_shoe_size_systems(is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_predefined_shoe_size_systems_region ON predefined_shoe_size_systems(region);
CREATE INDEX IF NOT EXISTS idx_predefined_shoe_sizes_system_id ON predefined_shoe_sizes(size_system_id);
CREATE INDEX IF NOT EXISTS idx_predefined_shoe_sizes_active ON predefined_shoe_sizes(is_active, sort_order);

-- 4. Insert predefined shoe size systems
INSERT INTO predefined_shoe_size_systems (system_name, region, gender, sort_order) VALUES
('US Men', 'US', 'male', 1),
('US Women', 'US', 'female', 2),
('EU Unisex', 'EU', 'unisex', 3),
('UK Unisex', 'UK', 'unisex', 4),
('AU Unisex', 'AU', 'unisex', 5),
('JP Unisex', 'JP', 'unisex', 6)
ON CONFLICT (system_name) DO NOTHING;

-- 5. Insert predefined shoe sizes for US Men
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
((SELECT id FROM predefined_shoe_size_systems WHERE system_name = 'US Men'), '12.5', 14),
((SELECT id FROM predefined_shoe_size_systems WHERE system_name = 'US Men'), '13', 15),
((SELECT id FROM predefined_shoe_size_systems WHERE system_name = 'US Men'), '13.5', 16),
((SELECT id FROM predefined_shoe_size_systems WHERE system_name = 'US Men'), '14', 17),
((SELECT id FROM predefined_shoe_size_systems WHERE system_name = 'US Men'), '15', 18)
ON CONFLICT (size_system_id, size_value) DO NOTHING;

-- 6. Insert predefined shoe sizes for US Women
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

-- 7. Insert predefined shoe sizes for EU Unisex
INSERT INTO predefined_shoe_sizes (size_system_id, size_value, sort_order) VALUES
((SELECT id FROM predefined_shoe_size_systems WHERE system_name = 'EU Unisex'), '36', 1),
((SELECT id FROM predefined_shoe_size_systems WHERE system_name = 'EU Unisex'), '36.5', 2),
((SELECT id FROM predefined_shoe_size_systems WHERE system_name = 'EU Unisex'), '37', 3),
((SELECT id FROM predefined_shoe_size_systems WHERE system_name = 'EU Unisex'), '37.5', 4),
((SELECT id FROM predefined_shoe_size_systems WHERE system_name = 'EU Unisex'), '38', 5),
((SELECT id FROM predefined_shoe_size_systems WHERE system_name = 'EU Unisex'), '38.5', 6),
((SELECT id FROM predefined_shoe_size_systems WHERE system_name = 'EU Unisex'), '39', 7),
((SELECT id FROM predefined_shoe_size_systems WHERE system_name = 'EU Unisex'), '39.5', 8),
((SELECT id FROM predefined_shoe_size_systems WHERE system_name = 'EU Unisex'), '40', 9),
((SELECT id FROM predefined_shoe_size_systems WHERE system_name = 'EU Unisex'), '40.5', 10),
((SELECT id FROM predefined_shoe_size_systems WHERE system_name = 'EU Unisex'), '41', 11),
((SELECT id FROM predefined_shoe_size_systems WHERE system_name = 'EU Unisex'), '41.5', 12),
((SELECT id FROM predefined_shoe_size_systems WHERE system_name = 'EU Unisex'), '42', 13),
((SELECT id FROM predefined_shoe_size_systems WHERE system_name = 'EU Unisex'), '42.5', 14),
((SELECT id FROM predefined_shoe_size_systems WHERE system_name = 'EU Unisex'), '43', 15),
((SELECT id FROM predefined_shoe_size_systems WHERE system_name = 'EU Unisex'), '43.5', 16),
((SELECT id FROM predefined_shoe_size_systems WHERE system_name = 'EU Unisex'), '44', 17),
((SELECT id FROM predefined_shoe_size_systems WHERE system_name = 'EU Unisex'), '44.5', 18),
((SELECT id FROM predefined_shoe_size_systems WHERE system_name = 'EU Unisex'), '45', 19),
((SELECT id FROM predefined_shoe_size_systems WHERE system_name = 'EU Unisex'), '45.5', 20),
((SELECT id FROM predefined_shoe_size_systems WHERE system_name = 'EU Unisex'), '46', 21)
ON CONFLICT (size_system_id, size_value) DO NOTHING;

-- 8. Insert predefined shoe sizes for UK Unisex
INSERT INTO predefined_shoe_sizes (size_system_id, size_value, sort_order) VALUES
((SELECT id FROM predefined_shoe_size_systems WHERE system_name = 'UK Unisex'), '3', 1),
((SELECT id FROM predefined_shoe_size_systems WHERE system_name = 'UK Unisex'), '3.5', 2),
((SELECT id FROM predefined_shoe_size_systems WHERE system_name = 'UK Unisex'), '4', 3),
((SELECT id FROM predefined_shoe_size_systems WHERE system_name = 'UK Unisex'), '4.5', 4),
((SELECT id FROM predefined_shoe_size_systems WHERE system_name = 'UK Unisex'), '5', 5),
((SELECT id FROM predefined_shoe_size_systems WHERE system_name = 'UK Unisex'), '5.5', 6),
((SELECT id FROM predefined_shoe_size_systems WHERE system_name = 'UK Unisex'), '6', 7),
((SELECT id FROM predefined_shoe_size_systems WHERE system_name = 'UK Unisex'), '6.5', 8),
((SELECT id FROM predefined_shoe_size_systems WHERE system_name = 'UK Unisex'), '7', 9),
((SELECT id FROM predefined_shoe_size_systems WHERE system_name = 'UK Unisex'), '7.5', 10),
((SELECT id FROM predefined_shoe_size_systems WHERE system_name = 'UK Unisex'), '8', 11),
((SELECT id FROM predefined_shoe_size_systems WHERE system_name = 'UK Unisex'), '8.5', 12),
((SELECT id FROM predefined_shoe_size_systems WHERE system_name = 'UK Unisex'), '9', 13),
((SELECT id FROM predefined_shoe_size_systems WHERE system_name = 'UK Unisex'), '9.5', 14),
((SELECT id FROM predefined_shoe_size_systems WHERE system_name = 'UK Unisex'), '10', 15),
((SELECT id FROM predefined_shoe_size_systems WHERE system_name = 'UK Unisex'), '10.5', 16),
((SELECT id FROM predefined_shoe_size_systems WHERE system_name = 'UK Unisex'), '11', 17),
((SELECT id FROM predefined_shoe_size_systems WHERE system_name = 'UK Unisex'), '11.5', 18),
((SELECT id FROM predefined_shoe_size_systems WHERE system_name = 'UK Unisex'), '12', 19)
ON CONFLICT (size_system_id, size_value) DO NOTHING;

-- 9. Enable RLS
ALTER TABLE predefined_shoe_size_systems ENABLE ROW LEVEL SECURITY;
ALTER TABLE predefined_shoe_sizes ENABLE ROW LEVEL SECURITY;

-- 10. Create RLS policies (public read access)
CREATE POLICY "Anyone can view predefined shoe size systems" ON predefined_shoe_size_systems
  FOR SELECT USING (true);

CREATE POLICY "Anyone can view predefined shoe sizes" ON predefined_shoe_sizes
  FOR SELECT USING (true);

-- 11. Create update timestamp triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_predefined_shoe_size_systems_updated_at
    BEFORE UPDATE ON predefined_shoe_size_systems
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_predefined_shoe_sizes_updated_at
    BEFORE UPDATE ON predefined_shoe_sizes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 12. Add comments
COMMENT ON TABLE predefined_shoe_size_systems IS 'Predefined shoe size systems (US Men, US Women, EU, UK, etc.)';
COMMENT ON TABLE predefined_shoe_sizes IS 'Predefined shoe sizes for each system';
COMMENT ON COLUMN predefined_shoe_size_systems.system_name IS 'Name of the size system (e.g., "US Men", "EU Unisex")';
COMMENT ON COLUMN predefined_shoe_size_systems.region IS 'Geographic region for the size system';
COMMENT ON COLUMN predefined_shoe_size_systems.gender IS 'Gender specificity of the size system';
COMMENT ON COLUMN predefined_shoe_sizes.size_value IS 'The actual size value (e.g., "8", "42", "9.5")';
COMMENT ON COLUMN predefined_shoe_sizes.size_label IS 'Optional label for the size (e.g., "Small", "Large")';

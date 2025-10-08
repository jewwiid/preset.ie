-- Comprehensive Clothing and Shoe Sizing System Migration
-- Creates all tables needed for clothing sizes, body measurements, and shoe sizes
-- with proper UK, US, EU sizing standards

-- ============================================
-- PART 1: CLOTHING SIZE SYSTEM TABLES
-- ============================================

-- 1. Create predefined clothing size systems table
CREATE TABLE IF NOT EXISTS predefined_clothing_size_systems (
    id SERIAL PRIMARY KEY,
    system_name VARCHAR(50) NOT NULL,
    system_type VARCHAR(20) NOT NULL CHECK (system_type IN ('numeric', 'alpha', 'mixed')),
    region VARCHAR(20) NOT NULL CHECK (region IN ('US', 'EU', 'UK', 'AU', 'JP', 'International')),
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'unisex')),
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(system_name, region, gender)
);

-- 2. Create predefined clothing sizes table
CREATE TABLE IF NOT EXISTS predefined_clothing_sizes (
    id SERIAL PRIMARY KEY,
    size_system_id INTEGER REFERENCES predefined_clothing_size_systems(id) ON DELETE CASCADE,
    size_value VARCHAR(10) NOT NULL,
    size_label VARCHAR(30),
    numeric_equivalent INTEGER,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(size_system_id, size_value)
);

-- 3. Create user clothing sizes table
CREATE TABLE IF NOT EXISTS user_clothing_sizes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
    clothing_type VARCHAR(50) NOT NULL CHECK (clothing_type IN (
        'tops', 'bottoms', 'dresses', 'outerwear', 'underwear',
        'swimwear', 'accessories'
    )),
    size_system_id INTEGER NOT NULL REFERENCES predefined_clothing_size_systems(id) ON DELETE CASCADE,
    size_value VARCHAR(20) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(profile_id, clothing_type, size_system_id)
);

-- 4. Create user measurements table
CREATE TABLE IF NOT EXISTS user_measurements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
    measurement_type VARCHAR(50) NOT NULL CHECK (measurement_type IN (
        'chest', 'waist', 'hips', 'inseam', 'sleeve',
        'neck', 'shoulder', 'bust', 'underbust'
    )),
    measurement_value DECIMAL(5,2) NOT NULL,
    unit VARCHAR(10) NOT NULL DEFAULT 'in' CHECK (unit IN ('cm', 'in')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(profile_id, measurement_type)
);

-- ============================================
-- PART 2: SHOE SIZE SYSTEM TABLES
-- ============================================

-- 5. Create predefined shoe size systems table
CREATE TABLE IF NOT EXISTS predefined_shoe_size_systems (
    id SERIAL PRIMARY KEY,
    system_name VARCHAR(50) NOT NULL UNIQUE,
    region VARCHAR(20) NOT NULL CHECK (region IN ('US', 'EU', 'UK', 'AU', 'JP')),
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'unisex')),
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create predefined shoe sizes table
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

-- ============================================
-- PART 3: INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_predefined_clothing_size_systems_region ON predefined_clothing_size_systems(region, gender);
CREATE INDEX IF NOT EXISTS idx_predefined_clothing_size_systems_active ON predefined_clothing_size_systems(is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_predefined_clothing_sizes_system ON predefined_clothing_sizes(size_system_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_user_clothing_sizes_profile ON user_clothing_sizes(profile_id);
CREATE INDEX IF NOT EXISTS idx_user_measurements_profile ON user_measurements(profile_id);
CREATE INDEX IF NOT EXISTS idx_predefined_shoe_size_systems_region ON predefined_shoe_size_systems(region, gender);
CREATE INDEX IF NOT EXISTS idx_predefined_shoe_sizes_system ON predefined_shoe_sizes(size_system_id, sort_order);

-- ============================================
-- PART 4: INSERT CLOTHING SIZE SYSTEMS
-- ============================================

-- US Women's Alpha Sizes (XS-XXL)
INSERT INTO predefined_clothing_size_systems (system_name, system_type, region, gender, sort_order) VALUES
('US Women Alpha', 'alpha', 'US', 'female', 1),
('US Women Numeric', 'numeric', 'US', 'female', 2),
('US Men Alpha', 'alpha', 'US', 'male', 3),
('US Men Numeric', 'numeric', 'US', 'male', 4),
('UK Women Numeric', 'numeric', 'UK', 'female', 5),
('UK Men Numeric', 'numeric', 'UK', 'male', 6),
('EU Women Numeric', 'numeric', 'EU', 'female', 7),
('EU Men Numeric', 'numeric', 'EU', 'male', 8),
('International Alpha', 'alpha', 'International', 'unisex', 9)
ON CONFLICT (system_name, region, gender) DO NOTHING;

-- ============================================
-- PART 5: INSERT CLOTHING SIZES
-- ============================================

-- US Women's Alpha (XS, S, M, L, XL, XXL)
INSERT INTO predefined_clothing_sizes (size_system_id, size_value, size_label, numeric_equivalent, sort_order)
SELECT id, 'XXS', 'Extra Extra Small', 0, 1 FROM predefined_clothing_size_systems WHERE system_name = 'US Women Alpha'
UNION ALL
SELECT id, 'XS', 'Extra Small', 2, 2 FROM predefined_clothing_size_systems WHERE system_name = 'US Women Alpha'
UNION ALL
SELECT id, 'S', 'Small', 4, 3 FROM predefined_clothing_size_systems WHERE system_name = 'US Women Alpha'
UNION ALL
SELECT id, 'M', 'Medium', 6, 4 FROM predefined_clothing_size_systems WHERE system_name = 'US Women Alpha'
UNION ALL
SELECT id, 'L', 'Large', 10, 5 FROM predefined_clothing_size_systems WHERE system_name = 'US Women Alpha'
UNION ALL
SELECT id, 'XL', 'Extra Large', 14, 6 FROM predefined_clothing_size_systems WHERE system_name = 'US Women Alpha'
UNION ALL
SELECT id, 'XXL', 'Extra Extra Large', 18, 7 FROM predefined_clothing_size_systems WHERE system_name = 'US Women Alpha'
ON CONFLICT (size_system_id, size_value) DO NOTHING;

-- US Women's Numeric (0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20)
INSERT INTO predefined_clothing_sizes (size_system_id, size_value, sort_order)
SELECT id, size_val::text, row_num
FROM predefined_clothing_size_systems
CROSS JOIN (
    SELECT generate_series(0, 20, 2) AS size_val,
           row_number() OVER (ORDER BY generate_series(0, 20, 2)) AS row_num
) sizes
WHERE system_name = 'US Women Numeric'
ON CONFLICT (size_system_id, size_value) DO NOTHING;

-- US Men's Alpha (XS, S, M, L, XL, XXL, XXXL)
INSERT INTO predefined_clothing_sizes (size_system_id, size_value, size_label, sort_order)
SELECT id, 'XS', 'Extra Small', 1 FROM predefined_clothing_size_systems WHERE system_name = 'US Men Alpha'
UNION ALL
SELECT id, 'S', 'Small', 2 FROM predefined_clothing_size_systems WHERE system_name = 'US Men Alpha'
UNION ALL
SELECT id, 'M', 'Medium', 3 FROM predefined_clothing_size_systems WHERE system_name = 'US Men Alpha'
UNION ALL
SELECT id, 'L', 'Large', 4 FROM predefined_clothing_size_systems WHERE system_name = 'US Men Alpha'
UNION ALL
SELECT id, 'XL', 'Extra Large', 5 FROM predefined_clothing_size_systems WHERE system_name = 'US Men Alpha'
UNION ALL
SELECT id, 'XXL', 'Extra Extra Large', 6 FROM predefined_clothing_size_systems WHERE system_name = 'US Men Alpha'
UNION ALL
SELECT id, 'XXXL', 'Triple Extra Large', 7 FROM predefined_clothing_size_systems WHERE system_name = 'US Men Alpha'
ON CONFLICT (size_system_id, size_value) DO NOTHING;

-- US Men's Numeric (34-52 for pants/shirts)
INSERT INTO predefined_clothing_sizes (size_system_id, size_value, sort_order)
SELECT id, size_val::text, row_num
FROM predefined_clothing_size_systems
CROSS JOIN (
    SELECT generate_series(32, 52, 2) AS size_val,
           row_number() OVER (ORDER BY generate_series(32, 52, 2)) AS row_num
) sizes
WHERE system_name = 'US Men Numeric'
ON CONFLICT (size_system_id, size_value) DO NOTHING;

-- UK Women's Numeric (4-24)
INSERT INTO predefined_clothing_sizes (size_system_id, size_value, sort_order)
SELECT id, size_val::text, row_num
FROM predefined_clothing_size_systems
CROSS JOIN (
    SELECT generate_series(4, 24, 2) AS size_val,
           row_number() OVER (ORDER BY generate_series(4, 24, 2)) AS row_num
) sizes
WHERE system_name = 'UK Women Numeric'
ON CONFLICT (size_system_id, size_value) DO NOTHING;

-- UK Men's Numeric (32-52)
INSERT INTO predefined_clothing_sizes (size_system_id, size_value, sort_order)
SELECT id, size_val::text, row_num
FROM predefined_clothing_size_systems
CROSS JOIN (
    SELECT generate_series(32, 52, 2) AS size_val,
           row_number() OVER (ORDER BY generate_series(32, 52, 2)) AS row_num
) sizes
WHERE system_name = 'UK Men Numeric'
ON CONFLICT (size_system_id, size_value) DO NOTHING;

-- EU Women's Numeric (32-52)
INSERT INTO predefined_clothing_sizes (size_system_id, size_value, sort_order)
SELECT id, size_val::text, row_num
FROM predefined_clothing_size_systems
CROSS JOIN (
    SELECT generate_series(32, 52, 2) AS size_val,
           row_number() OVER (ORDER BY generate_series(32, 52, 2)) AS row_num
) sizes
WHERE system_name = 'EU Women Numeric'
ON CONFLICT (size_system_id, size_value) DO NOTHING;

-- EU Men's Numeric (42-62)
INSERT INTO predefined_clothing_sizes (size_system_id, size_value, sort_order)
SELECT id, size_val::text, row_num
FROM predefined_clothing_size_systems
CROSS JOIN (
    SELECT generate_series(42, 62, 2) AS size_val,
           row_number() OVER (ORDER BY generate_series(42, 62, 2)) AS row_num
) sizes
WHERE system_name = 'EU Men Numeric'
ON CONFLICT (size_system_id, size_value) DO NOTHING;

-- International Alpha (XS-XXL unisex)
INSERT INTO predefined_clothing_sizes (size_system_id, size_value, size_label, sort_order)
SELECT id, 'XS', 'Extra Small', 1 FROM predefined_clothing_size_systems WHERE system_name = 'International Alpha'
UNION ALL
SELECT id, 'S', 'Small', 2 FROM predefined_clothing_size_systems WHERE system_name = 'International Alpha'
UNION ALL
SELECT id, 'M', 'Medium', 3 FROM predefined_clothing_size_systems WHERE system_name = 'International Alpha'
UNION ALL
SELECT id, 'L', 'Large', 4 FROM predefined_clothing_size_systems WHERE system_name = 'International Alpha'
UNION ALL
SELECT id, 'XL', 'Extra Large', 5 FROM predefined_clothing_size_systems WHERE system_name = 'International Alpha'
UNION ALL
SELECT id, 'XXL', 'Extra Extra Large', 6 FROM predefined_clothing_size_systems WHERE system_name = 'International Alpha'
ON CONFLICT (size_system_id, size_value) DO NOTHING;

-- ============================================
-- PART 6: INSERT SHOE SIZE SYSTEMS & SIZES
-- ============================================

-- Insert shoe size systems
INSERT INTO predefined_shoe_size_systems (system_name, region, gender, sort_order) VALUES
('US Men', 'US', 'male', 1),
('US Women', 'US', 'female', 2),
('EU Unisex', 'EU', 'unisex', 3),
('UK Unisex', 'UK', 'unisex', 4)
ON CONFLICT (system_name) DO NOTHING;

-- US Men's Shoe Sizes (6-15)
INSERT INTO predefined_shoe_sizes (size_system_id, size_value, sort_order)
SELECT
    (SELECT id FROM predefined_shoe_size_systems WHERE system_name = 'US Men'),
    size_val::text,
    row_number() OVER (ORDER BY size_val)
FROM generate_series(6.0, 15.0, 0.5) AS size_val
ON CONFLICT (size_system_id, size_value) DO NOTHING;

-- US Women's Shoe Sizes (5-12)
INSERT INTO predefined_shoe_sizes (size_system_id, size_value, sort_order)
SELECT
    (SELECT id FROM predefined_shoe_size_systems WHERE system_name = 'US Women'),
    size_val::text,
    row_number() OVER (ORDER BY size_val)
FROM generate_series(5.0, 12.0, 0.5) AS size_val
ON CONFLICT (size_system_id, size_value) DO NOTHING;

-- EU Unisex Shoe Sizes (36-46)
INSERT INTO predefined_shoe_sizes (size_system_id, size_value, sort_order)
SELECT
    (SELECT id FROM predefined_shoe_size_systems WHERE system_name = 'EU Unisex'),
    size_val::text,
    row_number() OVER (ORDER BY size_val)
FROM generate_series(36.0, 48.0, 0.5) AS size_val
ON CONFLICT (size_system_id, size_value) DO NOTHING;

-- UK Unisex Shoe Sizes (3-12)
INSERT INTO predefined_shoe_sizes (size_system_id, size_value, sort_order)
SELECT
    (SELECT id FROM predefined_shoe_size_systems WHERE system_name = 'UK Unisex'),
    size_val::text,
    row_number() OVER (ORDER BY size_val)
FROM generate_series(3.0, 13.0, 0.5) AS size_val
ON CONFLICT (size_system_id, size_value) DO NOTHING;

-- ============================================
-- PART 7: ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE predefined_clothing_size_systems ENABLE ROW LEVEL SECURITY;
ALTER TABLE predefined_clothing_sizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_clothing_sizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE predefined_shoe_size_systems ENABLE ROW LEVEL SECURITY;
ALTER TABLE predefined_shoe_sizes ENABLE ROW LEVEL SECURITY;

-- Public read access to predefined tables
DROP POLICY IF EXISTS "Anyone can view clothing size systems" ON predefined_clothing_size_systems;
CREATE POLICY "Anyone can view clothing size systems" ON predefined_clothing_size_systems FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can view clothing sizes" ON predefined_clothing_sizes;
CREATE POLICY "Anyone can view clothing sizes" ON predefined_clothing_sizes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can view shoe size systems" ON predefined_shoe_size_systems;
CREATE POLICY "Anyone can view shoe size systems" ON predefined_shoe_size_systems FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can view shoe sizes" ON predefined_shoe_sizes;
CREATE POLICY "Anyone can view shoe sizes" ON predefined_shoe_sizes FOR SELECT USING (true);

-- User-specific data policies
DROP POLICY IF EXISTS "Users can view their own clothing sizes" ON user_clothing_sizes;
CREATE POLICY "Users can view their own clothing sizes" ON user_clothing_sizes
FOR SELECT USING (auth.uid() = (SELECT user_id FROM users_profile WHERE id = profile_id));

DROP POLICY IF EXISTS "Users can insert their own clothing sizes" ON user_clothing_sizes;
CREATE POLICY "Users can insert their own clothing sizes" ON user_clothing_sizes
FOR INSERT WITH CHECK (auth.uid() = (SELECT user_id FROM users_profile WHERE id = profile_id));

DROP POLICY IF EXISTS "Users can update their own clothing sizes" ON user_clothing_sizes;
CREATE POLICY "Users can update their own clothing sizes" ON user_clothing_sizes
FOR UPDATE USING (auth.uid() = (SELECT user_id FROM users_profile WHERE id = profile_id));

DROP POLICY IF EXISTS "Users can delete their own clothing sizes" ON user_clothing_sizes;
CREATE POLICY "Users can delete their own clothing sizes" ON user_clothing_sizes
FOR DELETE USING (auth.uid() = (SELECT user_id FROM users_profile WHERE id = profile_id));

DROP POLICY IF EXISTS "Users can view their own measurements" ON user_measurements;
CREATE POLICY "Users can view their own measurements" ON user_measurements
FOR SELECT USING (auth.uid() = (SELECT user_id FROM users_profile WHERE id = profile_id));

DROP POLICY IF EXISTS "Users can insert their own measurements" ON user_measurements;
CREATE POLICY "Users can insert their own measurements" ON user_measurements
FOR INSERT WITH CHECK (auth.uid() = (SELECT user_id FROM users_profile WHERE id = profile_id));

DROP POLICY IF EXISTS "Users can update their own measurements" ON user_measurements;
CREATE POLICY "Users can update their own measurements" ON user_measurements
FOR UPDATE USING (auth.uid() = (SELECT user_id FROM users_profile WHERE id = profile_id));

DROP POLICY IF EXISTS "Users can delete their own measurements" ON user_measurements;
CREATE POLICY "Users can delete their own measurements" ON user_measurements
FOR DELETE USING (auth.uid() = (SELECT user_id FROM users_profile WHERE id = profile_id));

-- ============================================
-- PART 8: TRIGGERS FOR UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_predefined_clothing_size_systems_updated_at ON predefined_clothing_size_systems;
CREATE TRIGGER update_predefined_clothing_size_systems_updated_at
BEFORE UPDATE ON predefined_clothing_size_systems
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_predefined_clothing_sizes_updated_at ON predefined_clothing_sizes;
CREATE TRIGGER update_predefined_clothing_sizes_updated_at
BEFORE UPDATE ON predefined_clothing_sizes
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_clothing_sizes_updated_at ON user_clothing_sizes;
CREATE TRIGGER update_user_clothing_sizes_updated_at
BEFORE UPDATE ON user_clothing_sizes
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_measurements_updated_at ON user_measurements;
CREATE TRIGGER update_user_measurements_updated_at
BEFORE UPDATE ON user_measurements
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_predefined_shoe_size_systems_updated_at ON predefined_shoe_size_systems;
CREATE TRIGGER update_predefined_shoe_size_systems_updated_at
BEFORE UPDATE ON predefined_shoe_size_systems
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_predefined_shoe_sizes_updated_at ON predefined_shoe_sizes;
CREATE TRIGGER update_predefined_shoe_sizes_updated_at
BEFORE UPDATE ON predefined_shoe_sizes
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- PART 9: COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE predefined_clothing_size_systems IS 'Predefined clothing size systems (US, UK, EU) with gender and type information';
COMMENT ON TABLE predefined_clothing_sizes IS 'Predefined clothing sizes for each system (numeric and alpha)';
COMMENT ON TABLE user_clothing_sizes IS 'User-specific clothing sizes for different types and systems';
COMMENT ON TABLE user_measurements IS 'User body measurements (chest, waist, hips, etc.) for custom sizing';
COMMENT ON TABLE predefined_shoe_size_systems IS 'Predefined shoe size systems (US Men, US Women, EU, UK, etc.)';
COMMENT ON TABLE predefined_shoe_sizes IS 'Predefined shoe sizes for each system';

COMMENT ON COLUMN predefined_clothing_size_systems.system_type IS 'Type of sizing: numeric (4,6,8), alpha (XS,S,M,L), or mixed';
COMMENT ON COLUMN predefined_clothing_size_systems.region IS 'Geographic region: US, UK, EU, AU, JP, International';
COMMENT ON COLUMN predefined_clothing_sizes.numeric_equivalent IS 'Numeric equivalent for alpha sizes (e.g., M = 6-8)';
COMMENT ON COLUMN user_clothing_sizes.clothing_type IS 'Type of clothing: tops, bottoms, dresses, outerwear, etc.';
COMMENT ON COLUMN user_measurements.measurement_type IS 'Type of measurement: chest, waist, hips, bust, inseam, etc.';
COMMENT ON COLUMN user_measurements.unit IS 'Unit of measurement: cm (centimeters) or in (inches)';

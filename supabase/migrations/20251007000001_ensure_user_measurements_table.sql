-- Ensure user_measurements table and related tables exist
-- This is a safe, idempotent version focusing only on measurements

-- 1. Ensure user_measurements table exists
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

-- 2. Enable RLS
ALTER TABLE user_measurements ENABLE ROW LEVEL SECURITY;

-- 3. Create indexes
CREATE INDEX IF NOT EXISTS idx_user_measurements_profile ON user_measurements(profile_id);

-- 4. Create RLS policies (drop first for idempotency)
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

-- 5. Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_measurements_updated_at ON user_measurements;
CREATE TRIGGER update_user_measurements_updated_at
BEFORE UPDATE ON user_measurements
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. Add comment
COMMENT ON TABLE user_measurements IS 'User body measurements (chest, waist, hips, etc.) for custom sizing';


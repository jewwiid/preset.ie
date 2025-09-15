-- FIXED VERSION: Rename user_id to profile_id in detail tables for clarity
-- This migration improves schema clarity by making foreign key relationships explicit
-- 
-- ID Architecture:
-- - auth.users.id: Supabase authentication user ID
-- - users_profile.id: Application profile ID (business data)
-- - users_profile.user_id: References auth.users.id (authentication link)
-- - Detail tables: Should reference users_profile.id (business relationships)

-- Step 1: Temporarily drop foreign key constraints to allow data updates
ALTER TABLE user_equipment DROP CONSTRAINT IF EXISTS user_equipment_user_id_fkey;
ALTER TABLE user_clothing_sizes DROP CONSTRAINT IF EXISTS user_clothing_sizes_user_id_fkey;
ALTER TABLE user_measurements DROP CONSTRAINT IF EXISTS user_measurements_user_id_fkey;
ALTER TABLE user_shoe_sizes DROP CONSTRAINT IF EXISTS user_shoe_sizes_user_id_fkey;

-- Step 2: Fix existing data to use correct profile IDs
DO $$
DECLARE
    updated_count INTEGER;
BEGIN
    RAISE NOTICE 'Step 2: Fixing existing data to use correct profile IDs...';
    
    -- Fix user_equipment data (currently uses auth user IDs, should use profile IDs)
    UPDATE user_equipment 
    SET user_id = up.id
    FROM users_profile up
    WHERE user_equipment.user_id = up.user_id;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RAISE NOTICE 'Updated % user_equipment records to use profile IDs', updated_count;
    
    -- Verify all data now uses valid profile IDs
    IF EXISTS (
        SELECT 1 FROM user_equipment ue
        LEFT JOIN users_profile up ON ue.user_id = up.id
        WHERE up.id IS NULL
    ) THEN
        RAISE EXCEPTION 'Some user_equipment records still have invalid user_id references';
    END IF;
    
    RAISE NOTICE 'Data integrity check passed for user_equipment';
END $$;

-- Step 3: Rename user_id to profile_id in all detail tables
ALTER TABLE user_equipment RENAME COLUMN user_id TO profile_id;
ALTER TABLE user_clothing_sizes RENAME COLUMN user_id TO profile_id;
ALTER TABLE user_measurements RENAME COLUMN user_id TO profile_id;
ALTER TABLE user_shoe_sizes RENAME COLUMN user_id TO profile_id;

-- Step 4: Recreate foreign key constraints pointing to users_profile.id (not auth.users.id)
ALTER TABLE user_equipment 
ADD CONSTRAINT user_equipment_profile_id_fkey 
FOREIGN KEY (profile_id) REFERENCES users_profile(id) ON DELETE CASCADE;

ALTER TABLE user_clothing_sizes 
ADD CONSTRAINT user_clothing_sizes_profile_id_fkey 
FOREIGN KEY (profile_id) REFERENCES users_profile(id) ON DELETE CASCADE;

ALTER TABLE user_measurements 
ADD CONSTRAINT user_measurements_profile_id_fkey 
FOREIGN KEY (profile_id) REFERENCES users_profile(id) ON DELETE CASCADE;

ALTER TABLE user_shoe_sizes 
ADD CONSTRAINT user_shoe_sizes_profile_id_fkey 
FOREIGN KEY (profile_id) REFERENCES users_profile(id) ON DELETE CASCADE;

-- Step 5: Update indexes to use new column names
DROP INDEX IF EXISTS idx_user_equipment_user_id;
CREATE INDEX IF NOT EXISTS idx_user_equipment_profile_id ON user_equipment(profile_id);

DROP INDEX IF EXISTS idx_user_clothing_sizes_user_id;
CREATE INDEX IF NOT EXISTS idx_user_clothing_sizes_profile_id ON user_clothing_sizes(profile_id);

DROP INDEX IF EXISTS idx_user_measurements_user_id;
CREATE INDEX IF NOT EXISTS idx_user_measurements_profile_id ON user_measurements(profile_id);

DROP INDEX IF EXISTS idx_user_shoe_sizes_user_id;
CREATE INDEX IF NOT EXISTS idx_user_shoe_sizes_profile_id ON user_shoe_sizes(profile_id);

-- Step 6: Update unique constraints to use new column names
ALTER TABLE user_measurements 
DROP CONSTRAINT IF EXISTS user_measurements_user_id_measurement_type_key;

ALTER TABLE user_measurements 
ADD CONSTRAINT user_measurements_profile_id_measurement_type_key 
UNIQUE (profile_id, measurement_type);

ALTER TABLE user_clothing_sizes 
DROP CONSTRAINT IF EXISTS user_clothing_sizes_user_id_clothing_type_size_system_id_key;

ALTER TABLE user_clothing_sizes 
ADD CONSTRAINT user_clothing_sizes_profile_id_clothing_type_size_system_id_key 
UNIQUE (profile_id, clothing_type, size_system_id);

ALTER TABLE user_shoe_sizes 
DROP CONSTRAINT IF EXISTS user_shoe_sizes_user_id_size_system_id_key;

ALTER TABLE user_shoe_sizes 
ADD CONSTRAINT user_shoe_sizes_profile_id_size_system_id_key 
UNIQUE (profile_id, size_system_id);

-- Step 7: Add comprehensive schema comments for clarity
COMMENT ON TABLE users_profile IS 
'User profiles table - contains business data for authenticated users. 
Links to auth.users via user_id column for authentication.';

COMMENT ON COLUMN users_profile.id IS 
'Primary key - Profile ID used by business logic and detail tables';

COMMENT ON COLUMN users_profile.user_id IS 
'Foreign key to auth.users.id - Links profile to authentication system';

COMMENT ON TABLE user_equipment IS 
'User equipment details - references users_profile.id (not auth.users.id)';

COMMENT ON COLUMN user_equipment.profile_id IS 
'Foreign key to users_profile.id - Links equipment to user profile';

COMMENT ON TABLE user_clothing_sizes IS 
'User clothing sizes - references users_profile.id (not auth.users.id)';

COMMENT ON COLUMN user_clothing_sizes.profile_id IS 
'Foreign key to users_profile.id - Links clothing sizes to user profile';

COMMENT ON TABLE user_measurements IS 
'User body measurements - references users_profile.id (not auth.users.id)';

COMMENT ON COLUMN user_measurements.profile_id IS 
'Foreign key to users_profile.id - Links measurements to user profile';

COMMENT ON TABLE user_shoe_sizes IS 
'User shoe sizes - references users_profile.id (not auth.users.id)';

COMMENT ON COLUMN user_shoe_sizes.profile_id IS 
'Foreign key to users_profile.id - Links shoe sizes to user profile';

-- Step 8: Update the get_user_equipment_details function to use new column name
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
    WHERE ue.profile_id = user_uuid  -- Updated to use profile_id
    ORDER BY ue.display_order ASC, et.sort_order ASC, em.brand ASC, em.model ASC;
END;
$$ LANGUAGE plpgsql;

-- Step 9: Add a helpful view to show the ID relationships clearly
CREATE OR REPLACE VIEW user_id_relationships AS
SELECT 
    'users_profile' as table_name,
    'id' as column_name,
    'Primary key - Profile ID' as description,
    'Used by business logic and detail tables' as usage
UNION ALL
SELECT 
    'users_profile' as table_name,
    'user_id' as column_name,
    'Foreign key to auth.users.id' as description,
    'Links profile to authentication system' as usage
UNION ALL
SELECT 
    'user_equipment' as table_name,
    'profile_id' as column_name,
    'Foreign key to users_profile.id' as description,
    'Links equipment to user profile' as usage
UNION ALL
SELECT 
    'user_clothing_sizes' as table_name,
    'profile_id' as column_name,
    'Foreign key to users_profile.id' as description,
    'Links clothing sizes to user profile' as usage
UNION ALL
SELECT 
    'user_measurements' as table_name,
    'profile_id' as column_name,
    'Foreign key to users_profile.id' as description,
    'Links measurements to user profile' as usage
UNION ALL
SELECT 
    'user_shoe_sizes' as table_name,
    'profile_id' as column_name,
    'Foreign key to users_profile.id' as description,
    'Links shoe sizes to user profile' as usage;

COMMENT ON VIEW user_id_relationships IS 
'Documentation view showing ID relationships and their purposes';

-- Step 10: Final verification
DO $$
DECLARE
    equipment_count INTEGER;
    clothing_count INTEGER;
    measurement_count INTEGER;
    shoe_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO equipment_count FROM user_equipment;
    SELECT COUNT(*) INTO clothing_count FROM user_clothing_sizes;
    SELECT COUNT(*) INTO measurement_count FROM user_measurements;
    SELECT COUNT(*) INTO shoe_count FROM user_shoe_sizes;
    
    RAISE NOTICE 'Schema clarity migration completed successfully!';
    RAISE NOTICE 'Renamed user_id to profile_id in detail tables:';
    RAISE NOTICE '- user_equipment.user_id → user_equipment.profile_id (% records)', equipment_count;
    RAISE NOTICE '- user_clothing_sizes.user_id → user_clothing_sizes.profile_id (% records)', clothing_count;
    RAISE NOTICE '- user_measurements.user_id → user_measurements.profile_id (% records)', measurement_count;
    RAISE NOTICE '- user_shoe_sizes.user_id → user_shoe_sizes.profile_id (% records)', shoe_count;
    RAISE NOTICE 'Added comprehensive schema comments for clarity';
    RAISE NOTICE 'Created user_id_relationships view for documentation';
    RAISE NOTICE 'All data integrity checks passed!';
    RAISE NOTICE 'Foreign key constraints now point to users_profile.id instead of auth.users.id';
END $$;

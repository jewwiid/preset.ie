-- Fix user_settings table to use profile_id instead of user_id
-- This aligns user_settings with the new schema clarity architecture
-- 
-- Current issue: user_settings.user_id references auth.users(id)
-- Should be: user_settings.profile_id references users_profile(id)

-- Step 1: Drop existing constraints and triggers
DROP TRIGGER IF EXISTS create_user_settings_trigger ON auth.users;
DROP FUNCTION IF EXISTS create_default_user_settings();

-- Step 2: Drop foreign key constraint
ALTER TABLE user_settings DROP CONSTRAINT IF EXISTS user_settings_user_id_fkey;

-- Step 3: Drop unique constraint
ALTER TABLE user_settings DROP CONSTRAINT IF EXISTS user_settings_user_id_key;

-- Step 4: Drop index
DROP INDEX IF EXISTS idx_user_settings_user_id;

-- Step 5: Rename user_id to profile_id
ALTER TABLE user_settings RENAME COLUMN user_id TO profile_id;

-- Step 5.5: Update profile_id values to reference users_profile.id instead of auth.users.id
UPDATE user_settings 
SET profile_id = (
    SELECT up.id 
    FROM users_profile up 
    WHERE up.user_id = user_settings.profile_id
)
WHERE EXISTS (
    SELECT 1 
    FROM users_profile up 
    WHERE up.user_id = user_settings.profile_id
);

-- Step 5.6: Delete any orphaned records that don't have corresponding users_profile entries
DELETE FROM user_settings 
WHERE NOT EXISTS (
    SELECT 1 
    FROM users_profile up 
    WHERE up.id = user_settings.profile_id
);

-- Step 6: Recreate foreign key constraint pointing to users_profile.id
ALTER TABLE user_settings 
ADD CONSTRAINT user_settings_profile_id_fkey 
FOREIGN KEY (profile_id) REFERENCES users_profile(id) ON DELETE CASCADE;

-- Step 7: Recreate unique constraint
ALTER TABLE user_settings 
ADD CONSTRAINT user_settings_profile_id_key 
UNIQUE (profile_id);

-- Step 8: Recreate index
CREATE INDEX IF NOT EXISTS idx_user_settings_profile_id ON user_settings(profile_id);

-- Step 9: Create new function to create default settings when a profile is created
CREATE OR REPLACE FUNCTION create_default_user_settings()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_settings (profile_id)
    VALUES (NEW.id)
    ON CONFLICT (profile_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 10: Create trigger on users_profile instead of auth.users
CREATE TRIGGER create_user_settings_trigger
    AFTER INSERT ON users_profile
    FOR EACH ROW
    EXECUTE FUNCTION create_default_user_settings();

-- Step 11: Update RLS policies to use profile_id
DROP POLICY IF EXISTS "Users can access their own settings" ON user_settings;

CREATE POLICY "Users can access their own settings" ON user_settings
    FOR ALL USING (
        profile_id IN (
            SELECT id FROM users_profile 
            WHERE user_id = auth.uid()
        )
    );

-- Step 12: Add schema comments for clarity
COMMENT ON TABLE user_settings IS 
'User-specific application settings - references users_profile.id (not auth.users.id)';

COMMENT ON COLUMN user_settings.profile_id IS 
'Foreign key to users_profile.id - Links settings to user profile';

-- Step 13: Update the user_id_relationships view to include user_settings
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
    'Links shoe sizes to user profile' as usage
UNION ALL
SELECT 
    'user_settings' as table_name,
    'profile_id' as column_name,
    'Foreign key to users_profile.id' as description,
    'Links settings to user profile' as usage;

COMMENT ON VIEW user_id_relationships IS 
'Documentation view showing ID relationships and their purposes';

-- Step 14: Success message
DO $$
BEGIN
    RAISE NOTICE 'User settings table schema fixed successfully!';
    RAISE NOTICE 'Renamed user_settings.user_id → user_settings.profile_id';
    RAISE NOTICE 'Updated foreign key to reference users_profile.id';
    RAISE NOTICE 'Updated unique constraint and index';
    RAISE NOTICE 'Updated trigger to fire on users_profile insert';
    RAISE NOTICE 'Updated RLS policies to use profile_id';
    RAISE NOTICE 'Updated documentation view';
END $$;

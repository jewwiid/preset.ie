-- Fix user_settings table schema - targeted approach
-- This migration only fixes the user_settings table without conflicts

DO $$
BEGIN
    -- Check if user_settings table has user_id column (old schema)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_settings' 
        AND column_name = 'user_id' 
        AND table_schema = 'public'
    ) THEN
        RAISE NOTICE 'Found user_id column, converting to profile_id...';
        
        -- Step 1: Drop existing constraints
        ALTER TABLE user_settings DROP CONSTRAINT IF EXISTS user_settings_user_id_fkey;
        ALTER TABLE user_settings DROP CONSTRAINT IF EXISTS user_settings_user_id_key;
        DROP INDEX IF EXISTS idx_user_settings_user_id;
        
        -- Step 2: Rename column
        ALTER TABLE user_settings RENAME COLUMN user_id TO profile_id;
        
        -- Step 3: Update profile_id values to reference users_profile.id instead of auth.users.id
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
        
        -- Step 4: Delete any orphaned records that don't have corresponding users_profile entries
        DELETE FROM user_settings 
        WHERE NOT EXISTS (
            SELECT 1 
            FROM users_profile up 
            WHERE up.id = user_settings.profile_id
        );
        
        -- Step 5: Recreate constraints
        ALTER TABLE user_settings 
        ADD CONSTRAINT user_settings_profile_id_fkey 
        FOREIGN KEY (profile_id) REFERENCES users_profile(id) ON DELETE CASCADE;
        
        ALTER TABLE user_settings 
        ADD CONSTRAINT user_settings_profile_id_key 
        UNIQUE (profile_id);
        
        CREATE INDEX idx_user_settings_profile_id ON user_settings(profile_id);
        
        -- Step 6: Update RLS policies
        DROP POLICY IF EXISTS "Users can access own settings" ON user_settings;
        DROP POLICY IF EXISTS "Users can access their own settings" ON user_settings;
        
        CREATE POLICY "Users can access their own settings" ON user_settings
        FOR ALL USING (
            profile_id IN (
                SELECT id FROM users_profile 
                WHERE user_id = auth.uid()
            )
        );
        
        RAISE NOTICE 'Successfully converted user_settings from user_id to profile_id';
        
    ELSE
        RAISE NOTICE 'profile_id column already exists, skipping conversion';
    END IF;
    
END $$;

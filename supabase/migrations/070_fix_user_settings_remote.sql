-- Fix user_settings table for remote database
-- This migration handles the case where user_settings still has user_id instead of profile_id

DO $$
BEGIN
    -- Check if user_id column exists and rename it to profile_id
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_settings' 
        AND column_name = 'user_id' 
        AND table_schema = 'public'
    ) THEN
        RAISE NOTICE 'Found user_id column, renaming to profile_id...';
        
        -- Drop existing constraints
        ALTER TABLE user_settings DROP CONSTRAINT IF EXISTS user_settings_user_id_fkey;
        ALTER TABLE user_settings DROP CONSTRAINT IF EXISTS user_settings_user_id_key;
        DROP INDEX IF EXISTS idx_user_settings_user_id;
        
        -- Rename column
        ALTER TABLE user_settings RENAME COLUMN user_id TO profile_id;
        
        -- Recreate constraints with correct references
        ALTER TABLE user_settings 
        ADD CONSTRAINT user_settings_profile_id_fkey 
        FOREIGN KEY (profile_id) REFERENCES users_profile(id) ON DELETE CASCADE;
        
        ALTER TABLE user_settings 
        ADD CONSTRAINT user_settings_profile_id_key 
        UNIQUE (profile_id);
        
        CREATE INDEX idx_user_settings_profile_id ON user_settings(profile_id);
        
        RAISE NOTICE 'Successfully renamed user_id to profile_id';
    ELSE
        RAISE NOTICE 'profile_id column already exists, skipping rename';
    END IF;
    
    -- Update RLS policies
    DROP POLICY IF EXISTS "Users can access own settings" ON user_settings;
    DROP POLICY IF EXISTS "Users can access their own settings" ON user_settings;
    
    CREATE POLICY "Users can access their own settings" ON user_settings
    FOR ALL USING (
        profile_id IN (
            SELECT users_profile.id 
            FROM users_profile 
            WHERE users_profile.user_id = auth.uid()
        )
    );
    
    RAISE NOTICE 'Updated RLS policies for user_settings';
    
END $$;

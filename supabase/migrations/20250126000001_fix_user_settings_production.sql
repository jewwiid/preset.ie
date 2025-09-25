-- Production-ready fix for user_settings table
-- This migration ensures the user_settings table works correctly in production
-- by handling both the old and new schema gracefully

-- Step 1: Check if profile_id column exists, if not add it
DO $$
BEGIN
    -- Check if profile_id column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_settings' 
        AND column_name = 'profile_id'
    ) THEN
        -- Add profile_id column
        ALTER TABLE user_settings ADD COLUMN profile_id UUID REFERENCES users_profile(id) ON DELETE CASCADE;
        
        -- Migrate existing data from user_id to profile_id
        UPDATE user_settings 
        SET profile_id = (
            SELECT up.id 
            FROM users_profile up 
            WHERE up.user_id = user_settings.user_id
        )
        WHERE profile_id IS NULL;
        
        -- Add unique constraint on profile_id
        ALTER TABLE user_settings ADD CONSTRAINT user_settings_profile_id_key UNIQUE (profile_id);
        
        -- Create index for performance
        CREATE INDEX IF NOT EXISTS idx_user_settings_profile_id ON user_settings(profile_id);
        
        RAISE NOTICE 'Added profile_id column and migrated existing data';
    ELSE
        RAISE NOTICE 'profile_id column already exists';
    END IF;
END $$;

-- Step 2: Update RLS policies to work with both user_id and profile_id
DROP POLICY IF EXISTS "Users can access own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can access their own settings" ON user_settings;

-- Create comprehensive RLS policy that works with both schemas
CREATE POLICY "Users can access their own settings" ON user_settings
    FOR ALL USING (
        -- Check if user_id matches (old schema)
        auth.uid() = user_id 
        OR 
        -- Check if profile_id matches (new schema)
        profile_id IN (
            SELECT id FROM users_profile 
            WHERE user_id = auth.uid()
        )
    );

-- Step 3: Create or update the trigger function to handle both schemas
CREATE OR REPLACE FUNCTION create_default_user_settings()
RETURNS TRIGGER AS $$
BEGIN
    -- Try to insert with profile_id first (new schema)
    IF TG_TABLE_NAME = 'users_profile' THEN
        INSERT INTO user_settings (profile_id, email_notifications, push_notifications, marketing_emails, profile_visibility, show_contact_info, two_factor_enabled)
        VALUES (NEW.id, true, true, false, 'public', true, false)
        ON CONFLICT (profile_id) DO NOTHING;
    ELSE
        -- Fallback for auth.users (old schema)
        INSERT INTO user_settings (user_id, email_notifications, push_notifications, marketing_emails, profile_visibility, show_contact_info, two_factor_enabled)
        VALUES (NEW.id, true, true, false, 'public', true, false)
        ON CONFLICT (user_id) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create triggers for both tables
-- Trigger for users_profile (new schema)
DROP TRIGGER IF EXISTS create_user_settings_profile_trigger ON users_profile;
CREATE TRIGGER create_user_settings_profile_trigger
    AFTER INSERT ON users_profile
    FOR EACH ROW
    EXECUTE FUNCTION create_default_user_settings();

-- Trigger for auth.users (fallback for old schema)
DROP TRIGGER IF EXISTS create_user_settings_auth_trigger ON auth.users;
CREATE TRIGGER create_user_settings_auth_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_default_user_settings();

-- Step 5: Create helper function to get user settings
CREATE OR REPLACE FUNCTION get_user_settings(user_uuid UUID)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    profile_id UUID,
    email_notifications BOOLEAN,
    push_notifications BOOLEAN,
    marketing_emails BOOLEAN,
    profile_visibility VARCHAR,
    show_contact_info BOOLEAN,
    two_factor_enabled BOOLEAN,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        us.id,
        us.user_id,
        us.profile_id,
        us.email_notifications,
        us.push_notifications,
        us.marketing_emails,
        us.profile_visibility,
        us.show_contact_info,
        us.two_factor_enabled,
        us.created_at,
        us.updated_at
    FROM user_settings us
    WHERE us.user_id = user_uuid
       OR us.profile_id IN (
           SELECT up.id FROM users_profile up WHERE up.user_id = user_uuid
       )
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Create helper function to upsert user settings
CREATE OR REPLACE FUNCTION upsert_user_settings(
    user_uuid UUID,
    settings_data JSONB
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    profile_id UUID,
    email_notifications BOOLEAN,
    push_notifications BOOLEAN,
    marketing_emails BOOLEAN,
    profile_visibility VARCHAR,
    show_contact_info BOOLEAN,
    two_factor_enabled BOOLEAN,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
DECLARE
    profile_uuid UUID;
    existing_settings RECORD;
BEGIN
    -- Get profile_id for the user
    SELECT up.id INTO profile_uuid FROM users_profile up WHERE up.user_id = user_uuid LIMIT 1;
    
    -- Check if settings already exist
    SELECT * INTO existing_settings FROM user_settings 
    WHERE user_id = user_uuid OR profile_id = profile_uuid
    LIMIT 1;
    
    IF existing_settings IS NOT NULL THEN
        -- Update existing settings
        UPDATE user_settings SET
            email_notifications = COALESCE((settings_data->>'email_notifications')::BOOLEAN, existing_settings.email_notifications),
            push_notifications = COALESCE((settings_data->>'push_notifications')::BOOLEAN, existing_settings.push_notifications),
            marketing_emails = COALESCE((settings_data->>'marketing_emails')::BOOLEAN, existing_settings.marketing_emails),
            profile_visibility = COALESCE(settings_data->>'profile_visibility', existing_settings.profile_visibility),
            show_contact_info = COALESCE((settings_data->>'show_contact_info')::BOOLEAN, existing_settings.show_contact_info),
            two_factor_enabled = COALESCE((settings_data->>'two_factor_enabled')::BOOLEAN, existing_settings.two_factor_enabled),
            updated_at = NOW()
        WHERE id = existing_settings.id;
        
        RETURN QUERY SELECT * FROM user_settings WHERE id = existing_settings.id;
    ELSE
        -- Insert new settings
        RETURN QUERY INSERT INTO user_settings (
            user_id,
            profile_id,
            email_notifications,
            push_notifications,
            marketing_emails,
            profile_visibility,
            show_contact_info,
            two_factor_enabled,
            updated_at
        )
        VALUES (
            user_uuid,
            profile_uuid,
            COALESCE((settings_data->>'email_notifications')::BOOLEAN, true),
            COALESCE((settings_data->>'push_notifications')::BOOLEAN, true),
            COALESCE((settings_data->>'marketing_emails')::BOOLEAN, false),
            COALESCE(settings_data->>'profile_visibility', 'public'),
            COALESCE((settings_data->>'show_contact_info')::BOOLEAN, true),
            COALESCE((settings_data->>'two_factor_enabled')::BOOLEAN, false),
            NOW()
        )
        RETURNING *;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_user_settings(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_user_settings(UUID, JSONB) TO authenticated;

-- Step 8: Add helpful comments
COMMENT ON FUNCTION get_user_settings(UUID) IS 'Safely retrieves user settings regardless of schema (user_id or profile_id)';
COMMENT ON FUNCTION upsert_user_settings(UUID, JSONB) IS 'Safely upserts user settings with proper conflict resolution';

-- Step 9: Success message
DO $$
BEGIN
    RAISE NOTICE 'User settings production fix applied successfully!';
    RAISE NOTICE 'Added profile_id column if missing';
    RAISE NOTICE 'Updated RLS policies for both schemas';
    RAISE NOTICE 'Created helper functions for safe operations';
    RAISE NOTICE 'Added triggers for automatic settings creation';
END $$;

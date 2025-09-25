-- Simple production fix for user_settings table
-- This migration ensures user_settings works correctly without complex schema changes

-- Step 1: Ensure user_settings table exists with proper structure
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Notification preferences
    email_notifications BOOLEAN DEFAULT TRUE,
    push_notifications BOOLEAN DEFAULT TRUE,
    marketing_emails BOOLEAN DEFAULT FALSE,
    
    -- Privacy settings
    profile_visibility VARCHAR(20) DEFAULT 'public' CHECK (profile_visibility IN ('public', 'private')),
    show_contact_info BOOLEAN DEFAULT TRUE,
    
    -- Security settings
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure one settings record per user
    UNIQUE(user_id)
);

-- Step 2: Create index for performance
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- Step 3: Enable RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS policy
DROP POLICY IF EXISTS "Users can access own settings" ON user_settings;
CREATE POLICY "Users can access own settings" ON user_settings
    FOR ALL USING (auth.uid() = user_id);

-- Step 5: Create function to create default settings
CREATE OR REPLACE FUNCTION create_default_user_settings()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_settings (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create trigger for new users
DROP TRIGGER IF EXISTS create_user_settings_trigger ON auth.users;
CREATE TRIGGER create_user_settings_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_default_user_settings();

-- Step 7: Create helper function to get user settings safely
CREATE OR REPLACE FUNCTION get_user_settings_safe(user_uuid UUID)
RETURNS TABLE (
    id UUID,
    user_id UUID,
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
    -- Try to get existing settings
    RETURN QUERY
    SELECT 
        us.id,
        us.user_id,
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
    LIMIT 1;
    
    -- If no settings found, create default and return them
    IF NOT FOUND THEN
        INSERT INTO user_settings (user_id)
        VALUES (user_uuid)
        ON CONFLICT (user_id) DO NOTHING;
        
        RETURN QUERY
        SELECT 
            us.id,
            us.user_id,
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
        LIMIT 1;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 8: Grant permissions
GRANT ALL ON user_settings TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_settings_safe(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION create_default_user_settings() TO authenticated;

-- Step 9: Add helpful comments
COMMENT ON TABLE user_settings IS 'User-specific application settings including notifications, privacy, and security preferences';
COMMENT ON FUNCTION get_user_settings_safe(UUID) IS 'Safely retrieves user settings, creating default if none exist';

-- Step 10: Success message
DO $$
BEGIN
    RAISE NOTICE 'Simple user settings production fix applied successfully!';
    RAISE NOTICE 'Created user_settings table with proper structure';
    RAISE NOTICE 'Added RLS policies and triggers';
    RAISE NOTICE 'Created safe helper function';
END $$;

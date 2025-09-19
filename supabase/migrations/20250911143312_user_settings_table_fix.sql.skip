-- Fix user_settings table schema cache issue
-- Drop existing table if it exists and recreate with proper Supabase migration

-- Drop existing table and related objects if they exist
DROP TABLE IF EXISTS user_settings CASCADE;
DROP TRIGGER IF EXISTS create_user_settings_trigger ON auth.users;
DROP FUNCTION IF EXISTS create_default_user_settings();

-- Create user_settings table
CREATE TABLE user_settings (
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

-- Create index for performance
CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);

-- Add RLS policies
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Users can only access their own settings
CREATE POLICY "Users can access own settings" ON user_settings
    FOR ALL USING (auth.uid() = user_id);

-- Function to create default settings when a user is created
CREATE OR REPLACE FUNCTION create_default_user_settings()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_settings (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create default settings for new users
CREATE TRIGGER create_user_settings_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_default_user_settings();

-- Apply update timestamp trigger (using existing function)
CREATE TRIGGER update_user_settings_updated_at 
    BEFORE UPDATE ON user_settings
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at();

-- Grant necessary permissions
GRANT ALL ON user_settings TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Add helpful comment
COMMENT ON TABLE user_settings IS 'User-specific application settings including notifications, privacy, and security preferences';

-- Insert default settings for existing users (if any)
INSERT INTO user_settings (user_id)
SELECT id FROM auth.users
ON CONFLICT (user_id) DO NOTHING;
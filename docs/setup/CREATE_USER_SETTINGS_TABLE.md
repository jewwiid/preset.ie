# Create User Settings Table

## Issue
The `user_settings` table is missing from the database, causing PGRST205 errors when trying to save settings.

## Solution
Execute this SQL in the Supabase SQL Editor:

```sql
-- Create user_settings table
CREATE TABLE user_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Notification preferences
    email_notifications BOOLEAN DEFAULT TRUE,
    push_notifications BOOLEAN DEFAULT TRUE,
    marketing_emails BOOLEAN DEFAULT FALSE,
    
    -- Privacy settings
    profile_visibility VARCHAR(20) DEFAULT 'public' CHECK (profile_visibility IN ('public', 'private', 'connections')),
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

-- Grant necessary permissions
GRANT ALL ON user_settings TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Add helpful comment
COMMENT ON TABLE user_settings IS 'User-specific application settings including notifications, privacy, and security preferences';

-- Insert default settings for existing users (if any)
INSERT INTO user_settings (user_id)
SELECT id FROM auth.users
ON CONFLICT (user_id) DO NOTHING;
```

## Steps:
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Create a new query
4. Paste the SQL above
5. Run the query
6. Verify table creation in Table Editor

## What This Creates:
- `user_settings` table with proper schema
- RLS policies for security
- Automatic default settings creation for new users
- Default settings for existing users
- Proper indexing for performance

After running this SQL, the settings page will work correctly.
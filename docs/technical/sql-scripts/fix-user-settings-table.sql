-- Fix Missing Columns in user_settings table
-- This adds the missing columns to the user_settings table

-- Add profile_id column if it doesn't exist
ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES users_profile(id) ON DELETE CASCADE;

-- Add message_notifications column if it doesn't exist
ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS message_notifications BOOLEAN DEFAULT true;

-- Add allow_stranger_messages column if it doesn't exist
ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS allow_stranger_messages BOOLEAN DEFAULT false;

-- Add privacy_level column if it doesn't exist
ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS privacy_level VARCHAR(20) DEFAULT 'standard';

-- Create indexes for user_settings table
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_profile_id ON user_settings(profile_id);

-- Add unique constraint for profile_id if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_settings_profile_id_key' 
        AND table_name = 'user_settings'
    ) THEN
        ALTER TABLE user_settings 
        ADD CONSTRAINT user_settings_profile_id_key UNIQUE (profile_id);
    END IF;
END $$;

-- Create function to create default user settings
CREATE OR REPLACE FUNCTION create_default_user_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_settings (user_id, profile_id)
  VALUES (NEW.id, NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic user settings creation
DROP TRIGGER IF EXISTS create_user_settings_trigger ON auth.users;
CREATE TRIGGER create_user_settings_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_default_user_settings();

-- Update existing user_settings records to have profile_id if missing
UPDATE user_settings 
SET profile_id = user_id 
WHERE profile_id IS NULL;

-- Verify the columns were added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'user_settings' 
AND column_name IN ('profile_id', 'message_notifications', 'allow_stranger_messages', 'privacy_level')
ORDER BY column_name;

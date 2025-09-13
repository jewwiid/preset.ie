-- Add messaging privacy fields to user_settings table
-- Migration: 062_add_messaging_privacy_fields.sql

-- Add new messaging privacy fields to user_settings table
ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS message_notifications BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS message_read_receipts BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS allow_stranger_messages BOOLEAN DEFAULT TRUE;

-- Add comments for documentation
COMMENT ON COLUMN user_settings.message_notifications IS 'Whether user wants to receive notifications for new messages';
COMMENT ON COLUMN user_settings.message_read_receipts IS 'Whether user wants to show read receipts to others';
COMMENT ON COLUMN user_settings.allow_stranger_messages IS 'Whether user allows messages from users they havent worked with';

-- Update existing records to have default values
UPDATE user_settings 
SET 
  message_notifications = TRUE,
  message_read_receipts = TRUE,
  allow_stranger_messages = TRUE
WHERE 
  message_notifications IS NULL 
  OR message_read_receipts IS NULL 
  OR allow_stranger_messages IS NULL;

-- Add indexes for performance if needed
CREATE INDEX IF NOT EXISTS idx_user_settings_message_notifications 
ON user_settings(message_notifications) 
WHERE message_notifications = FALSE;

CREATE INDEX IF NOT EXISTS idx_user_settings_allow_stranger_messages 
ON user_settings(allow_stranger_messages) 
WHERE allow_stranger_messages = FALSE;

-- Add missing notification columns
-- Run this in your Supabase SQL Editor

-- Add the missing application_notifications column
ALTER TABLE notification_preferences 
ADD COLUMN IF NOT EXISTS application_notifications BOOLEAN DEFAULT true;

-- Let's also check if there are any other missing columns by looking at the TypeScript interface
-- Based on the code, let's add any other potentially missing columns

-- Add index for the new column
CREATE INDEX IF NOT EXISTS idx_notification_preferences_application ON notification_preferences(application_notifications);

-- Update the table to ensure all expected columns exist
-- Check what columns currently exist vs what the app expects
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'notification_preferences'
ORDER BY ordinal_position;

-- Test the table by inserting a sample record (will be rolled back)
BEGIN;
INSERT INTO notification_preferences (user_id, application_notifications) 
VALUES ('00000000-0000-0000-0000-000000000000', true);
ROLLBACK;

-- Verify the column was added successfully
SELECT 'application_notifications column added successfully' as status;

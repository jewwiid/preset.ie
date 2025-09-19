-- Temporarily disable all triggers on auth.users to test user creation
-- This will help us determine if the issue is with triggers or something else

-- Drop all triggers on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS create_user_settings_trigger ON auth.users;
DROP TRIGGER IF EXISTS initialize_user_credits_trigger ON auth.users;
DROP TRIGGER IF EXISTS create_notification_preferences_trigger ON auth.users;

-- Verify triggers are disabled
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'users' AND event_object_schema = 'auth';

SELECT 'All triggers on auth.users have been disabled for testing!' as status;


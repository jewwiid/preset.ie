-- Temporarily disable user creation triggers to isolate the issue
-- This will help us identify which trigger is causing the problem

-- List all triggers on auth.users table
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
AND event_object_schema = 'auth'
ORDER BY trigger_name;

-- Disable triggers temporarily
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS create_user_settings_trigger ON auth.users;
DROP TRIGGER IF EXISTS create_notification_preferences_trigger ON auth.users;

SELECT 'User creation triggers disabled temporarily' as status;


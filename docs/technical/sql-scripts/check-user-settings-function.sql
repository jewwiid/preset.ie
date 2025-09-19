-- Check the current create_default_user_settings function definition
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'create_default_user_settings' 
AND routine_schema = 'public';

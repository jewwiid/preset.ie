-- Check the actual structure of user_settings table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_settings' AND table_schema = 'public'
ORDER BY ordinal_position;

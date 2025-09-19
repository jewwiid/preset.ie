-- Debug notification_preferences table issue
-- Check if the table exists and in which schema

-- Check all schemas for notification_preferences table
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE tablename = 'notification_preferences';

-- Check if there are any triggers trying to access notification_preferences
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE action_statement LIKE '%notification_preferences%';

-- Check if there are any functions trying to access notification_preferences
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_definition LIKE '%notification_preferences%';

-- Check current schema
SELECT current_schema();

-- List all tables in public schema
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;


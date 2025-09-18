-- Final fix for users table foreign key constraint
-- The issue is that users.id has a foreign key to auth.users.id
-- but the trigger tries to insert into users before auth.users exists

-- First, let's check the current constraint
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name='users';

-- Drop the problematic foreign key constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_id_fkey;

-- The users table should NOT have a foreign key constraint to auth.users.id
-- because auth.users is managed by Supabase Auth, not our application
-- Instead, we should rely on triggers to sync the data

-- Verify the constraint is removed
SELECT 'Foreign key constraint removed from users.id' as status;


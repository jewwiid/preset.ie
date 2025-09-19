-- Fix notification_preferences foreign key constraint
-- The table should reference auth.users(id) instead of public.users(id)

-- Drop the existing foreign key constraint
ALTER TABLE public.notification_preferences 
DROP CONSTRAINT IF EXISTS notification_preferences_user_id_fkey;

-- Add new foreign key constraint to auth.users
ALTER TABLE public.notification_preferences 
ADD CONSTRAINT notification_preferences_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Verify the constraint was added
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
  AND tc.table_name='notification_preferences';

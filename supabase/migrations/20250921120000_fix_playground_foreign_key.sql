-- Fix playground_projects foreign key constraint to reference auth.users
-- This ensures the table correctly references Supabase's auth system

-- Drop the incorrect foreign key constraint if it exists
ALTER TABLE playground_projects DROP CONSTRAINT IF EXISTS playground_projects_user_id_fkey;

-- Add the correct foreign key constraint to auth.users
ALTER TABLE playground_projects ADD CONSTRAINT playground_projects_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add comment for documentation
COMMENT ON CONSTRAINT playground_projects_user_id_fkey ON playground_projects 
  IS 'References auth.users for proper Supabase authentication integration';

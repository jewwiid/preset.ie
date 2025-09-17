-- Minimal fix for showcase creation RLS policy
-- This script adds only the missing RLS policy needed for showcase creation

-- Enable RLS on showcases table (safe if already enabled)
ALTER TABLE showcases ENABLE ROW LEVEL SECURITY;

-- Drop and recreate the INSERT policy for showcases
DROP POLICY IF EXISTS "Users can create their own showcases" ON showcases;
CREATE POLICY "Users can create their own showcases" ON showcases
  FOR INSERT WITH CHECK (auth.uid() = creator_user_id);

-- Also ensure the SELECT policy exists so users can view public showcases
DROP POLICY IF EXISTS "Users can view public showcases" ON showcases;
CREATE POLICY "Users can view public showcases" ON showcases
  FOR SELECT USING (visibility = 'PUBLIC');

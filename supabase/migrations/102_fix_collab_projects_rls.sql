-- Fix RLS policies for collab_projects to properly handle creator_id vs auth.uid()
-- The issue was that creator_id stores users_profile.id but RLS was checking auth.uid()

-- Drop existing policies
DROP POLICY IF EXISTS "collab_projects_read" ON collab_projects;
DROP POLICY IF EXISTS "collab_projects_insert_own" ON collab_projects;
DROP POLICY IF EXISTS "collab_projects_update_own" ON collab_projects;
DROP POLICY IF EXISTS "collab_projects_delete_own" ON collab_projects;

-- Recreate policies with proper user_id mapping
-- Anyone can read public projects, creators can read their own
CREATE POLICY "collab_projects_read" ON collab_projects 
  FOR SELECT USING (
    visibility = 'public' OR 
    EXISTS (
      SELECT 1 FROM users_profile up 
      WHERE up.id = creator_id AND up.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM collab_participants cp 
      JOIN users_profile up ON cp.user_id = up.id
      WHERE cp.project_id = collab_projects.id AND up.user_id = auth.uid()
    )
  );

-- Only creators can insert their own projects
CREATE POLICY "collab_projects_insert_own" ON collab_projects 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users_profile up 
      WHERE up.id = creator_id AND up.user_id = auth.uid()
    )
  );

-- Only creators can update their own projects
CREATE POLICY "collab_projects_update_own" ON collab_projects 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users_profile up 
      WHERE up.id = creator_id AND up.user_id = auth.uid()
    )
  );

-- Only creators can delete their own projects
CREATE POLICY "collab_projects_delete_own" ON collab_projects 
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users_profile up 
      WHERE up.id = creator_id AND up.user_id = auth.uid()
    )
  );

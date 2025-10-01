-- Fix infinite recursion in RLS policies
-- The issue was circular dependencies between collab_projects and collab_participants policies

-- Drop the problematic policies
DROP POLICY IF EXISTS "collab_projects_read" ON collab_projects;
DROP POLICY IF EXISTS "collab_projects_insert_own" ON collab_projects;
DROP POLICY IF EXISTS "collab_projects_update_own" ON collab_projects;
DROP POLICY IF EXISTS "collab_projects_delete_own" ON collab_projects;
DROP POLICY IF EXISTS "collab_participants_read_own" ON collab_participants;

-- Recreate collab_projects policy without circular reference
CREATE POLICY "collab_projects_read" ON collab_projects
  FOR SELECT USING (
    visibility = 'public' OR
    EXISTS (
      SELECT 1 FROM users_profile up
      WHERE up.id = creator_id AND up.user_id = auth.uid()
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

-- Recreate collab_participants policy without circular reference
CREATE POLICY "collab_participants_read_own" ON collab_participants
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users_profile up WHERE up.id = user_id AND up.user_id = auth.uid()) OR
    EXISTS (
      SELECT 1 FROM collab_projects cp
      JOIN users_profile up ON cp.creator_id = up.id
      WHERE cp.id = project_id AND up.user_id = auth.uid()
    )
  );

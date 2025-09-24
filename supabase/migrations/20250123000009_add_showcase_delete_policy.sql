-- Add missing DELETE policy for showcases
-- This policy allows users to delete their own showcases

CREATE POLICY "Users can delete their own showcases" ON showcases
  FOR DELETE USING (
    creator_user_id = (SELECT id FROM users_profile WHERE user_id = auth.uid())
    OR talent_user_id = (SELECT id FROM users_profile WHERE user_id = auth.uid())
  );

-- Also add admin delete policy for showcases
CREATE POLICY "Admins can delete any showcase" ON showcases
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users_profile 
      WHERE user_id = auth.uid() 
      AND 'ADMIN' = ANY(role_flags)
    )
  );

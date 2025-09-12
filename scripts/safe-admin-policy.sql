DROP POLICY IF EXISTS "Admin users can view all applications" ON applications;
DROP POLICY IF EXISTS "Admin users can update all applications" ON applications;

CREATE POLICY "Admin users can view all applications" ON applications
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM users_profile 
    WHERE user_id = auth.uid() 
    AND 'ADMIN' = ANY(role_flags)
  )
);

CREATE POLICY "Admin users can update all applications" ON applications
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM users_profile 
    WHERE user_id = auth.uid() 
    AND 'ADMIN' = ANY(role_flags)
  )
);
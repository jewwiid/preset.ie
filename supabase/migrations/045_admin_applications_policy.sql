-- Add admin access policy for applications table
-- This allows admin users to view all applications for dashboard statistics

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'applications' 
        AND policyname = 'Admin users can view all applications'
    ) THEN
        CREATE POLICY "Admin users can view all applications" ON applications
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM users_profile 
                    WHERE user_id = auth.uid() 
                    AND 'ADMIN' = ANY(role_flags)
                )
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'applications' 
        AND policyname = 'Admin users can update all applications'
    ) THEN
        CREATE POLICY "Admin users can update all applications" ON applications
            FOR UPDATE USING (
                EXISTS (
                    SELECT 1 FROM users_profile 
                    WHERE user_id = auth.uid() 
                    AND 'ADMIN' = ANY(role_flags)
                )
            );
    END IF;
END $$;
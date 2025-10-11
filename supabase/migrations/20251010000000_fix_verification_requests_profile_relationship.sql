-- Fix verification_requests to have a proper relationship with users_profile
-- This allows PostgREST to perform the join correctly

-- First, check if we need to add a profile_id column or use user_id
-- Since user_id already exists and references auth.users, and users_profile also has user_id
-- We can create a view or use a computed relationship

-- Option 1: Create a foreign key relationship through user_id
-- (This requires that users_profile.user_id exists and matches verification_requests.user_id)

-- Drop the constraint if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'verification_requests_user_id_fkey_profile'
    ) THEN
        ALTER TABLE verification_requests
        DROP CONSTRAINT verification_requests_user_id_fkey_profile;
    END IF;
END $$;

-- Add foreign key constraint to users_profile
-- This allows PostgREST to recognize the relationship
ALTER TABLE verification_requests
ADD CONSTRAINT verification_requests_user_id_fkey_profile
FOREIGN KEY (user_id)
REFERENCES users_profile(user_id)
ON DELETE CASCADE;

-- Create an index for better query performance
CREATE INDEX IF NOT EXISTS idx_verification_requests_user_id
ON verification_requests(user_id);

-- Grant necessary permissions
GRANT SELECT ON verification_requests TO authenticated;
GRANT SELECT ON verification_requests TO anon;

-- Update RLS policies if needed
ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;

-- Allow admins to see all verification requests
DROP POLICY IF EXISTS "Admins can view all verification requests" ON verification_requests;
CREATE POLICY "Admins can view all verification requests"
ON verification_requests
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users_profile
    WHERE users_profile.user_id = auth.uid()
    AND users_profile.role_flags @> ARRAY['ADMIN']::user_role[]
  )
);

-- Allow users to view their own verification requests
DROP POLICY IF EXISTS "Users can view their own verification requests" ON verification_requests;
CREATE POLICY "Users can view their own verification requests"
ON verification_requests
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

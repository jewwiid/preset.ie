-- Fix gigs RLS policies to allow all authenticated users to create gigs

-- Drop the existing restrictive INSERT policy
DROP POLICY IF EXISTS "Contributors can create gigs" ON gigs;

-- Create a new INSERT policy that allows any authenticated user to create gigs
-- (Remove the CONTRIBUTOR role requirement)
CREATE POLICY "Authenticated users can create gigs" ON gigs
    FOR INSERT WITH CHECK (
        owner_user_id = (SELECT id FROM users_profile WHERE user_id = auth.uid())
    );

-- Keep the existing UPDATE and DELETE policies as they are appropriate
-- (Users can only update/delete their own gigs)

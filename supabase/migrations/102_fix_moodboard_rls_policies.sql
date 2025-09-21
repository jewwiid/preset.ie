-- Fix moodboard RLS policies to support templates and temporary gigs

-- Drop the existing restrictive INSERT policy
DROP POLICY IF EXISTS "Gig owners can create moodboards" ON moodboards;

-- Create a new INSERT policy that allows:
-- 1. Templates (gig_id is NULL)
-- 2. Moodboards for owned gigs
-- 3. Moodboards for temporary gigs (no gig_id requirement)
CREATE POLICY "Users can create own moodboards" ON moodboards
    FOR INSERT WITH CHECK (
        owner_user_id = (SELECT id FROM users_profile WHERE user_id = auth.uid())
        AND (
            gig_id IS NULL  -- Allow templates and temporary moodboards
            OR gig_id IN (
                SELECT id FROM gigs 
                WHERE owner_user_id = (SELECT id FROM users_profile WHERE user_id = auth.uid())
            )
        )
    );

-- Also update the SELECT policy to include templates
DROP POLICY IF EXISTS "Anyone can view moodboards for published gigs" ON moodboards;

CREATE POLICY "Users can view own and public moodboards" ON moodboards
    FOR SELECT USING (
        owner_user_id = (SELECT id FROM users_profile WHERE user_id = auth.uid())
        OR gig_id IN (SELECT id FROM gigs WHERE status = 'PUBLISHED')
        OR is_template = true  -- Allow viewing templates (could be made more restrictive later)
    );

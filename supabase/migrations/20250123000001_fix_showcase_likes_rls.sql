-- Fix RLS policy for showcase_likes to allow users to like their own showcases
-- regardless of visibility

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Authenticated users can like showcases" ON showcase_likes;

-- Create a new policy that allows users to like any showcase they can see
-- (public showcases or their own showcases)
CREATE POLICY "Users can like visible showcases" ON showcase_likes
    FOR INSERT WITH CHECK (
        user_id = (SELECT id FROM users_profile WHERE user_id = auth.uid())
        AND (
            showcase_id IN (
                SELECT id FROM showcases WHERE visibility = 'PUBLIC'
            )
            OR showcase_id IN (
                SELECT id FROM showcases 
                WHERE creator_user_id = (SELECT id FROM users_profile WHERE user_id = auth.uid())
                OR talent_user_id = (SELECT id FROM users_profile WHERE user_id = auth.uid())
            )
        )
    );

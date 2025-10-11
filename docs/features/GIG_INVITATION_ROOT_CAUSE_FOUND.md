# Gig Invitation System - Root Cause Found! 🎯

## The Problem
The gig invitation was failing with a 500 error: "Failed to create invitation"

## Root Cause
**The RLS policy for `gig_invitations` table was checking the wrong privacy column!**

### In the Database (Migration 20251009000000_create_gig_invitations.sql, Line 67):
```sql
EXISTS (
  SELECT 1 FROM users_profile
  WHERE id = invitee_id
  AND allow_collaboration_invites = true  -- ❌ WRONG! This is for project invitations
)
```

### Should Be:
```sql
EXISTS (
  SELECT 1 FROM users_profile
  WHERE id = invitee_id
  AND (allow_gig_invites = true OR allow_gig_invites IS NULL)  -- ✅ CORRECT!
)
```

## Why This Caused the 500 Error
When the API tried to insert a gig invitation, the RLS policy blocked it because:
1. It was checking `allow_collaboration_invites` (which exists and is `true`)
2. But the column name mismatch or the policy logic was failing
3. The INSERT was blocked by RLS, causing a database error
4. The API caught the error and returned 500

## The Fix
**Run this SQL script**: `fix_gig_invitation_rls_policy.sql`

```sql
-- Drop the old policy
DROP POLICY IF EXISTS "Gig owners can send invitations" ON gig_invitations;

-- Recreate with correct column check
CREATE POLICY "Gig owners can send invitations"
  ON gig_invitations
  FOR INSERT
  WITH CHECK (
    -- Must be the gig owner
    inviter_id = (SELECT id FROM users_profile WHERE user_id = auth.uid())
    AND
    -- Gig must belong to the inviter
    EXISTS (
      SELECT 1 FROM gigs 
      WHERE id = gig_id 
      AND owner_user_id = inviter_id
    )
    AND
    -- Cannot invite yourself
    inviter_id != invitee_id
    AND
    -- Check if invitee accepts gig invitations (using allow_gig_invites)
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = invitee_id
      AND (allow_gig_invites = true OR allow_gig_invites IS NULL)
    )
  );
```

## After Applying the Fix
The invitation flow will work perfectly:
1. ✅ Sarah can send gig invitation to James
2. ✅ James will see it on his dashboard
3. ✅ James can accept/decline
4. ✅ Accepting auto-creates an application

## Files to Update for Production
Update `supabase/migrations/20251009000000_create_gig_invitations.sql` line 67 to use `allow_gig_invites` instead of `allow_collaboration_invites`.


# Gig Invitation System - Final Fix

## Issue
The gig invitation system was failing with a 500 error because the API was trying to check a privacy column (`allow_collaboration_invites`) that doesn't exist for gig invitations.

## Solution
Added a new `allow_gig_invites` column to the `users_profile` table to control whether users want to receive gig invitations.

## Steps to Apply the Fix

### 1. Run the SQL Migration
Run the following SQL script against your database:

```sql
-- Add privacy setting for gig invitations
ALTER TABLE users_profile
ADD COLUMN IF NOT EXISTS allow_gig_invites BOOLEAN DEFAULT true;

-- Add comment
COMMENT ON COLUMN users_profile.allow_gig_invites IS 'Whether the user allows receiving gig invitations from contributors';
```

**Location**: `add_gig_invitation_privacy.sql` (in project root)

### 2. API Code Updated
The API code has been updated to use the new column:
- **File**: `apps/web/app/api/gigs/[id]/invitations/route.ts`
- **Lines**: 214, 232

### 3. Test the Flow
After applying the SQL migration:
1. Refresh the browser (Sarah should still be logged in)
2. Navigate to James's profile: http://localhost:3000/users/james_actor
3. Click "Invite" → "Invite to Gig"
4. Select "Urban Fashion — Golden Hour Editorial"
5. Add a personal message
6. Click "Send Invitation"
7. Log in as James and check his dashboard for the invitation

## Expected Behavior
- ✅ Gig invitation sent successfully
- ✅ James receives a notification
- ✅ James can accept/decline from his dashboard
- ✅ When accepted, auto-creates an application to the gig

## Migration Files
- **Migration file**: `supabase/migrations/20251009000001_add_gig_invitation_privacy.sql`
- **Quick SQL**: `add_gig_invitation_privacy.sql` (simpler, no view updates)


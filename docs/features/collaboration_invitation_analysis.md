# Collaboration Project Invitation Functionality Analysis

## Current Status: ❌ NOT IMPLEMENTED

### Summary
The collaboration system has a **`visibility`** field with three options:
- `public` - Anyone can see and apply
- `private` - Only invited users (not fully implemented)
- `invite_only` - By invitation only (not fully implemented)

However, **there is NO invitation system actually implemented** in the codebase. The visibility option exists in the UI and database schema, but the functionality to send, manage, or accept invitations is completely missing.

---

## What Exists:

### 1. Database Schema ✅
**File**: `supabase/migrations/098_collaboration_system.sql`

```sql
CREATE TABLE collab_projects (
  id UUID PRIMARY KEY,
  creator_id UUID NOT NULL,
  title TEXT NOT NULL,
  visibility TEXT CHECK (visibility IN ('public', 'private', 'invite_only')) DEFAULT 'public',
  -- ... other fields
);
```

The database allows storing the visibility setting, but there's:
- ❌ No `collab_invitations` table
- ❌ No `collab_project_members` table
- ❌ No invitation tokens or links
- ❌ No invitation status tracking

### 2. API Filtering ⚠️
**File**: `apps/web/app/api/collab/projects/route.ts`

The API **only shows public projects**:
```typescript
// Line 83: Hardcoded to only show public projects
.eq('visibility', 'public')
```

This means:
- ✅ Users can SET `visibility: 'invite_only'` when creating a project
- ❌ But those projects will NEVER appear in the browse page
- ❌ No way to view projects you've been invited to
- ❌ No way to view your own private/invite-only projects

### 3. UI Components ❌
**File**: `apps/web/app/collaborate/page.tsx`

The collaborate page shows:
- ✅ Project listing
- ✅ Filters for status, location, role, gear
- ❌ No "My Projects" view
- ❌ No "Invited Projects" view
- ❌ No invitation management UI

---

## What's Missing:

### 1. **Invitation Database Tables**

Missing `collab_invitations` table:
```sql
CREATE TABLE collab_invitations (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES collab_projects(id),
  inviter_id UUID REFERENCES users_profile(id),
  invitee_id UUID REFERENCES users_profile(id), -- if known
  invitee_email TEXT, -- if inviting non-user
  role_id UUID REFERENCES collab_roles(id), -- optional: invite for specific role
  invitation_token TEXT UNIQUE, -- for email invitations
  status TEXT CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  message TEXT, -- personal invitation message
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ
);
```

### 2. **Invitation API Endpoints**

Missing API routes:
- `POST /api/collab/projects/[id]/invite` - Send invitation
- `GET /api/collab/projects/[id]/invitations` - List project invitations
- `POST /api/collab/invitations/[id]/accept` - Accept invitation
- `POST /api/collab/invitations/[id]/decline` - Decline invitation
- `GET /api/collab/invitations/me` - Get my invitations
- `DELETE /api/collab/invitations/[id]` - Revoke invitation

### 3. **Invitation UI Components**

Missing UI components:
- Invite user modal/form
- Invitation list (for project owners)
- My invitations page (for invitees)
- Invitation notification badges
- Accept/decline invitation buttons
- Invitation email templates

### 4. **Access Control Logic**

Missing RLS policies:
```sql
-- Allow viewing invite_only projects if:
-- 1. You're the creator
-- 2. You have an accepted invitation
-- 3. You're a participant

CREATE POLICY "Allow viewing invited projects" ON collab_projects
  FOR SELECT USING (
    visibility = 'public' OR
    creator_id = auth.uid() OR
    id IN (
      SELECT project_id FROM collab_invitations
      WHERE invitee_id = auth.uid()
      AND status = 'accepted'
    ) OR
    id IN (
      SELECT project_id FROM collab_participants
      WHERE user_id = auth.uid()
    )
  );
```

### 5. **Notification System**

Missing notifications:
- Email: "You've been invited to [Project Name]"
- In-app: New invitation notification
- Email: "Your invitation was accepted/declined"
- In-app: Invitation response notification

---

## Current Behavior vs Expected Behavior:

### Scenario 1: Creating an "Invite Only" Project

**Current Behavior:**
1. ✅ User selects "Invite Only - By invitation only" in dropdown
2. ✅ Project is created with `visibility: 'invite_only'`
3. ❌ Project disappears from browse page (hardcoded to only show public)
4. ❌ No way to invite anyone
5. ❌ Project creator can't even view their own project

**Expected Behavior:**
1. ✅ User selects "Invite Only - By invitation only"
2. ✅ Project is created with `visibility: 'invite_only'`
3. ✅ User sees "Invite People" button
4. ✅ User can search for users by handle/name
5. ✅ User can send invitations with optional message
6. ✅ Invitees receive notification
7. ✅ Invitees can accept/decline
8. ✅ Project appears in "My Projects" and "Invited Projects" tabs

### Scenario 2: Viewing Projects

**Current Behavior:**
- ✅ Public projects: Visible to everyone
- ❌ Private projects: Not visible to anyone (including creator!)
- ❌ Invite-only projects: Not visible to anyone (including creator!)

**Expected Behavior:**
- ✅ Public projects: Visible to everyone
- ✅ Private projects: Only visible to creator and team members
- ✅ Invite-only projects: Visible to creator, invited users, and team members

---

## Recommendation:

### Option 1: **Remove the Feature Temporarily** ⚠️
Since it's not implemented, remove `private` and `invite_only` options from the UI to avoid user confusion. Only keep `public` for now.

**Changes needed:**
1. Update collaborate page dropdown to only show "Public"
2. Remove `private` and `invite_only` from database constraint (or keep for future)
3. Add a "Coming Soon" note about invitation features

### Option 2: **Implement the Feature Properly** ✅
Build the complete invitation system with all missing pieces:
1. Create `collab_invitations` table
2. Build invitation API endpoints
3. Create invitation UI components
4. Set up email notifications
5. Update RLS policies
6. Add "My Projects" and "Invitations" tabs

**Estimated effort**: 2-3 days for full implementation

---

## Quick Fix (Option 1):

### 1. Update Visibility Dropdown
**File**: `apps/web/app/collaborate/page.tsx` (or wherever project creation form is)

```typescript
// Remove these options temporarily:
// <SelectItem value="private">Private - Only invited users</SelectItem>
// <SelectItem value="invite_only">Invite Only - By invitation only</SelectItem>

// Keep only:
<SelectItem value="public">Public - Anyone can see and apply</SelectItem>
```

### 2. Update Database Default
Keep the database constraint as-is for future use, but default everything to `public` in the API.

### 3. Add "My Projects" View
Even for public projects, creators should be able to view their own projects:

```typescript
// Add a new API endpoint or filter:
GET /api/collab/projects/me  // Shows projects created by current user
```

---

## Conclusion:

**The "Invite Only" and "Private" visibility options are currently non-functional.** They appear in the UI dropdown but:
- Projects with these settings become invisible to everyone
- There's no way to send or manage invitations
- There's no way to view invited projects
- There's no notification system

**Recommendation**: Either remove the options from the UI (Option 1) or implement the full invitation system (Option 2). The current state creates a poor user experience where selecting "Invite Only" essentially makes the project disappear.

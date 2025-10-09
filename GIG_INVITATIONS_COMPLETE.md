# 🎯 Gig Invitations System - Complete Implementation

## ✅ What Was Built

### 1. Database Layer
- **`gig_invitations` table** with all necessary columns
- **Row Level Security (RLS)** policies for privacy
- **Automatic application creation** when invitation is accepted (via trigger)
- **Expiration handling** (7 days vs 30 for project invitations)
- **Unique constraint** to prevent duplicate invitations

### 2. API Endpoints
- **`POST /api/gigs/[id]/invitations`** - Send invitation
- **`GET /api/gigs/[id]/invitations`** - List gig's invitations (for gig owner)
- **`GET /api/gigs/invitations`** - Get user's received/sent invitations
- **`PATCH /api/gigs/[id]/invitations`** - Accept/Decline invitation

### 3. UI Components
- **`InviteToGigDialog`** - Select gig and send invitation with message
- **`PendingGigInvitationsCard`** - Dashboard card showing pending invitations
- **`UserProfileActionButtons`** - Added "Invite to Gig" button (shows only for TALENT profiles)

### 4. Hooks
- **`useGigInvitations`** - Fetch, accept, decline gig invitations

## 🎨 How It Works

### For Gig Owners (CONTRIBUTOR)
1. View talent profile (e.g., Sarah views James's profile)
2. Click "Invite to Gig" button (only visible if user is TALENT)
3. Select from active gigs (DRAFT or PUBLISHED)
4. Write optional personal message
5. Send invitation

### For Talent (Receiving Invitation)
1. See invitation on dashboard in "Gig Invitations" card
2. View gig details, inviter info, and message
3. Click "Accept & Apply" → Auto-creates application
4. Click "Decline" → Marks invitation as declined

## 🔒 Safety Features

✅ **Rate Limiting**: 20 invitations per minute
✅ **Privacy Respecting**: Checks `allow_collaboration_invites` setting
✅ **Role Validation**: Only CONTRIBUTORS can send, only TALENT can receive
✅ **Duplicate Prevention**: Can't invite same user twice to same gig
✅ **Already Applied Check**: Can't invite if user already applied
✅ **Auto-Expiration**: Invitations expire after 7 days

## 📊 Database Schema

```sql
CREATE TABLE gig_invitations (
  id UUID PRIMARY KEY,
  gig_id UUID REFERENCES gigs(id),
  inviter_id UUID REFERENCES users_profile(id),
  invitee_id UUID REFERENCES users_profile(id),
  message TEXT,
  status TEXT CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'cancelled')),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  UNIQUE(gig_id, invitee_id)
);
```

## 🔄 Automatic Application Creation

When a talent accepts an invitation, a database trigger automatically:
1. Creates an application record in the `applications` table
2. Sets status to 'PENDING'
3. Uses invitation message as application note
4. Updates `accepted_at` timestamp

## 📱 UI Locations

### 1. Talent Profiles (`/users/[handle]`)
- "Invite to Gig" button appears next to "Contact" and "Invite to Project"
- Only visible to logged-in CONTRIBUTORS viewing TALENT profiles

### 2. Dashboard (`/dashboard`)
- "Gig Invitations" card appears for TALENT users
- Shows pending invitations with Accept/Decline actions
- Displays gig details, inviter info, and personal message

## 🧪 Testing Checklist

### As Sarah (CONTRIBUTOR):
- [ ] Navigate to James's profile (TALENT)
- [ ] Verify "Invite to Gig" button is visible
- [ ] Click "Invite to Gig"
- [ ] Verify Sarah's gigs appear in dropdown
- [ ] Select a gig
- [ ] Write personal message
- [ ] Send invitation
- [ ] Verify success message

### As James (TALENT):
- [ ] Navigate to dashboard
- [ ] Verify "Gig Invitations" card appears
- [ ] See invitation from Sarah
- [ ] View gig details and message
- [ ] Click "Accept & Apply"
- [ ] Verify invitation disappears from dashboard
- [ ] Check that application was auto-created in gig's applications list

### Database Verification:
- [ ] Check `gig_invitations` table for new record
- [ ] Verify status changes from 'pending' to 'accepted'
- [ ] Check `applications` table for auto-created application
- [ ] Verify foreign keys and timestamps

## 🎯 Key Differences: Gigs vs Projects

| Feature | Gig Invitations | Project Invitations |
|---------|----------------|---------------------|
| **Duration** | 7 days | 30 days |
| **Who can send** | CONTRIBUTOR | Anyone (project creator) |
| **Who receives** | TALENT only | Anyone |
| **On accept** | Auto-creates application | Adds to project team |
| **Role assignment** | N/A (they're applying) | Can assign specific role |
| **Visibility** | Dashboard card | Dashboard card |

## 📝 Files Created/Modified

### New Files:
- `supabase/migrations/20251009000000_create_gig_invitations.sql`
- `apps/web/app/api/gigs/[id]/invitations/route.ts`
- `apps/web/app/api/gigs/invitations/route.ts`
- `apps/web/lib/hooks/dashboard/useGigInvitations.ts`
- `apps/web/components/gigs/InviteToGigDialog.tsx`
- `apps/web/components/dashboard/PendingGigInvitationsCard.tsx`

### Modified Files:
- `apps/web/components/profile/UserProfileActionButtons.tsx` - Added "Invite to Gig" button
- `apps/web/app/users/[handle]/page.tsx` - Pass role_flags to action buttons
- `apps/web/app/dashboard/page.tsx` - Added gig invitations card

## 🚀 Next Steps

1. **Test the flow** with Sarah and James personas
2. **Add email notifications** when invitations are sent/accepted
3. **Add push notifications** for real-time alerts
4. **Create admin dashboard** to monitor invitation stats
5. **Add invitation analytics** (acceptance rate, etc.)

## 💡 Future Enhancements

- [ ] Batch invitations (invite multiple talents at once)
- [ ] Invitation templates (save common messages)
- [ ] Remind feature (resend expired invitations)
- [ ] Invitation history view
- [ ] Smart matching (suggest talents to invite based on gig requirements)


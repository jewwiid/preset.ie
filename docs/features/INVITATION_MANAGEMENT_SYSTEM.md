# Invitation Management System - Complete Documentation

## 📋 Overview

This document explains how invitation management works for both **Gig Invitations** and **Collaboration Invitations**, covering both the sender and receiver perspectives.

---

## 🎯 Gig Invitation System

### Flow Example: Sarah invites James to a Gig

#### **Step 1: Sarah Sends Invitation**
- **Location**: James's talent profile page
- **Component**: `InviteToGigDialog.tsx`
- **Action**: Sarah clicks "Invite to Apply" button on James's profile
- **Dialog shows**:
  - Dropdown to select which gig to invite James to
  - Already invited gigs show "✓ Already Invited" badge and are disabled
  - Gigs with passed deadlines show "⚠️ Deadline Passed" badge and are disabled
  - Personal message field (optional)

#### **Step 2: Invitation is Sent**
- **API**: `POST /api/gigs/[id]/invitations`
- **Database**: Record created in `gig_invitations` table
- **Validation**:
  - ✅ User can only invite TALENT users
  - ✅ Checks if talent allows gig invitations (`allow_gig_invites`)
  - ✅ Prevents duplicate invitations (409 Conflict)
  - ✅ Checks if application deadline has passed
  - ✅ Only gig owners can send invitations
- **Invitation expires**: 30 days by default

#### **Step 3: James Receives Invitation**
- **Location**: James's Dashboard
- **Component**: `PendingGigInvitationsCard.tsx`
- **Shows**:
  - Who invited him (Sarah's name, avatar)
  - Gig details (title, location, date, compensation)
  - Personal message from Sarah
  - Time until expiration
  - Two action buttons:
    - **"Accept & Apply"** - Redirects to gig application
    - **"Decline"** - Dismisses invitation

#### **Step 4: James Responds**
- **Accept**: `PATCH /api/gigs/[gigId]/invitations/[invitationId]` with `action: 'accept'`
  - Status changes to `'accepted'`
  - James is redirected to apply for the gig
- **Decline**: `PATCH /api/gigs/[gigId]/invitations/[invitationId]` with `action: 'decline'`
  - Status changes to `'declined'`
  - Invitation removed from dashboard

#### **Step 5: Sarah Tracks Invitations** ✅ NEW
- **Location**: Gig detail page or dedicated invitations section
- **Component**: `SentGigInvitationsCard.tsx` (newly created)
- **Shows for each invitation**:
  - Invitee's name, avatar, primary skill
  - Status badge:
    - ⏳ **Pending** (yellow) - Waiting for response
    - ✅ **Accepted** (green) - Invitation accepted
    - ❌ **Declined** (red) - Invitation declined
    - ⏰ **Expired** (gray) - Invitation expired
  - Personal message sent
  - Date sent
  - Expiration countdown
  - Actions:
    - **"View Profile"** button for accepted invitations
    - **"Waiting for response"** badge for pending invitations

---

## 🤝 Collaboration Invitation System

### Flow Example: Creator invites Member to a Project

#### **Step 1: Creator Sends Invitation**
- **Location**: Project management page or user profile
- **Component**: Similar to gig invitations (can be triggered from profile)
- **Dialog shows**:
  - Optional role assignment
  - Personal message field
  - Option to invite by user ID or email
- **API**: `POST /api/collab/projects/[id]/invitations`

#### **Step 2: Invitation is Sent**
- **Database**: Record created in `collab_invitations` table
- **Validation**:
  - ✅ Only project creators can send invitations
  - ✅ Checks if user allows collaboration invites (`allow_collaboration_invites`)
  - ✅ Prevents duplicate invitations (409 Conflict)
  - ✅ Validates role exists (if provided)
  - ✅ Supports email invitations for non-registered users
- **Invitation expires**: Configurable (default 30 days)

#### **Step 3: Member Receives Invitation**
- **Location**: Member's Dashboard
- **Component**: `PendingInvitationsCard.tsx` (collaboration-specific)
- **Shows**:
  - Who invited them
  - Project details
  - Role they're invited for (if specified)
  - Personal message
  - Expiration date
  - Two action buttons:
    - **"Accept"** - Joins the project
    - **"Decline"** - Dismisses invitation

#### **Step 4: Member Responds**
- **Accept**: `PATCH /api/collab/invitations/[id]` with `action: 'accept'`
  - Status changes to `'accepted'`
  - Member is added to project
- **Decline**: `PATCH /api/collab/invitations/[id]` with `action: 'decline'`
  - Status changes to `'declined'`
  - Invitation removed from dashboard

#### **Step 5: Creator Tracks Invitations** ✅ NEW
- **Location**: Project detail page
- **Component**: `SentCollabInvitationsCard.tsx` (newly created)
- **Shows for each invitation**:
  - Invitee's name and avatar (or email if not registered)
  - Role they were invited for
  - Status badge (same as gigs)
  - Personal message sent
  - Date sent and expiration
  - Special indicators:
    - **"Email invitation (user not registered)"** for email invites
    - **"View Profile"** button for accepted invitations

---

## 📊 Invitation Status Flow

```
PENDING ──┬──> ACCEPTED (User accepts invitation)
          │
          ├──> DECLINED (User declines invitation)
          │
          └──> EXPIRED (30 days pass without response)
```

---

## 🗄️ Database Schema

### Gig Invitations Table: `gig_invitations`
```sql
CREATE TABLE gig_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gig_id UUID NOT NULL REFERENCES gigs(id),
  inviter_id UUID NOT NULL REFERENCES users_profile(id),
  invitee_id UUID NOT NULL REFERENCES users_profile(id),
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  responded_at TIMESTAMPTZ,
  
  CONSTRAINT unique_pending_gig_invitation 
    UNIQUE(gig_id, invitee_id, status) 
    WHERE status = 'pending'
);
```

### Collaboration Invitations Table: `collab_invitations`
```sql
CREATE TABLE collab_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES collab_projects(id),
  inviter_id UUID NOT NULL REFERENCES users_profile(id),
  invitee_id UUID REFERENCES users_profile(id),
  invitee_email TEXT,
  role_id UUID REFERENCES collab_roles(id),
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  responded_at TIMESTAMPTZ,
  
  CHECK (invitee_id IS NOT NULL OR invitee_email IS NOT NULL),
  
  CONSTRAINT unique_pending_collab_invitation 
    UNIQUE(project_id, invitee_id, status) 
    WHERE status = 'pending' AND invitee_id IS NOT NULL
);
```

---

## 🔒 Privacy Settings

### User Privacy Controls
Both invitation types respect user privacy settings:

1. **Gig Invitations**: `users_profile.allow_gig_invites`
   - Default: `true`
   - When `false`: API returns 403 error with message

2. **Collaboration Invitations**: `users_profile.allow_collaboration_invites`
   - Default: `true`
   - When `false`: API returns 403 error with message

---

## 🎨 UI Components Summary

### Receiver-Side (People Being Invited)
| Component | Purpose | Where Shown |
|-----------|---------|-------------|
| `PendingGigInvitationsCard` | Shows gig invitations received | Dashboard (Talent only) |
| `PendingInvitationsCard` | Shows collaboration invitations received | Dashboard (All users) |
| `InvitationsList` | Full list view of collaboration invitations | Dedicated page |

### Sender-Side (People Sending Invitations) ✅ NEW
| Component | Purpose | Where Shown |
|-----------|---------|-------------|
| `InviteToGigDialog` | Send gig invitations | Talent profile pages |
| `SentGigInvitationsCard` | Track sent gig invitations | Gig detail page |
| `SentCollabInvitationsCard` | Track sent collaboration invitations | Project detail page |

---

## 📍 Where to Integrate New Components

### For Gig Invitations:
Add `SentGigInvitationsCard` to:
- **`apps/web/app/gigs/[id]/page.tsx`** - Gig detail page (owner view)
- **`apps/web/app/gigs/my-gigs/page.tsx`** - My gigs list (show invitation count)

```tsx
import { SentGigInvitationsCard } from '@/components/gigs/SentGigInvitationsCard'

// In the gig detail page (only show if user is owner)
{isOwner && (
  <SentGigInvitationsCard gigId={gigId} />
)}
```

### For Collaboration Invitations:
Add `SentCollabInvitationsCard` to:
- **`apps/web/app/collaborate/projects/[id]/page.tsx`** - Project detail page (creator view)

```tsx
import { SentCollabInvitationsCard } from '@/components/collaborate/SentCollabInvitationsCard'

// In the project detail page (only show if user is creator)
{isCreator && (
  <SentCollabInvitationsCard projectId={projectId} />
)}
```

---

## 🚀 API Endpoints Reference

### Gig Invitations
```
GET    /api/gigs/[id]/invitations              # List invitations for a gig (owner only)
GET    /api/gigs/[id]/invitations?invitee_id=  # Filter by invitee
POST   /api/gigs/[id]/invitations              # Send invitation (owner only)
PATCH  /api/gigs/[id]/invitations/[invId]      # Accept/decline invitation
```

### Collaboration Invitations
```
GET    /api/collab/invitations                 # List received invitations (current user)
GET    /api/collab/invitations?status=pending  # Filter by status
GET    /api/collab/projects/[id]/invitations   # List sent invitations (creator only)
POST   /api/collab/projects/[id]/invitations   # Send invitation (creator only)
PATCH  /api/collab/invitations/[id]            # Accept/decline invitation
```

---

## ✨ Key Features

### Duplicate Prevention
- ✅ System checks for existing pending invitations
- ✅ Returns 409 Conflict with clear message
- ✅ UI shows "Already Invited" badge and disables selection

### Deadline Validation (Gigs Only)
- ✅ Cannot invite to gigs with passed application deadlines
- ✅ Shows "⚠️ Deadline Passed" badge
- ✅ Server-side validation prevents API-level bypasses

### Expiration Handling
- ✅ Invitations expire after set period (default 30 days)
- ✅ Clear countdown display ("Expires in X days")
- ✅ Expired invitations are visually distinguished

### Status Tracking
- ✅ Real-time status updates
- ✅ Color-coded badges for quick scanning
- ✅ Detailed timeline information

---

## 🎯 Benefits of Sender-Side Management

### For Gig Creators:
1. **Visibility**: See all talent they've invited
2. **Status Tracking**: Know who has accepted/declined
3. **Follow-up**: Easy access to view profiles of accepted invitees
4. **Accountability**: Track invitation history

### For Project Creators:
1. **Team Building**: Monitor collaboration invitations
2. **Role Management**: See which roles have pending invitations
3. **Email Tracking**: Track invitations sent to non-registered users
4. **Response Rates**: Understand invitation acceptance patterns

---

## 🔮 Future Enhancements

### Potential Features:
- 📧 **Email Notifications**: Notify invitees via email
- 🔔 **Real-time Updates**: WebSocket notifications for instant updates
- 📊 **Analytics**: Invitation response rates and timing
- ♻️ **Resend**: Option to resend expired invitations
- 📝 **Bulk Invitations**: Invite multiple users at once
- 🗑️ **Cancel**: Allow senders to cancel pending invitations
- 💬 **Conversation**: Start a message thread from invitation

---

## 🎉 Summary

Both invitation systems now have **complete sender and receiver management**:

✅ **Gig Invitations**: 
- Receivers: Dashboard card showing received invitations
- Senders: New card showing sent invitations with status tracking

✅ **Collaboration Invitations**:
- Receivers: Dashboard card and dedicated page for received invitations
- Senders: New card showing sent invitations with status tracking

This creates a **complete feedback loop** where both parties can track the invitation lifecycle from start to finish! 🚀


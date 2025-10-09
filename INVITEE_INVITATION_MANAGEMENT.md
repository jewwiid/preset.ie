# Invitee Invitation Management - Complete Documentation ✅

## 📋 Overview

This document explains where and how **invitees** (people receiving invitations) can view and manage their invitations for both **Gigs** and **Collaborations**.

---

## ✅ What Exists for Invitees

### 1️⃣ Dashboard Quick View
**Location**: `/dashboard`

#### For Gig Invitations (Talent Users)
**Component**: `PendingGigInvitationsCard`
- Shows up to 3 most recent gig invitations
- Displays:
  - Who invited them (name, avatar)
  - Gig details (title, location, date, compensation)
  - Personal message
  - Expiration countdown
- Actions:
  - ✅ **Accept & Apply** - Redirects to gig page
  - ❌ **Decline** - Removes invitation
- Link to full list: **"View All Gig Invitations"**

#### For Collaboration Invitations (All Users)
**Component**: `PendingInvitationsCard`
- Shows up to 3 most recent collaboration invitations
- Displays:
  - Who invited them
  - Project details
  - Role (if assigned)
  - Personal message
  - Expiration countdown
- Actions:
  - ✅ **Accept** - Joins project
  - ❌ **Decline** - Removes invitation
- Link to full list: **"View All Invitations"**

---

### 2️⃣ Dedicated Invitations Page ✨ NEW
**Location**: `/dashboard/invitations`

A comprehensive page to manage **ALL** invitations in one place!

#### Features:

**📑 Tabbed Interface:**
- **Gig Invitations** tab (with count badge)
- **Collaborations** tab (with count badge)
- URL parameter support: `?type=gigs` or `?type=collabs`

**🎯 For Each Invitation:**

##### Gig Invitations Show:
- Inviter info (avatar, name, link to profile)
- Date sent & expiration countdown
- Gig title (clickable link to gig page)
- Location, start date, compensation type
- Personal message (if provided)
- Status indicators (expired invitations are grayed out)
- Action buttons:
  - ✅ **Accept & Apply** - Redirects to gig application
  - ❌ **Decline** - Removes invitation
  - Buttons disabled if expired

##### Collaboration Invitations Show:
- Inviter info (avatar, name, link to profile)
- Date sent & expiration countdown
- Project title (clickable link to project page)
- Role badge (if assigned)
- Project description (truncated)
- Location and start date
- Personal message (if provided)
- Status indicators (expired invitations are grayed out)
- Action buttons:
  - ✅ **Accept** - Joins project, redirects to project page
  - ❌ **Decline** - Removes invitation
  - Buttons disabled if expired

**🔄 Loading & Empty States:**
- Loading spinner while fetching
- Empty state with helpful message and CTA button
- Error handling with retry option

---

## 📊 Complete Invitee Experience Flow

```
┌─────────────────────────────────────────────────────────┐
│            INVITEE INVITATION MANAGEMENT FLOW           │
└─────────────────────────────────────────────────────────┘

STEP 1: Receive Invitation
━━━━━━━━━━━━━━━━━━━━━━━━━━
Creator sends invitation
         │
         ▼
Database: gig_invitations / collab_invitations table
         │
         ▼
✉️ Invitee receives notification (future: email/push)


STEP 2: View in Dashboard (Quick Access)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Invitee logs in
         │
         ▼
    Dashboard
         │
         ├─ PendingGigInvitationsCard
         │  └─ Shows up to 3 recent gig invitations
         │     ├─ Accept & Apply
         │     ├─ Decline
         │     └─ "View All Gig Invitations" →
         │
         └─ PendingInvitationsCard
            └─ Shows up to 3 recent collab invitations
               ├─ Accept
               ├─ Decline
               └─ "View All Invitations" →


STEP 3: Manage All Invitations (Full View) ✨ NEW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Click "View All ..." button
         │
         ▼
/dashboard/invitations
         │
         ├─ [Gig Invitations Tab] [Collaborations Tab]
         │
         ├─ Gig Invitations:
         │  └─ Full list of ALL gig invitations
         │     ├─ Pending invitations (actionable)
         │     ├─ Expired invitations (grayed out)
         │     └─ Accept/Decline actions
         │
         └─ Collaborations:
            └─ Full list of ALL collab invitations
               ├─ Pending invitations (actionable)
               ├─ Expired invitations (grayed out)
               └─ Accept/Decline actions


STEP 4: Take Action
━━━━━━━━━━━━━━━━━━━
Invitee clicks Accept or Decline
         │
         ├─ ACCEPT:
         │  ├─ API updates status to 'accepted'
         │  ├─ Invitation removed from list
         │  └─ Redirect:
         │     ├─ Gigs → /gigs/[id] (to apply)
         │     └─ Collabs → /collaborate/projects/[id]
         │
         └─ DECLINE:
            ├─ API updates status to 'declined'
            └─ Invitation removed from list


STEP 5: Automatic Expiration
━━━━━━━━━━━━━━━━━━━━━━━━━━━
After 30 days without response
         │
         ▼
Status → 'expired'
         │
         ▼
Invitation grayed out, actions disabled
```

---

## 🎨 UI Design

### Dashboard Cards (Preview)
```
┌──────────────────────────────────────────────┐
│ 🎬 Gig Invitations               [3]         │
│ You've been invited to apply for these gigs  │
├──────────────────────────────────────────────┤
│                                              │
│ ┌──────────────────────────────────────────┐│
│ │ [👤] Sarah Chen invited you to apply     ││
│ │ ⏰ Expires in 30 days                     ││
│ │                                           ││
│ │ Urban Fashion — Golden Hour Editorial    ││
│ │ 📍 Manchester  📅 Oct 15  💰 Paid        ││
│ │                                           ││
│ │ 💬 "Hi James! I think you'd be perfect..." ││
│ │                                           ││
│ │ [✅ Accept & Apply]  [❌ Decline]         ││
│ └──────────────────────────────────────────┘│
│                                              │
│ [2 more invitations...]                      │
│                                              │
│ ────────────────────────────────────────────│
│        [View All Gig Invitations →]          │
└──────────────────────────────────────────────┘
```

### Full Invitations Page
```
┌──────────────────────────────────────────────────────────┐
│ ← Back to Dashboard                                      │
│                                                          │
│ My Invitations                                           │
│ Manage all your gig and collaboration invitations       │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ [🎬 Gig Invitations (3)] [👥 Collaborations (1)]       │
│ ═══════════════════                                      │
│                                                          │
│ ┌────────────────────────────────────────────────────┐  │
│ │ [👤] Sarah Chen                                     │  │
│ │ invited you to apply                                │  │
│ │ 📅 Oct 9, 2025  •  ⏰ Expires in 30 days           │  │
│ │                                                     │  │
│ │ Urban Fashion — Golden Hour Editorial              │  │
│ │ 📍 Manchester  📅 Oct 15, 2025  💰 Paid           │  │
│ │                                                     │  │
│ │ 💬 "Hi James! I think you'd be perfect for this    │  │
│ │     Urban Fashion shoot. Interested?"              │  │
│ │                                                     │  │
│ │ ────────────────────────────────────────────       │  │
│ │ [✅ Accept & Apply]  [❌ Decline]                  │  │
│ └────────────────────────────────────────────────────┘  │
│                                                          │
│ [More invitations...]                                    │
└──────────────────────────────────────────────────────────┘
```

---

## 📁 Files Created/Modified

### New Files:
1. **`apps/web/app/dashboard/invitations/page.tsx`** ✨ NEW
   - Full invitation management page
   - Tabbed interface for gigs and collabs
   - Complete CRUD operations
   - URL parameter support
   - Empty and loading states

### Existing Files (Already Working):
2. **`apps/web/components/dashboard/PendingGigInvitationsCard.tsx`**
   - Dashboard preview for gig invitations
   - Links to full page

3. **`apps/web/components/dashboard/PendingInvitationsCard.tsx`**
   - Dashboard preview for collab invitations
   - Links to full page

4. **`apps/web/components/collaborate/InvitationsList.tsx`**
   - Alternative collab invitations view
   - Already existed

---

## 🔌 API Endpoints Used

### For Gig Invitations:
```
GET /api/gigs/invitations?type=received&status=pending
```
Returns: All pending gig invitations for current user

```
PATCH /api/gigs/[gigId]/invitations/[invitationId]
Body: { action: 'accept' | 'decline' }
```
Updates invitation status

### For Collaboration Invitations:
```
GET /api/collab/invitations?status=pending
```
Returns: All pending collab invitations for current user

```
PATCH /api/collab/invitations/[invitationId]
Body: { action: 'accept' | 'decline' }
```
Updates invitation status

---

## 🎯 Access Points Summary

### Where Invitees Can Manage Invitations:

| Location | What's Shown | Type | Actions |
|----------|-------------|------|---------|
| **Dashboard** | Preview (3 most recent) | Gigs & Collabs | Accept, Decline, View All |
| **/dashboard/invitations** | Complete list | Gigs & Collabs | Accept, Decline |
| **/dashboard/invitations?type=gigs** | Gig invitations only | Gigs | Accept & Apply, Decline |
| **/dashboard/invitations?type=collabs** | Collab invitations only | Collabs | Accept, Decline |

---

## ✨ Key Features

### 1. **Centralized Management**
- ✅ One place to see ALL invitations
- ✅ Separate tabs for different types
- ✅ Unified interface

### 2. **Complete Information**
- ✅ Who invited them
- ✅ When invitation was sent
- ✅ Expiration countdown
- ✅ All relevant details (location, date, compensation, role, etc.)
- ✅ Personal messages from inviters

### 3. **Easy Actions**
- ✅ One-click accept or decline
- ✅ Automatic redirect after acceptance
- ✅ Real-time status updates
- ✅ Disabled actions for expired invitations

### 4. **Smart Navigation**
- ✅ Direct links to relevant pages (gigs, projects, profiles)
- ✅ Back to dashboard button
- ✅ URL parameters for deep linking

### 5. **User-Friendly Design**
- ✅ Loading states with spinners
- ✅ Empty states with helpful messages
- ✅ Error handling with retry options
- ✅ Expired invitations visually distinguished
- ✅ Count badges on tabs

---

## 🔄 Invitation Lifecycle from Invitee Perspective

```
┌─────────────────────────────────────────────┐
│         INVITEE'S VIEW OF INVITATION        │
└─────────────────────────────────────────────┘

1. NOTIFICATION (Future)
   ├─ Email notification
   ├─ Push notification
   └─ In-app notification badge

2. DASHBOARD PREVIEW
   ├─ See up to 3 recent invitations
   ├─ Quick Accept/Decline
   └─ Link to full list

3. FULL INVITATIONS PAGE ✨ NEW
   ├─ See ALL invitations
   ├─ Filter by type (tabs)
   ├─ Full details displayed
   └─ Take action (Accept/Decline)

4. ACTION TAKEN
   ├─ Accept → Redirect to gig/project
   ├─ Decline → Invitation removed
   └─ Expired → Grayed out, no actions

5. FOLLOW-UP
   ├─ If accepted: Apply for gig or join project
   └─ If declined: Invitation history cleared
```

---

## 🎉 Benefits for Invitees

### **Before:**
- ❌ Invitations scattered on dashboard only
- ❌ Limited to 3 most recent
- ❌ No way to see all past invitations
- ❌ No central management

### **After:**
- ✅ Dashboard preview for quick access
- ✅ Dedicated page for ALL invitations
- ✅ Organized by type (tabs)
- ✅ Complete information at a glance
- ✅ Easy Accept/Decline actions
- ✅ Clear expiration indicators
- ✅ Professional, polished experience

---

## 🔮 Future Enhancements

Potential additions (not yet implemented):
- 📧 **Email Notifications**: Get notified immediately when invited
- 🔔 **Push Notifications**: Real-time alerts
- 📊 **Invitation History**: See accepted/declined invitations
- 🔍 **Search & Filter**: Search by inviter, date, etc.
- 📅 **Calendar Integration**: Add gig dates to calendar
- 💬 **Quick Reply**: Respond to inviter with message
- ⏰ **Reminder**: Get reminded before invitation expires
- 📱 **Mobile Optimizations**: Enhanced mobile experience

---

## 🎊 Summary

**Question**: "What about for the invitee? Do we have somewhere they can manage the invitations for collabs and gigs?"

**Answer**: YES! Invitees have **TWO places** to manage invitations:

1. **Dashboard** (Quick View)
   - Preview of 3 most recent invitations
   - Quick Accept/Decline actions
   - Links to full page

2. **`/dashboard/invitations`** (Complete View) ✨ **NEW**
   - Dedicated page for ALL invitations
   - Tabbed interface (Gigs | Collaborations)
   - Full details and actions
   - URL parameter support for deep linking

### Complete Features:
- ✅ View all gig invitations
- ✅ View all collaboration invitations
- ✅ See who invited them
- ✅ View expiration countdowns
- ✅ Read personal messages
- ✅ Accept or decline invitations
- ✅ Automatic redirects after acceptance
- ✅ Clear visual indicators for expired invitations
- ✅ Loading states and error handling
- ✅ Empty states with helpful CTAs

**Both senders AND receivers now have complete invitation management! 🚀**


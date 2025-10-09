# Invitation Flow - Visual Diagram

## 🎯 Complete Gig Invitation Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    GIG INVITATION COMPLETE FLOW                     │
└─────────────────────────────────────────────────────────────────────┘

STEP 1: SEND INVITATION
━━━━━━━━━━━━━━━━━━━━━━
Sarah (Gig Creator)              
    │
    │ Visits James's Profile
    │
    ▼
┌──────────────────────────┐
│ InviteToGigDialog        │
│ ┌────────────────────┐   │
│ │ Select Gig ▼       │   │
│ │ • Urban Fashion ✓  │   │ ← Shows which gigs available
│ │ • [Already Invited]│   │ ← Disabled if already invited
│ │ • [Deadline Passed]│   │ ← Disabled if deadline passed
│ ├────────────────────┤   │
│ │ Personal Message:  │   │
│ │ "Hi James! I think │   │
│ │ you'd be perfect..." │  │
│ └────────────────────┘   │
│ [Cancel] [Send Invitation]│
└──────────────────────────┘
    │
    │ Sends invitation
    ▼
┌──────────────────────────┐
│ API Validation           │
│ ✅ Is talent?            │
│ ✅ Allows invites?       │
│ ✅ Not duplicate?        │
│ ✅ Deadline valid?       │
└──────────────────────────┘
    │
    │ Creates record in DB
    ▼
    📝 gig_invitations table


STEP 2: RECEIVE INVITATION
━━━━━━━━━━━━━━━━━━━━━━━━━
                                James (Talent)
                                    │
                                    │ Opens Dashboard
                                    ▼
                        ┌─────────────────────────┐
                        │ PendingGigInvitationsCard│
                        ├─────────────────────────┤
                        │ 🎬 Gig Invitations  [1] │
                        │                         │
                        │ ┌─────────────────────┐ │
                        │ │ [👤] Sarah Chen     │ │
                        │ │ invited you to apply│ │
                        │ │                     │ │
                        │ │ Urban Fashion Gig   │ │
                        │ │ 📍 Manchester       │ │
                        │ │ 📅 Oct 15, 2025     │ │
                        │ │ 💰 Paid             │ │
                        │ │                     │ │
                        │ │ 💬 "Hi James! I ... │ │
                        │ │                     │ │
                        │ │ ⏰ Expires in 30 days│ │
                        │ │                     │ │
                        │ │ [Accept & Apply]    │ │
                        │ │ [Decline]           │ │
                        │ └─────────────────────┘ │
                        └─────────────────────────┘


STEP 3: TRACK INVITATION ✅ NEW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Sarah (Gig Creator)
    │
    │ Opens Gig Detail Page
    ▼
┌─────────────────────────────────────┐
│ SentGigInvitationsCard ✨ NEW       │
├─────────────────────────────────────┤
│ 👥 Sent Invitations            [1]  │
│ Track invitations sent to talent    │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ [👤] James Murphy    ⏳ Pending  │ │
│ │      Actor                       │ │
│ │                                  │ │
│ │ 💬 "Hi James! I think you'd be   │ │
│ │     perfect for this Urban..."   │ │
│ │                                  │ │
│ │ 📅 Sent Oct 9, 2025              │ │
│ │ ⏰ Expires in 30 days             │ │
│ │                                  │ │
│ │        [Waiting for response]    │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘


STEP 4: RESPOND TO INVITATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                            James clicks button
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
              [Accept & Apply]                 [Decline]
                    │                               │
                    ▼                               ▼
            Status: 'accepted'              Status: 'declined'
            Redirect to apply               Remove from dashboard
                    │                               │
                    └───────────┬───────────────────┘
                                │
                                │ Update database
                                ▼
                        gig_invitations table
                        (status updated)


STEP 5: SEE STATUS UPDATE ✅
━━━━━━━━━━━━━━━━━━━━━━━━━━━
Sarah (Gig Creator)
    │
    │ Refreshes Gig Detail Page
    ▼
┌─────────────────────────────────────┐
│ SentGigInvitationsCard              │
├─────────────────────────────────────┤
│ 👥 Sent Invitations            [1]  │
│                                     │
│ IF ACCEPTED:                        │
│ ┌─────────────────────────────────┐ │
│ │ [👤] James Murphy    ✅ Accepted │ │
│ │      Actor                       │ │
│ │                                  │ │
│ │ 💬 "Hi James! I think you'd be   │ │
│ │     perfect for this Urban..."   │ │
│ │                                  │ │
│ │ 📅 Sent Oct 9, 2025              │ │
│ │ ✅ Accepted Oct 9, 2025          │ │
│ │                                  │ │
│ │ [👁️ View Profile]                │ │
│ └─────────────────────────────────┘ │
│                                     │
│ IF DECLINED:                        │
│ ┌─────────────────────────────────┐ │
│ │ [👤] James Murphy    ❌ Declined │ │
│ │      Actor                       │ │
│ │                                  │ │
│ │ 💬 "Hi James! I think you'd be   │ │
│ │     perfect for this Urban..."   │ │
│ │                                  │ │
│ │ 📅 Sent Oct 9, 2025              │ │
│ │ ❌ Declined Oct 9, 2025          │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

---

## 🤝 Complete Collaboration Invitation Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│               COLLABORATION INVITATION COMPLETE FLOW                │
└─────────────────────────────────────────────────────────────────────┘

STEP 1-2: Send & Receive (Similar to Gigs)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Creator → Invitation → Member
(Same flow as gigs, but for projects)


STEP 3: TRACK INVITATION ✅ NEW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Creator (Project Owner)
    │
    │ Opens Project Detail Page
    ▼
┌─────────────────────────────────────┐
│ SentCollabInvitationsCard ✨ NEW    │
├─────────────────────────────────────┤
│ 👥 Sent Invitations            [2]  │
│ Track invitations for this project  │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ [👤] Alice Smith     ⏳ Pending  │ │
│ │      Invited as Photographer     │ │
│ │                                  │ │
│ │ 💬 "Would love to have you..."   │ │
│ │                                  │ │
│ │ 📅 Sent Oct 8  ⏰ Expires in 29d │ │
│ │        [Waiting for response]    │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ [📧] bob@example.com ⏳ Pending  │ │
│ │      Invited as Videographer     │ │
│ │      ℹ️ Email invitation (user   │ │
│ │         not registered)          │ │
│ │                                  │ │
│ │ 💬 "Hey Bob, check out..."       │ │
│ │                                  │ │
│ │ 📅 Sent Oct 7  ⏰ Expires in 28d │ │
│ │        [Waiting for response]    │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

---

## 📊 Status Badge Legend

```
┌─────────────────────────────────────────────────┐
│              INVITATION STATUS BADGES           │
├─────────────────────────────────────────────────┤
│                                                 │
│  ⏳ Pending   │ Yellow  │ Waiting for response  │
│  ✅ Accepted  │ Green   │ Invitation accepted   │
│  ❌ Declined  │ Red     │ Invitation declined   │
│  ⏰ Expired   │ Gray    │ 30 days passed        │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 🔄 State Transitions

```
         ┌──────────────┐
         │   Created    │
         │  (Initial)   │
         └───────┬──────┘
                 │
                 ▼
         ┌──────────────┐
    ┌───▶│   PENDING    │◀───┐
    │    └──────┬───────┘    │
    │           │             │
    │    ┌──────┴──────┐     │
    │    │             │     │
    │    │             │     │
    ▼    ▼             ▼     │
┌────────────┐    ┌────────────┐
│  ACCEPTED  │    │  DECLINED  │
└────────────┘    └────────────┘
                       │
                       │ (30 days)
                       ▼
                  ┌──────────┐
                  │ EXPIRED  │
                  └──────────┘
```

---

## 🎨 UI Component Hierarchy

```
Dashboard (Receiver View)
├── PendingGigInvitationsCard
│   └── Show received gig invitations
│       ├── Inviter info
│       ├── Gig details
│       ├── Message
│       └── [Accept] [Decline]
│
└── PendingInvitationsCard
    └── Show received collab invitations
        ├── Inviter info
        ├── Project details
        ├── Role
        ├── Message
        └── [Accept] [Decline]


Gig Detail Page (Sender View)
└── SentGigInvitationsCard ✨ NEW
    └── Track sent gig invitations
        ├── Invitee info
        ├── Status badge
        ├── Message preview
        ├── Timeline
        └── Actions based on status


Project Detail Page (Sender View)
└── SentCollabInvitationsCard ✨ NEW
    └── Track sent collab invitations
        ├── Invitee/Email info
        ├── Role
        ├── Status badge
        ├── Message preview
        ├── Timeline
        └── Actions based on status
```

---

## ✅ Complete Feedback Loop

```
        Sender                          Receiver
          │                                │
          │  1. SEND INVITATION           │
          ├───────────────────────────────>│
          │                                │
          │  2. TRACK STATUS              │
          │  ⏳ Pending...                 │
          │                                │
          │                           3. SEES INVITATION
          │                           on dashboard
          │                                │
          │  4. STATUS UPDATE             │
          │<───────────────────────────────┤
          │  ✅ Accepted / ❌ Declined     │
          │                                │
          │  5. VIEW TRACKING CARD        │
          │  See response                  │
          │                                │
          ▼                                ▼
     [Complete]                       [Complete]
```

---

## 🎉 Summary

### Before:
```
Sender → [ ? ] → Receiver
         (black box)
```

### After:
```
Sender → [✅ Full Visibility] ← Receiver
         • Status tracking
         • Timeline
         • Actions
         • Complete feedback
```

**Now both sides have complete visibility and control! 🚀**


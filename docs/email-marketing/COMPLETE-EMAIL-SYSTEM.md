# Complete Email System Documentation

**Last Updated:** October 10, 2025  
**Status:** Production Ready ✅  
**Version:** 2.0

---

## 📧 Overview

The Preset.ie platform features a comprehensive, user-centric email system built on **Plunk** for transactional emails, event tracking, and contact management. All emails are designed to be:

- **Brand-consistent** with Preset.ie theme colors
- **Emoji-free** (professional design)
- **Mobile-responsive**
- **User-controllable** (preference management)
- **Compliant** (GDPR, CAN-SPAM)

---

## 🏗️ Architecture

### Core Components

```
apps/web/lib/services/emails/
├── events/                     # Email event classes
│   ├── onboarding.events.ts    # Welcome, verification, password reset
│   ├── verification.events.ts  # Custom email verification flow
│   ├── gigs.events.ts          # Gig lifecycle emails
│   ├── applications.events.ts  # Application lifecycle emails
│   ├── messaging.events.ts     # Message notifications
│   ├── showcases.events.ts     # Showcase approvals & publishing
│   ├── reviews.events.ts       # Review requests & receipts
│   ├── credits.events.ts       # Credits & billing
│   ├── marketplace.events.ts   # Preset sales & purchases
│   └── engagement.events.ts    # Digests, tips, re-engagement
│
├── templates/                  # HTML email templates
│   ├── shared.templates.ts     # Common layout & components
│   ├── onboarding.templates.ts
│   ├── verification.templates.ts
│   ├── gigs.templates.ts
│   ├── applications.templates.ts
│   ├── messaging.templates.ts
│   ├── showcases.templates.ts
│   ├── reviews.templates.ts
│   ├── credits.templates.ts
│   ├── marketplace.templates.ts
│   ├── engagement.templates.ts
│   ├── subscriptions.templates.ts
│   └── index.ts                # Central export
│
└── email-preference-checker.service.ts  # Preference validation
```

### API Endpoints

```
apps/web/app/api/
├── emails/
│   ├── welcome/route.ts
│   ├── welcome-verified/route.ts
│   ├── verify-email/route.ts
│   ├── gig-published/route.ts
│   ├── new-application/route.ts
│   └── application-status/route.ts
│
└── email-preferences/
    ├── update/route.ts
    └── unsubscribe-all/route.ts
```

### Database Triggers

```
supabase/migrations/
├── 20251009210000_fix_email_triggers.sql
├── 20251009220000_fix_base_url.sql
├── 20251009230000_fix_call_email_api_logging.sql
└── 20251009250000_verification_flow_final.sql
```

---

## 📬 Email Types

### 1. **Authentication & Onboarding** (CRITICAL ✅)

All authentication emails are **always sent** regardless of user preferences for security reasons.

| Email | Trigger | Critical | Template |
|-------|---------|----------|----------|
| **Welcome Email** | Profile creation after verification | ✅ | `getWelcomeAfterVerificationTemplate()` |
| **Email Verification** | User signup | ✅ | `getVerifyEmailTemplate()` |
| **Password Reset** | User requests password reset | ✅ | `getPasswordResetTemplate()` |
| **Profile Completion Reminder** | Low profile completion % | ⚠️ Optional | `getProfileCompletionTemplate()` |

**Files:**
- Events: `apps/web/lib/services/emails/events/onboarding.events.ts`
- Templates: `apps/web/lib/services/emails/templates/onboarding.templates.ts`
- Verification: `apps/web/lib/services/emails/events/verification.events.ts`

---

### 2. **Gig Lifecycle** (OPTIONAL 📧)

Respects `gig_notifications` and `booking_notifications` preferences.

| Email | Trigger | Preference | Template |
|-------|---------|------------|----------|
| **Gig Published** | Contributor publishes gig | `gig` | `getGigPublishedTemplate()` |
| **New Application** | Talent applies to gig | `gig` | `getNewApplicationTemplate()` |
| **Application Milestone** | Reach 50%, 75%, 100% of max applicants | `gig` | `getApplicationMilestoneTemplate()` |
| **Deadline Approaching** | 24hrs before application deadline | `gig` | `getDeadlineApproachingTemplate()` |
| **Shoot Reminder** | Day before scheduled shoot | `booking` | `getShootReminderTemplate()` |

**Files:**
- Events: `apps/web/lib/services/emails/events/gigs.events.ts`
- Templates: `apps/web/lib/services/emails/templates/gigs.templates.ts`
- API: `apps/web/app/api/emails/gig-published/route.ts`

---

### 3. **Application Management** (MIXED ⚠️✅)

| Email | Trigger | Critical | Preference | Template |
|-------|---------|----------|------------|----------|
| **Application Submitted** | Talent applies | ❌ | `application` | `getApplicationSubmittedTemplate()` |
| **Application Shortlisted** | Contributor shortlists talent | ❌ | `application` | `getApplicationShortlistedTemplate()` |
| **Application Accepted** | Talent is booked | ✅ | Always sent | `getTalentBookingTemplate()` |
| **Application Declined** | Application rejected | ❌ | `application` | `getApplicationDeclinedTemplate()` |
| **Application Limit Warning** | Approaching monthly limit | ❌ | `application` | `getApplicationLimitWarningTemplate()` |
| **Application Limit Reached** | Monthly limit hit | ✅ | Always sent | `getApplicationLimitReachedTemplate()` |

**Files:**
- Events: `apps/web/lib/services/emails/events/applications.events.ts`
- Templates: `apps/web/lib/services/emails/templates/applications.templates.ts`
- API: `apps/web/app/api/emails/application-status/route.ts`

---

### 4. **Messaging** (OPTIONAL 📧)

Respects `message_notifications` preferences.

| Email | Trigger | Preference | Template |
|-------|---------|------------|----------|
| **New Message** | User receives a message | `message` | `getNewMessageTemplate()` |
| **Unread Digest** | Daily/weekly unread summary | `message` | `getUnreadMessagesDigestTemplate()` |
| **Thread Update** | Reply or status change | `message` | `getMessageThreadUpdateTemplate()` |

**Files:**
- Events: `apps/web/lib/services/emails/events/messaging.events.ts`
- Templates: `apps/web/lib/services/emails/templates/messaging.templates.ts`

---

### 5. **Showcases** (MIXED ⚠️✅)

| Email | Trigger | Critical | Preference | Template |
|-------|---------|----------|------------|----------|
| **Approval Request** | Collaborator submits showcase | ✅ | Always sent | `getShowcaseApprovalRequestTemplate()` |
| **Showcase Published** | Both users approve | ❌ | `system` | `getShowcasePublishedTemplate()` |
| **Showcase Featured** | Admin features showcase | ✅ | Always sent | `getShowcaseFeaturedTemplate()` |

**Files:**
- Events: `apps/web/lib/services/emails/events/showcases.events.ts`
- Templates: `apps/web/lib/services/emails/templates/showcases.templates.ts`

---

### 6. **Reviews** (MIXED ⚠️✅)

| Email | Trigger | Critical | Preference | Template |
|-------|---------|----------|------------|----------|
| **Review Request** | 3 days after gig completion | ❌ | `booking` | `getReviewRequestTemplate()` |
| **Review Received** | User receives a review | ✅ | Always sent | `getReviewReceivedTemplate()` |
| **Review Reminder** | 7 days after request if not reviewed | ❌ | `booking` | `getReviewReminderTemplate()` |

**Files:**
- Events: `apps/web/lib/services/emails/events/reviews.events.ts`
- Templates: `apps/web/lib/services/emails/templates/reviews.templates.ts`

---

### 7. **Credits & Billing** (CRITICAL ✅)

| Email | Trigger | Critical | Preference | Template |
|-------|---------|----------|------------|----------|
| **Credits Purchased** | User buys credits | ✅ | Always sent | `getCreditsPurchasedTemplate()` |
| **Credits Low** | Balance < 10 credits | ⚠️ | `system` | `getCreditsLowTemplate()` |
| **Credits Reset** | Monthly subscription reset | ❌ | `system` | `getCreditsResetTemplate()` |

**Files:**
- Events: `apps/web/lib/services/emails/events/credits.events.ts`
- Templates: `apps/web/lib/services/emails/templates/credits.templates.ts`

---

### 8. **Marketplace** (CRITICAL ✅)

| Email | Trigger | Critical | Template |
|-------|---------|----------|----------|
| **Preset Purchased** | User buys a preset | ✅ | `getPresetPurchasedTemplate()` |
| **Preset Sold** | Seller makes a sale | ✅ | `getPresetSoldTemplate()` |
| **Listing Approved** | Admin approves listing | ✅ | `getPresetListingApprovedTemplate()` |
| **Listing Rejected** | Admin rejects listing | ✅ | `getPresetListingRejectedTemplate()` |
| **Sales Milestone** | Reach 10, 50, 100+ sales | ❌ | `getSalesMilestoneTemplate()` |

**Files:**
- Events: `apps/web/lib/services/emails/events/marketplace.events.ts`
- Templates: `apps/web/lib/services/emails/templates/marketplace.templates.ts`

---

### 9. **Engagement & Marketing** (OPTIONAL 📧)

Respects `marketing_notifications` preferences.

| Email | Trigger | Preference | Template |
|-------|---------|------------|----------|
| **Weekly Digest** | Every Monday | `marketing` | `getWeeklyDigestTemplate()` |
| **Tuesday Tips** | Every Tuesday | `marketing` | `getTuesdayTipsTemplate()` |
| **Re-engagement** | Inactive for 30+ days | `marketing` | `getInactiveUserReengagementTemplate()` |
| **Milestone Achieved** | First gig, 10 applications, etc. | Always sent | `getMilestoneAchievedTemplate()` |

**Files:**
- Events: `apps/web/lib/services/emails/events/engagement.events.ts`
- Templates: `apps/web/lib/services/emails/templates/engagement.templates.ts`

---

### 10. **Collaborations & Projects** (MIXED ⚠️✅)

| Email | Trigger | Critical | Preference | Template |
|-------|---------|----------|------------|----------|
| **Gig Completed** | Gig marked as completed | ✅ | Always sent | `getGigCompletedTemplate()` |
| **Collaborator Invite** | Personal gig invitation | ❌ | `gig` | `getCollaboratorInviteTemplate()` |
| **Project Update** | Schedule/location/requirements change | ✅ | Always sent | `getProjectUpdateTemplate()` |
| **Collaboration Cancelled** | Gig cancelled | ✅ | Always sent | `getCollaborationCancelledTemplate()` |
| **Showcase Upload Reminder** | Reminder to upload showcase media | ❌ | `booking` | `getShowcaseUploadReminderTemplate()` |
| **Collaborator Media Uploaded** | Partner uploads showcase photos | ❌ | `booking` | `getCollaboratorMediaUploadedTemplate()` |

**Files:**
- Events: `apps/web/lib/services/emails/events/collaborations.events.ts`
- Templates: `apps/web/lib/services/emails/templates/collaborations.templates.ts`

---

### 11. **Subscription Management** (CRITICAL ✅)

| Email | Trigger | Critical | Template |
|-------|---------|----------|----------|
| **Subscription Updated** | Plan change | ✅ | `getSubscriptionUpdatedTemplate()` |
| **Subscription Expiring** | 7 days before renewal | ✅ | `getSubscriptionExpiringTemplate()` |
| **Payment Failed** | Billing issue | ✅ | `getPaymentFailedTemplate()` |
| **Payment Successful** | Subscription renewed | ✅ | `getPaymentSuccessfulTemplate()` |

**Files:**
- Templates: `apps/web/lib/services/emails/templates/subscriptions.templates.ts`

---

## 🎛️ Email Preferences System

### User Controls

Users can manage their email preferences in two ways:

1. **Account Settings** (`/settings/email-preferences`)
   - Master toggle for all emails
   - Category-specific toggles
   - Digest frequency control

2. **Email Links** (`/unsubscribe?email=...&userId=...`)
   - One-click unsubscribe (compliance)
   - Granular category management
   - Global unsubscribe option

### Preference Categories

| Category | Database Field | Description |
|----------|----------------|-------------|
| **Gigs** | `gig_notifications` | New gigs, deadlines, applications |
| **Applications** | `application_notifications` | Status changes, shortlists |
| **Messages** | `message_notifications` | New messages, unread digests |
| **Booking** | `booking_notifications` | Shoot reminders, approvals |
| **System** | `system_notifications` | Account, credits, security |
| **Marketing** | `marketing_notifications` | Tips, digests, promotions |

### Critical Emails (Always Sent)

The following emails are **always sent** regardless of preferences:

1. ✅ Email verification
2. ✅ Password reset
3. ✅ Welcome email (after verification)
4. ✅ Application accepted (booking confirmation)
5. ✅ Credits purchased (receipt)
6. ✅ Preset purchased/sold (transaction)
7. ✅ Subscription changes (billing)
8. ✅ Review received (feedback notification)
9. ✅ Showcase approval request (collaboration action)
10. ✅ Milestones (achievements)

### API Reference

#### Update Preferences
```typescript
POST /api/email-preferences/update
{
  email: string;
  userId?: string;
  preferences: {
    gig: boolean;
    application: boolean;
    message: boolean;
    booking: boolean;
    system: boolean;
    marketing: boolean;
  };
}
```

#### Unsubscribe All
```typescript
POST /api/email-preferences/unsubscribe-all
{
  email: string;
  userId?: string;
}
```

---

## 🔧 Supabase Database Triggers

### Active Triggers

| Trigger | Table | Event | Email |
|---------|-------|-------|-------|
| `welcome_after_verification_trigger` | `users_profile` | INSERT (verified) | Welcome email |
| `gig_published_email_trigger` | `gigs` | UPDATE (published) | Gig published |
| `new_application_email_trigger` | `applications` | INSERT | New application |
| `application_status_email_trigger` | `applications` | UPDATE (status) | Status change |

### Trigger Function

All triggers use the `call_email_api(endpoint, payload)` function:

```sql
CREATE OR REPLACE FUNCTION call_email_api(endpoint TEXT, payload JSONB)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  api_url TEXT;
  request_id UUID;
BEGIN
  api_url := 'https://presetie.com';
  request_id := gen_random_uuid();
  
  INSERT INTO email_logs (id, endpoint, payload, status, created_at)
  VALUES (request_id, endpoint, payload, 'pending', NOW());
  
  BEGIN
    PERFORM net.http_post(
      url := api_url || endpoint,
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body := payload
    );
    
    UPDATE email_logs SET status = 'sent' WHERE id = request_id;
    
  EXCEPTION WHEN OTHERS THEN
    UPDATE email_logs SET status = 'failed', error = SQLERRM WHERE id = request_id;
    RAISE WARNING 'Email API call failed for %: %', endpoint, SQLERRM;
  END;
END;
$$;
```

### Email Logs Table

Monitor trigger execution:

```sql
SELECT * FROM email_logs ORDER BY created_at DESC LIMIT 10;
```

---

## 🎨 Design System

### Brand Colors

```css
Primary: #00876f (Preset Green)
Secondary: #00a389 (Light Green)
Success: #10b981
Warning: #f59e0b
Error: #ef4444
```

### Email Layout

All emails follow this structure:

1. **Header** - Logo/icon + headline
2. **Content** - Main message with clear hierarchy
3. **CTA** - Single, prominent action button
4. **Footer** - Unsubscribe links + address

### Typography

- Headlines: 28-32px, font-weight: 700
- Body: 14-16px, color: #4b5563
- CTAs: 16px, font-weight: 600

---

## 🧪 Testing

### Test Script

Run the comprehensive test:

```bash
python test_all_email_types.py
```

This tests:
- ✅ Onboarding emails (2)
- ✅ Verification emails (1)
- ✅ Gig emails (1)
- ✅ Application emails (2)
- ✅ Preference management (2)

### Manual Testing

1. **Start dev server**: `npm run dev`
2. **Test email preferences**: Visit `/settings/email-preferences`
3. **Test unsubscribe**: Visit `/unsubscribe?email=test@example.com`
4. **Check Plunk dashboard**: View sent emails and events

---

## 📊 Analytics

### Tracked Events

Every email sends tracking events to Plunk:

```typescript
plunk.trackEvent({
  event: 'email.welcome.sent',
  email: 'user@example.com',
  data: { name, role, authUserId }
});
```

### Event Categories

- `email.*` - Email sent events
- `user.*` - User actions (unsubscribe, preferences)
- `engagement.*` - Engagement metrics
- `conversion.*` - Conversion tracking

---

## 🚀 Deployment

### Environment Variables

Required in production:

```env
PLUNK_API_KEY=sk_...
NEXT_PUBLIC_APP_URL=https://presetie.com
SUPABASE_SERVICE_ROLE_KEY=...
```

### Database Setup

1. Enable `pg_net` extension
2. Run all migrations in order
3. Verify triggers: `SELECT * FROM pg_trigger;`
4. Test email logs: `SELECT * FROM email_logs;`

---

## 📚 Additional Resources

- [Email Preferences System](./EMAIL-PREFERENCES-SYSTEM.md)
- [Supabase Triggers Guide](./SUPABASE-TRIGGERS-GUIDE.md)
- [Email Verification Setup](./EMAIL-VERIFICATION-SETUP.md)
- [Verification User Experience](./VERIFICATION-USER-EXPERIENCE.md)

---

## ✅ Production Checklist

- [x] All templates created and tested
- [x] Email preferences implemented
- [x] Unsubscribe functionality working
- [x] Database triggers installed
- [x] Email logs monitoring
- [x] Plunk integration complete
- [x] Environment variables set
- [x] Custom verification flow active
- [x] OAuth auto-verification working
- [x] Comprehensive documentation
- [x] Test scripts available

**Status: PRODUCTION READY** ✅

---

_Last updated: October 10, 2025 by AI Assistant_


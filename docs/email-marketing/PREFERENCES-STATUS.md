# 📊 Email Preferences & Unsubscribe - Status Report

## ⚠️ Current Status: PARTIALLY IMPLEMENTED

---

## ✅ What's Already Working

### 1. Database Layer ✅
- ✅ `notification_preferences` table exists
- ✅ Granular controls (6 categories)
- ✅ Channel controls (email, push, in-app)
- ✅ Digest frequency options
- ✅ RLS policies for security
- ✅ Repository implementation

### 2. Backend Services ✅ **JUST CREATED**
- ✅ `EmailPreferenceChecker` service
- ✅ Preference checking methods
- ✅ Unsubscribe methods
- ✅ Plunk integration

### 3. Frontend Pages ✅ **JUST CREATED**
- ✅ `/unsubscribe` page
- ✅ `/settings/email-preferences` page
- ✅ User-friendly UI with icons
- ✅ Granular category controls

### 4. API Routes ✅ **JUST CREATED**
- ✅ `/api/email-preferences/update`
- ✅ `/api/email-preferences/unsubscribe-all`

### 5. Email Templates ✅ **JUST UPDATED**
- ✅ Unsubscribe links in footer
- ✅ Preference links in footer
- ✅ User email shown in footer

---

## ⚠️ What Needs Integration

### 🔄 Preference Checking (CRITICAL - NOT YET INTEGRATED)

**Current:** Emails send WITHOUT checking preferences ❌  
**Needed:** Check preferences BEFORE sending each email ✅

**Example of what needs to be added:**

```typescript
// In EmailEventsService methods
import { getEmailPreferenceChecker } from '@/lib/services/email-preference-checker.service';

async sendGigPublished(userId: string, email: string, gigDetails: any) {
  // ADD THIS CHECK 
  const checker = getEmailPreferenceChecker();
  const { shouldSend } = await checker.shouldSendEmail(userId, 'gig');
  
  if (!shouldSend) {
    console.log(`User ${userId} opted out of gig emails`);
    return; // Don't send email
  }
  
  // Existing code...
  await this.plunk.sendTransactionalEmail({...});
}
```

**Files to update:** All 49 methods in `emails/` folder

---

### 🔄 Template Updates (PARTIAL)

**Current:** Base template updated with unsubscribe links ✅  
**Needed:** Pass userEmail and userId to ALL template calls

**Example:**

```typescript
// OLD
body: this.getGigPublishedTemplate(gigDetails)

// NEW  
body: this.getGigPublishedTemplate(gigDetails, userEmail, userId)
```

**Then update each template function:**

```typescript
// OLD signature
export function getGigPublishedTemplate(gigDetails: GigDetails): string {

// NEW signature
export function getGigPublishedTemplate(
  gigDetails: GigDetails, 
  userEmail?: string, 
  userId?: string
): string {
  // Pass to base template
  return getEmailTemplate(content, userEmail, userId);
}
```

---

## 📋 Implementation Roadmap

### Phase 1: Critical Email Protection (Week 1) 🔴

**Priority:** HIGH - Must respect user preferences

**Tasks:**
1. Add `userId` parameter to all EmailEventsService methods
2. Add preference checking to each send method
3. Define which emails are "critical" (always send)
4. Update all template signatures to accept userEmail/userId
5. Test that disabled categories block emails

**Files to update:**
- `emails/index.ts` - Add userId to all methods
- `emails/events/*.events.ts` - Add preference checks
- `emails/templates/*.templates.ts` - Update signatures

**Estimated time:** 4-6 hours

---

### Phase 2: Enhanced Unsubscribe (Week 1-2) 🟡

**Priority:** MEDIUM - Better user experience

**Tasks:**
1. Add one-click unsubscribe to email headers
2. Track unsubscribe reasons
3. Add win-back campaigns for unsubscribed users
4. Create re-subscribe emails

**Estimated time:** 2-3 hours

---

### Phase 3: Preference Sync (Week 2) 🟢

**Priority:** LOW - Nice to have

**Tasks:**
1. Sync Plunk contacts with preference changes
2. Add webhook for Plunk unsubscribes
3. Two-way sync (Plunk ← → Database)
4. Analytics on preference changes

**Estimated time:** 3-4 hours

---

## 🚨 Critical vs Optional Emails

### ❌ Critical (ALWAYS SEND - Cannot Disable)

**Legal/transactional requirement:**
- Welcome email (account created)
- Email verification (security)
- Password reset (security)
- Booking confirmation (contractual)
- Payment receipt (legal)
- Subscription changes (legal)
- Security alerts (security)

**These MUST be sent regardless of preferences!**

```typescript
const criticalEvents = [
  'user.signup',
  'email.verification.sent',
  'password.reset.sent',
  'application.accepted', // Booking confirmation
  'credits.purchased', // Receipt
  'subscription.upgraded', // Billing
  'subscription.cancelled', // Billing
  'account.suspended', // Security
];

// Critical emails skip preference check
if (criticalEvents.includes(event)) {
  await sendEmail(); // Always send
} else {
  // Check preferences first
  const { shouldSend } = await checker.shouldSendEmail(userId, category);
  if (shouldSend) {
    await sendEmail();
  }
}
```

---

### ✅ Optional (Respect User Preferences)

- Gig published notifications
- New application alerts  
- Application status updates
- Deadline reminders
- Shoot reminders
- Message notifications
- Review requests
- Weekly reports
- Marketing emails
- Feature announcements

---

## 🔧 Quick Integration Guide

### Option A: Add to EmailEventsService (Recommended)

Create a helper method:

```typescript
// In emails/index.ts
private async checkAndSend(
  userId: string,
  email: string,
  category: EmailCategory,
  isCritical: boolean,
  sendFn: () => Promise<void>
): Promise<void> {
  // Critical emails always send
  if (isCritical) {
    await sendFn();
    return;
  }

  // Check preferences
  const checker = getEmailPreferenceChecker();
  const { shouldSend } = await checker.shouldSendEmail(userId, category);
  
  if (shouldSend) {
    await sendFn();
  } else {
    console.log(`Email blocked by user preference: ${category}`);
  }
}

// Use in methods:
async sendGigPublished(userId: string, email: string, gigDetails: any) {
  await this.checkAndSend(userId, email, 'gig', false, async () => {
    await this.plunk.sendTransactionalEmail({
      to: email,
      subject: `Your gig "${gigDetails.title}" is now live`,
      body: templates.getGigPublishedTemplate(gigDetails, email, userId),
    });
  });
}
```

---

### Option B: Middleware Pattern

Create email middleware:

```typescript
// lib/services/email-middleware.ts
export async function withPreferenceCheck(
  userId: string,
  email: string,
  category: EmailCategory,
  isCritical: boolean,
  emailFn: () => Promise<void>
): Promise<{ sent: boolean; reason?: string }> {
  if (isCritical) {
    await emailFn();
    return { sent: true, reason: 'critical_email' };
  }

  const checker = getEmailPreferenceChecker();
  const { shouldSend, reason } = await checker.shouldSendEmail(userId, category);
  
  if (shouldSend) {
    await emailFn();
    return { sent: true };
  }
  
  return { sent: false, reason };
}
```

---

## ✅ What You Can Do NOW

### 1. Test Unsubscribe Page
```
Visit: http://localhost:3000/unsubscribe?email=test@example.com
```

### 2. Test Preferences Page
```
Login and visit: http://localhost:3000/settings/email-preferences
```

### 3. Test API Routes
```bash
# Update preferences
curl -X POST http://localhost:3000/api/email-preferences/update \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "preferences": {
      "marketing": false
    }
  }'
```

---

## 🎯 Summary

**Question:** "Are email preferences properly implemented?"

**Answer:**

✅ **YES - Infrastructure is ready:**
- Database table ✓
- Services ✓
- API routes ✓
- UI pages ✓
- Unsubscribe system ✓

⚠️ **NO - Not yet integrated:**
- Emails don't check preferences before sending
- Need to add checks to all 49 email methods
- Need to pass userId to enable preference checking

**Status:** 70% complete  
**Time to finish:** 4-6 hours  
**Priority:** HIGH (GDPR compliance)

---

## 🚀 Want Me to Complete the Integration?

I can:
1. ✅ Add preference checking to all 49 email methods
2. ✅ Update all template signatures  
3. ✅ Add critical email whitelist
4. ✅ Test end-to-end
5. ✅ Create integration testing guide

**Should I complete this integration now?** 🎯


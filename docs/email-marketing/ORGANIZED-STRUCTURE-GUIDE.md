# 📂 Organized Email Structure - Quick Reference Guide

## ✅ Answer: YES! Emails are NOW organized by category!

---

## 📂 File Structure

```
apps/web/lib/services/emails/
│
├── 📄 index.ts                           ← Import from here!
│
├── 🎨 templates/ (HTML email designs)
│   ├── shared.templates.ts               ← Base template, buttons, components
│   ├── index.ts                          ← Exports all templates
│   │
│   ├── onboarding.templates.ts           ← 4 templates
│   │   ├── getWelcomeEmailTemplate()
│   │   ├── getEmailVerificationTemplate()
│   │   ├── getPasswordResetTemplate()
│   │   └── getProfileCompletionTemplate()
│   │
│   ├── gigs.templates.ts                 ← 6 templates
│   │   ├── getGigDraftTemplate()
│   │   ├── getGigPublishedTemplate()
│   │   ├── getNewApplicationTemplate()
│   │   ├── getApplicationMilestoneTemplate()
│   │   ├── getDeadlineApproachingTemplate()
│   │   └── getShootReminderTemplate()
│   │
│   ├── applications.templates.ts         ← 6 templates
│   │   ├── getApplicationSubmittedTemplate()
│   │   ├── getApplicationShortlistedTemplate()
│   │   ├── getTalentBookingTemplate()
│   │   ├── getApplicationDeclinedTemplate()
│   │   ├── getApplicationLimitWarningTemplate()
│   │   └── getApplicationLimitReachedTemplate()
│   │
│   └── subscriptions.templates.ts        ← 7 templates
│       ├── getTrialStartedTemplate()
│       ├── getTrialEndingTemplate()
│       ├── getSubscriptionUpgradedTemplate()
│       └── ... (4 more)
│
└── 📧 events/ (Email sending logic)
    ├── onboarding.events.ts              ← 4 methods
    │   ├── sendWelcomeEmail()
    │   ├── sendEmailVerification()
    │   ├── sendPasswordReset()
    │   └── sendProfileCompletionReminder()
    │
    ├── gigs.events.ts                    ← 7 methods
    │   ├── sendGigDraftSaved()
    │   ├── sendGigPublished()
    │   ├── sendNewApplicationNotification()
    │   └── ... (4 more)
    │
    └── applications.events.ts            ← 6 methods
        ├── sendApplicationSubmittedConfirmation()
        ├── sendApplicationShortlisted()
        ├── sendApplicationAccepted()
        └── ... (3 more)
```

---

## 🎯 How to Find & Modify ANY Email

### Example 1: Modify "Welcome Email"

**Step 1: Find the template**
```bash
open apps/web/lib/services/emails/templates/onboarding.templates.ts
```

**Step 2: Find the function** (Line ~8)
```typescript
export function getWelcomeEmailTemplate(name: string, role: string, roleDescription: string): string {
  const content = `
    <h1>Welcome to Preset, ${name}</h1>
    <!-- MODIFY THIS HTML -->
  `;
  return getEmailTemplate(content);
}
```

**Step 3: Modify HTML**
- Change text
- Update colors
- Add/remove sections

**Step 4: Save & test**
```bash
# Test just onboarding emails
curl -X POST http://localhost:3000/api/test-all-emails \
  -d '{"email":"test@example.com","testType":"onboarding"}'
```

**Done!** ✅

---

### Example 2: Modify "Gig Published Email"

**Step 1: Find the template**
```bash
open apps/web/lib/services/emails/templates/gigs.templates.ts
```

**Step 2: Find the function** (Line ~45)
```typescript
export function getGigPublishedTemplate(gigDetails: GigDetails): string {
  const content = `
    <h1>Your Gig is Now Live</h1>
    <!-- MODIFY THIS HTML -->
  `;
  return getEmailTemplate(content);
}
```

**Step 3: Modify**

**Step 4: Test**
```bash
curl -X POST http://localhost:3000/api/test-all-emails \
  -d '{"email":"test@example.com","testType":"gigs"}'
```

---

### Example 3: Modify "Application Accepted Email"

**File:** `applications.templates.ts`  
**Function:** `getTalentBookingTemplate()` (Line ~59)  
**Test:** `testType: "applications"`

---

## 📋 Quick Find Guide

| Email You Want to Change | File | Function |
|--------------------------|------|----------|
| **Welcome** | `onboarding.templates.ts` | `getWelcomeEmailTemplate()` |
| **Email Verification** | `onboarding.templates.ts` | `getEmailVerificationTemplate()` |
| **Password Reset** | `onboarding.templates.ts` | `getPasswordResetTemplate()` |
| **Profile Completion** | `onboarding.templates.ts` | `getProfileCompletionTemplate()` |
| **Gig Draft Saved** | `gigs.templates.ts` | `getGigDraftTemplate()` |
| **Gig Published** | `gigs.templates.ts` | `getGigPublishedTemplate()` |
| **New Application** | `gigs.templates.ts` | `getNewApplicationTemplate()` |
| **Deadline Approaching** | `gigs.templates.ts` | `getDeadlineApproachingTemplate()` |
| **Application Submitted** | `applications.templates.ts` | `getApplicationSubmittedTemplate()` |
| **Application Shortlisted** | `applications.templates.ts` | `getApplicationShortlistedTemplate()` |
| **Booking Confirmed** | `applications.templates.ts` | `getTalentBookingTemplate()` |
| **Application Declined** | `applications.templates.ts` | `getApplicationDeclinedTemplate()` |
| **Limit Warning** | `applications.templates.ts` | `getApplicationLimitWarningTemplate()` |
| **Trial Started** | `subscriptions.templates.ts` | `getTrialStartedTemplate()` |
| **Subscription Upgraded** | `subscriptions.templates.ts` | `getSubscriptionUpgradedTemplate()` |

---

## 🎨 Shared Components (Reusable!)

All in `templates/shared.templates.ts`:

### Base Template
```typescript
getEmailTemplate(content) // Wraps all emails with header/footer
```

### Buttons
```typescript
getButton(text, url, 'primary')    // Gradient button
getButton(text, url, 'secondary')  // Outline button
getButton(text, url, 'success')    // Green button
```

### Boxes
```typescript
getInfoBox(title, content)     // Gray background box
getWarningBox(title, content)  // Orange warning box
getSuccessBox(title, content)  // Green success box
getHighlightCard(title, content) // Gradient highlight card
```

**Usage in templates:**
```typescript
export function getMyTemplate(name: string): string {
  const content = `
    <h1>Hello, ${name}</h1>
    ${getInfoBox('Pro Tip', 'This is a reusable info box!')}
    ${getButton('Click Here', '/url')}
  `;
  return getEmailTemplate(content);
}
```

---

## 💡 Usage in Your App

**Same simple import:**
```typescript
import { getEmailEventsService } from '@/lib/services/emails';

const emailEvents = getEmailEventsService();

// Onboarding
await emailEvents.sendWelcomeEmail(email, name, role);

// Gigs
await emailEvents.sendGigPublished(email, gigDetails);

// Applications
await emailEvents.sendApplicationAccepted(email, name, gigDetails, contributorName);

// Everything else...
```

**No changes needed in your existing code!**

---

## ✅ Benefits of This Organization

### 1. Easy to Pinpoint
```
Want to modify gig emails? 
→ Open gigs.templates.ts

Want to modify onboarding emails?
→ Open onboarding.templates.ts
```

### 2. Small Files
- Before: 1,116 lines in one file
- Now: ~100-200 lines per file
- Easier to navigate!

### 3. Clear Organization
```
templates/ ← HTML designs
events/    ← Sending logic
```

### 4. Reusable Components
```
shared.templates.ts has:
- getButton()
- getInfoBox()
- getWarningBox()
- getEmailTemplate()

Use these in ANY template!
```

### 5. Easy Collaboration
- Designer works on `templates/`
- Developer works on `events/`
- No merge conflicts!

---

## 🧪 Testing by Category

```bash
# Test onboarding emails
curl -X POST http://localhost:3000/api/test-all-emails \
  -d '{"email":"test@example.com","testType":"onboarding"}'

# Test gig emails
curl -X POST http://localhost:3000/api/test-all-emails \
  -d '{"email":"test@example.com","testType":"gigs"}'

# Test application emails
curl -X POST http://localhost:3000/api/test-all-emails \
  -d '{"email":"test@example.com","testType":"applications"}'

# Test ALL
curl -X POST http://localhost:3000/api/test-all-emails \
  -d '{"email":"test@example.com","testType":"all"}'
```

---

## 📝 Common Modifications

### Change Button Color

**File:** `templates/shared.templates.ts`  
**Function:** `getButton()`  
**Line:** ~58

```typescript
const styles = {
  primary: 'background: linear-gradient(135deg, #00876f 0%, #0d7d72 100%); ...',
  // ↑ Change colors here - affects ALL emails!
};
```

### Change Header Gradient

**File:** `templates/shared.templates.ts`  
**Function:** `getEmailTemplate()`  
**Line:** ~33

```typescript
<div style="background: linear-gradient(135deg, #00876f 0%, #0d7d72 100%); ...">
  <!-- ↑ Change gradient - affects ALL emails! -->
```

### Change Specific Email Content

**File:** Category-specific template file  
**Example:** `templates/gigs.templates.ts`  
**Find function:** `getGigPublishedTemplate()`  
**Modify:** HTML content inside

---

## 🚀 Next Steps

1. **Test the new structure:**
   ```bash
   npm run dev
   curl -X POST http://localhost:3000/api/test-all-emails \
     -d '{"email":"support@presetie.com","testType":"onboarding"}'
   ```

2. **Check inbox** - See the professionally designed emails!

3. **Modify a template** - Try changing welcome email

4. **Test again** - See your changes instantly

5. **Expand templates** - Replace placeholders with full HTML from docs

---

## ✅ Summary

**Question:** "Do we have different files for different email events?"  
**Answer:** **YES!** Now organized into category-based files:

- **Onboarding** → `onboarding.templates.ts` + `onboarding.events.ts`
- **Gigs** → `gigs.templates.ts` + `gigs.events.ts`
- **Applications** → `applications.templates.ts` + `applications.events.ts`
- **Subscriptions** → `subscriptions.templates.ts` + methods in index
- **And more...**

**Easy to pinpoint, easy to modify!** 🎯

**Total Files:** 10 organized files (vs 1 giant file)  
**Lines per file:** 100-200 (vs 1,116)  
**Organization:** By category ✅

**Same usage, better organization!** 🚀


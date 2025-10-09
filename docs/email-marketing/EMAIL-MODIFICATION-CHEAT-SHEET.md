# 🎯 Email Modification Cheat Sheet

**Quick reference: Where to find and modify ANY email**

---

## 📂 File Organization

```
emails/
├── templates/     ← MODIFY HTML HERE
└── events/        ← Email logic (rarely change)
```

---

## 🎨 To Modify Email HTML/Design

### Onboarding Emails
**File:** `emails/templates/onboarding.templates.ts`

| Email | Function | What to Change |
|-------|----------|----------------|
| Welcome email | `getWelcomeEmailTemplate()` | Greeting, steps, tips |
| Email verification | `getEmailVerificationTemplate()` | Instructions, CTA |
| Password reset | `getPasswordResetTemplate()` | Security message |
| Profile completion | `getProfileCompletionTemplate()` | Progress bar, tips |

---

### Gig Lifecycle Emails
**File:** `emails/templates/gigs.templates.ts`

| Email | Function | What to Change |
|-------|----------|----------------|
| Draft saved | `getGigDraftTemplate()` | Draft message, CTA |
| Gig published | `getGigPublishedTemplate()` | Success message, next steps |
| New application | `getNewApplicationTemplate()` | Application alert |
| Deadline approaching | `getDeadlineApproachingTemplate()` | Urgency message |
| Milestone reached | `getApplicationMilestoneTemplate()` | Milestone details |
| Shoot reminder | `getShootReminderTemplate()` | Reminder details |

---

### Application Emails
**File:** `emails/templates/applications.templates.ts`

| Email | Function | What to Change |
|-------|----------|----------------|
| Application sent | `getApplicationSubmittedTemplate()` | Confirmation, timeline |
| Shortlisted | `getApplicationShortlistedTemplate()` | Next steps |
| Booked/Accepted | `getTalentBookingTemplate()` | Booking details, checklist |
| Declined | `getApplicationDeclinedTemplate()` | Encouragement, recommendations |
| Limit warning | `getApplicationLimitWarningTemplate()` | Usage stats, upgrade CTA |
| Limit reached | `getApplicationLimitReachedTemplate()` | Reset date, upgrade options |

---

### Subscription Emails
**File:** `emails/templates/subscriptions.templates.ts`

| Email | Function | What to Change |
|-------|----------|----------------|
| Trial started | `getTrialStartedTemplate()` | Trial details, features |
| Trial ending | `getTrialEndingTemplate()` | Urgency, upgrade CTA |
| Upgraded | `getSubscriptionUpgradedTemplate()` | New features list |
| Downgraded | `getSubscriptionDowngradedTemplate()` | Changes explanation |
| Cancelled | `getSubscriptionCancelledTemplate()` | Access details |
| Renewal reminder | `getSubscriptionRenewalTemplate()` | Billing info |
| Payment failed | `getPaymentFailedTemplate()` | Fix payment CTA |

---

### All Other Emails
**File:** `emails/templates/index.ts` (for now)

Showcases, messaging, reviews, credits, marketplace, safety, educational

---

## 🛠️ Quick Modification Workflow

### 1. Identify Which Email
"I want to change the gig published email"

### 2. Find the File
```
Gig emails → emails/templates/gigs.templates.ts
```

### 3. Open & Find Function
```bash
open apps/web/lib/services/emails/templates/gigs.templates.ts

# Search for: getGigPublishedTemplate
```

### 4. Modify HTML
```typescript
export function getGigPublishedTemplate(gigDetails: GigDetails): string {
  const content = `
    <!-- CHANGE THIS HTML -->
    <h1 style="color: #1f2937;">Your Gig is Now Live</h1>
    <p style="color: #10b981;">Successfully published</p>
    
    <!-- Add/remove/modify sections -->
    <div style="background: #f9fafb; padding: 20px;">
      <p>My new custom content!</p>
    </div>
  `;
  return getEmailTemplate(content);
}
```

### 5. Test Immediately
```bash
curl -X POST http://localhost:3000/api/test-all-emails \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","testType":"gigs"}'
```

### 6. Check Inbox
Verify your changes look good!

---

## 🎨 Common Customizations

### Change Email Colors Globally

**File:** `emails/templates/shared.templates.ts`

```typescript
// Line ~33 - Header gradient
background: linear-gradient(135deg, #00876f 0%, #0d7d72 100%);
// ↑ Change these colors

// Line ~58 - Button styles
const styles = {
  primary: 'background: linear-gradient(135deg, #00876f 0%, #0d7d72 100%);',
  // ↑ Change button colors
};
```

**Effect:** Changes ALL emails instantly!

---

### Add New Section to Email

**Example:** Add "What's New" section to welcome email

**File:** `emails/templates/onboarding.templates.ts`  
**Function:** `getWelcomeEmailTemplate()`

```typescript
export function getWelcomeEmailTemplate(...): string {
  const content = `
    <h1>Welcome to Preset, ${name}</h1>
    
    <!-- ADD YOUR NEW SECTION -->
    <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 30px 0;">
      <h3 style="color: #065f46; margin-top: 0;">What's New</h3>
      <ul style="color: #047857;">
        <li>New feature 1</li>
        <li>New feature 2</li>
      </ul>
    </div>
    
    <!-- Existing content continues... -->
  `;
  return getEmailTemplate(content);
}
```

---

### Use Shared Components

**Available in every template:**

```typescript
// Import at top of file
import { getEmailTemplate, getButton, getInfoBox, getWarningBox, getSuccessBox, getHighlightCard } from './shared.templates';

// Use in template
export function myTemplate(): string {
  const content = `
    <h1>My Email</h1>
    
    ${getButton('Click Me', '/url', 'primary')}
    
    ${getInfoBox('Tip', 'This is helpful info')}
    
    ${getWarningBox('Warning', 'Important deadline')}
    
    ${getSuccessBox('Success', 'Action completed')}
    
    ${getHighlightCard('Featured', 'Important content')}
  `;
  return getEmailTemplate(content);
}
```

---

## 🔍 Quick Search Guide

### By Email Type

| Want to Modify | Open This File |
|----------------|----------------|
| **Any onboarding email** | `templates/onboarding.templates.ts` |
| **Any gig email** | `templates/gigs.templates.ts` |
| **Any application email** | `templates/applications.templates.ts` |
| **Any subscription email** | `templates/subscriptions.templates.ts` |
| **Button/box styles** | `templates/shared.templates.ts` |
| **Email header/footer** | `templates/shared.templates.ts` |

### By Feature

| Feature | File | Function |
|---------|------|----------|
| Welcome message | `onboarding.templates.ts` | `getWelcomeEmailTemplate()` |
| Gig goes live | `gigs.templates.ts` | `getGigPublishedTemplate()` |
| Get booked | `applications.templates.ts` | `getTalentBookingTemplate()` |
| Buy credits | `index.ts` (templates) | `getCreditsPurchasedTemplate()` |
| Upgrade plan | `subscriptions.templates.ts` | `getSubscriptionUpgradedTemplate()` |

---

## ✅ Final Answer

**"Do we have different files for different email events?"**

## YES! ✅

**Templates organized by category:**
- `onboarding.templates.ts` - 4 templates
- `gigs.templates.ts` - 6 templates
- `applications.templates.ts` - 6 templates
- `subscriptions.templates.ts` - 7 templates
- `shared.templates.ts` - Reusable components

**Easy to pinpoint and modify:**
- Want gig email? → Open `gigs.templates.ts`
- Want onboarding? → Open `onboarding.templates.ts`
- Want to change buttons? → Open `shared.templates.ts`

**Same usage everywhere:**
```typescript
import { getEmailEventsService } from '@/lib/services/emails';
await emailEvents.sendWelcomeEmail(...);
```

**No more 1,116-line file!** Now 10 small, focused files! 🎯


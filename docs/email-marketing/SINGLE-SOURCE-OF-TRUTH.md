# ✅ Single Source of Truth - Email System

## 🎯 One Place to Modify All Emails

**ALL emails are now in ONE file:**

📁 **`apps/web/lib/services/email-events.service.ts`**

This is the **ONLY** place you need to modify emails!

---

## 📊 Clean Architecture

```
┌─────────────────────────────────────────┐
│  YOUR CODE (API routes, components)     │
│                                         │
│  import { getEmailEventsService }       │
│  const email = getEmailEventsService()  │
│  await email.sendWelcomeEmail(...)      │ ← Always use this!
└───────────────┬─────────────────────────┘
                │
                ↓
┌─────────────────────────────────────────┐
│  EmailEventsService                     │ ⭐ SINGLE SOURCE OF TRUTH
│  apps/web/lib/services/                 │
│  email-events.service.ts                │
│                                         │
│  ALL 49 email methods:                  │
│  - sendWelcomeEmail()                   │
│  - sendGigPublished()                   │
│  - sendApplicationAccepted()            │
│  - sendCreditsPurchased()               │
│  - ... and 45 more                      │
│                                         │
│  ALL templates defined here!            │
│  - getWelcomeEmailTemplate()            │
│  - getGigPublishedTemplate()            │
│  - ... all templates                    │
└───────────────┬─────────────────────────┘
                │
                ↓
┌─────────────────────────────────────────┐
│  PlunkService (Internal Use Only)       │
│  packages/adapters/src/external/        │
│                                         │
│  Low-level API methods:                 │
│  - sendTransactionalEmail() ← Generic   │
│  - trackEvent() ← Generic               │
│  - upsertContact() ← Generic            │
│                                         │
│  NO business logic here!                │
└───────────────┬─────────────────────────┘
                │
                ↓
┌─────────────────────────────────────────┐
│  Plunk API                              │
│  https://api.useplunk.com               │
└─────────────────────────────────────────┘
```

---

## 🎯 How to Modify ANY Email

### Example: Want to change the Welcome Email?

**1. Open ONE file:**
```bash
open apps/web/lib/services/email-events.service.ts
```

**2. Find the method:**
```typescript
// Line ~44
async sendWelcomeEmail(email: string, name: string, role: string) {
  // Subject line here
  subject: 'Welcome to Preset',
  
  // Template method
  body: this.getWelcomeEmailTemplate(name, role, ...),
}
```

**3. Find the template:**
```typescript
// Line ~971
private getWelcomeEmailTemplate(name: string, role: string, roleDescription: string): string {
  const content = `
    <h1>Welcome to Preset, ${name}</h1>
    <p>Your creative collaboration starts here</p>
    <!-- Modify HTML here! -->
  `;
  return this.getEmailTemplate(content);
}
```

**4. Modify the HTML** - Change text, colors, layout, anything!

**5. Save & Test:**
```bash
curl -X POST http://localhost:3000/api/test-all-emails \
  -d '{"email":"test@example.com","testType":"onboarding"}'
```

**DONE!** ✅ One file, one place, easy to find!

---

## 📝 Quick Reference Guide

### Where to Find Each Email

| Email Type | Method Name | Line # (approx) |
|------------|-------------|-----------------|
| **Welcome** | `sendWelcomeEmail()` | Line 44 |
| **Email Verification** | `sendEmailVerification()` | Line 64 |
| **Password Reset** | `sendPasswordReset()` | Line 78 |
| **Gig Published** | `sendGigPublished()` | Line 124 |
| **New Application** | `sendNewApplicationNotification()` | Line 142 |
| **Application Accepted** | `sendApplicationAccepted()` | Line 276 |
| **Booking Confirmation** | `sendApplicationAccepted()` | Line 276 |
| **Credits Purchased** | `sendCreditsPurchased()` | Line 592 |
| **Subscription Upgraded** | `sendSubscriptionUpgraded()` | Line 518 |
| **Review Request** | `sendReviewRequest()` | Line 448 |
| **Milestone** | `sendMilestoneEmail()` | Line 669 |

**Pro tip:** Search for the method name in the file (Cmd+F)

---

## 🔍 How to Find Templates

All template methods start with `get` and end with `Template`:

```typescript
// Search for these patterns:
private getWelcomeEmailTemplate()           // Line ~971
private getGigPublishedTemplate()           // Line ~1005
private getEmailVerificationTemplate()      // Line ~1057
private getPasswordResetTemplate()          // Line ~1058
// ... etc (lines 1057-1103)
```

**Quick find:** Search for `private get` in the file

---

## ✏️ Template Customization Examples

### Example 1: Change Welcome Email Colors

```typescript
// Find: Line ~971
private getWelcomeEmailTemplate(name: string, role: string, roleDescription: string): string {
  const content = `
    <!-- Change this gradient -->
    <div style="background: linear-gradient(135deg, #00876f 0%, #0d7d72 100%); ...">
    
    <!-- Change this heading color -->
    <h1 style="color: #1f2937; ...">Welcome to Preset, ${name}</h1>
    
    <!-- Change button color via getButton() method -->
    ${this.getButton('Complete Your Profile', url)} ← Uses brand gradient
  `;
}
```

### Example 2: Add More Content to Gig Published

```typescript
// Find: Line ~1005
private getGigPublishedTemplate(gigDetails: GigDetails): string {
  const content = `
    <h1>Your Gig is Now Live</h1>
    
    <!-- ADD NEW SECTION HERE -->
    <div style="background: #f9fafb; padding: 20px; ...">
      <h4>New Feature!</h4>
      <p>Your custom content here...</p>
    </div>
    
    <!-- Existing content continues... -->
  `;
}
```

### Example 3: Change Button Style

```typescript
// Find: Line ~957
private getButton(text: string, url: string, type: 'primary' | 'secondary' | 'success' = 'primary'): string {
  const styles = {
    primary: 'background: linear-gradient(135deg, #00876f 0%, #0d7d72 100%); ...',
    // ↑ Change gradient colors here
    secondary: 'background: #ffffff; color: #00876f; ...',
    success: 'background: #10b981; ...'
  };
}
```

---

## 📋 Modification Checklist

When modifying any email:

1. **Open ONE file:**
   ```bash
   apps/web/lib/services/email-events.service.ts
   ```

2. **Find the method** (e.g., `sendWelcomeEmail`)

3. **Modify what you need:**
   - Subject line (in the method)
   - HTML content (in the template method)
   - Colors, spacing, text, etc.

4. **Ensure NO emojis** (unless you explicitly want them)

5. **Use brand colors** (#00876f, #0d7d72)

6. **Test immediately:**
   ```bash
   curl -X POST http://localhost:3000/api/test-all-emails \
     -d '{"email":"test@example.com","testType":"onboarding"}'
   ```

7. **Check inbox** - Verify changes look good

8. **Done!** ✅

---

## 🚫 What NOT to Use

### ❌ Don't Use PlunkService Directly

```typescript
// ❌ BAD - Low-level, no templates
import { getPlunkService } from '@/../../packages/adapters/src/external/PlunkService';
const plunk = getPlunkService();
await plunk.sendTransactionalEmail({ ... }); // Too generic!
```

### ❌ Don't Use Old EmailService

```typescript
// ❌ DEPRECATED - Will show warning
import { getEmailService } from '@/lib/services/email-service';
const email = getEmailService(); // Deprecated!
```

### ✅ Always Use EmailEventsService

```typescript
// ✅ CORRECT - High-level, with templates
import { getEmailEventsService } from '@/lib/services/email-events.service';
const emailEvents = getEmailEventsService();
await emailEvents.sendWelcomeEmail(email, name, role); // Perfect!
```

---

## 📊 Current Status

### ✅ Refactored Services

**PlunkService** ✅
- Cleaned up ✓
- Removed duplicate methods ✓
- Now only API wrapper ✓

**EmailService** ✅  
- Deprecated ✓
- Points to EmailEventsService ✓
- Shows warning if used ✓

**EmailEventsService** ✅
- Single source of truth ✓
- All 49 methods ✓
- All templates in one place ✓
- NO emojis ✓
- Brand colors ✓

---

## 🎨 Template Expansion Guide

Currently, most templates are basic placeholders. To expand them:

**1. Find the template method** (lines 1057-1103)

**2. Copy full template from docs:**
```bash
open docs/email-marketing/03-email-templates.md
# Find the template you want
# Copy the HTML
```

**3. Replace placeholder:**
```typescript
// OLD (placeholder)
private getGigDraftTemplate(title: string, id: string): string { 
  return this.getEmailTemplate(`<h1>Draft Saved</h1><p>${title} saved</p>`); 
}

// NEW (full template)
private getGigDraftTemplate(title: string, id: string): string {
  const content = `
    <h1 style="color: #1f2937;">Your Gig is Saved as a Draft</h1>
    <p style="color: #00876f; font-size: 18px;">Ready to publish when you are</p>
    
    <div style="background: linear-gradient(135deg, #00876f 0%, #0d7d72 100%); padding: 30px; border-radius: 12px; color: white;">
      <h2 style="color: white;">${title}</h2>
      <p>Your gig has been saved and is ready to publish whenever you're ready.</p>
    </div>
    
    ${this.getButton('Edit & Publish', `${this.baseUrl}/gigs/${id}/edit`)}
    
    <p>Take your time to refine the details and publish when ready.</p>
  `;
  return this.getEmailTemplate(content);
}
```

**4. Test it:**
```bash
curl -X POST http://localhost:3000/api/test-all-emails \
  -d '{"email":"test@example.com","testType":"gigs"}'
```

---

## 🚀 Next Steps

### To Start Using:

1. **Restart dev server** (to load new refactored code):
   ```bash
   npm run dev
   ```

2. **Test all emails:**
   ```bash
   curl -X POST http://localhost:3000/api/test-all-emails \
     -H "Content-Type: application/json" \
     -d '{"email":"support@presetie.com","testType":"all"}'
   ```

3. **Check your inbox** - You'll see 20+ test emails!

4. **Modify templates** - Expand placeholders with full HTML

5. **Integrate into app** - Use in signup, gig creation, etc.

---

## 📚 Related Documentation

- **[READY-TO-TEST.md](./READY-TO-TEST.md)** - Testing guide
- **[EMAIL-DESIGN-GUIDE.md](./EMAIL-DESIGN-GUIDE.md)** - Design standards
- **[REFACTORING-PLAN.md](./REFACTORING-PLAN.md)** - Refactoring details

---

## ✅ Summary

**Question:** "Should we break them up/refactor?"  
**Answer:** ✅ **DONE!** Refactored to ONE single source of truth

**Where to modify emails:** `apps/web/lib/services/email-events.service.ts`

**Total methods:** 49  
**Total templates:** 49  
**Design:** NO emojis, brand colors  
**Easy to find:** All in one file, numbered sections  

**Ready to customize any email you want!** 🎯


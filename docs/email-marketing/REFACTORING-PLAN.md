# 🔧 Email Services Refactoring Plan

## 🚨 Current Issue: Duplication

We have **3 email services** with overlapping functionality:

### 1. PlunkService.ts (Low-level API)
```typescript
✅ Keep: Core Plunk API methods
  - sendTransactionalEmail() - Generic
  - trackEvent() - Generic
  - upsertContact(), subscribeContact(), etc.
  
❌ Remove: Business logic helpers
  - sendWelcomeEmail() - Duplicate!
  - sendCreditPurchaseEmail() - Duplicate!
  - trackUserSignup() - Move to events
  - trackPurchase() - Move to events
```

### 2. EmailService.ts (Mid-level wrapper)
```typescript
❌ Deprecate this file - Functionality moved to EmailEventsService
  - sendWelcomeEmail() - Duplicate!
  - sendCreditPurchaseConfirmation() - Duplicate!
  - sendPresetGeneratedEmail() - Duplicate!
  - All others... - Duplicate!
```

### 3. EmailEventsService.ts (High-level business logic) ⭐
```typescript
✅ Keep & Expand: All 49 business email methods
  - sendWelcomeEmail()
  - sendGigPublished()
  - sendApplicationAccepted()
  - All 49 event methods...
```

---

## ✅ Proposed Clean Architecture

```
┌─────────────────────────────────────┐
│   Your Application Code             │
│   (API routes, server components)   │
└──────────────┬──────────────────────┘
               │
               ↓
┌──────────────────────────────────────┐
│   EmailEventsService                 │  ⭐ USE THIS
│   High-level business logic          │
│   - All 49 email event methods      │
│   - sendWelcomeEmail()              │
│   - sendGigPublished()              │
│   - etc...                          │
└──────────────┬───────────────────────┘
               │
               ↓
┌──────────────────────────────────────┐
│   PlunkService                       │  ⭐ INTERNAL USE ONLY
│   Low-level API wrapper              │
│   - sendTransactionalEmail()        │
│   - trackEvent()                    │
│   - upsertContact()                 │
│   - subscribeContact()              │
└──────────────────────────────────────┘
               │
               ↓
┌──────────────────────────────────────┐
│   Plunk API                          │
│   https://api.useplunk.com          │
└──────────────────────────────────────┘
```

---

## 🛠️ Refactoring Steps

### Step 1: Clean Up PlunkService.ts

**Remove business logic helpers:**
```typescript
// ❌ REMOVE these from PlunkService.ts:
async sendWelcomeEmail(to: string, name?: string) { ... }
async sendCreditPurchaseEmail(email: string, credits: number, amount: number, name?: string) { ... }
async trackUserSignup(email: string, userData?: Record<string, any>) { ... }
async trackPurchase(email: string, purchaseData: Record<string, any>) { ... }
async trackPresetGenerated(email: string, presetData: Record<string, any>) { ... }
```

**Keep only generic API methods:**
```typescript
// ✅ KEEP these in PlunkService.ts:
async sendTransactionalEmail(options: PlunkEmailOptions) { ... }
async trackEvent(options: PlunkEvent) { ... }
async upsertContact(contact: PlunkContact) { ... }
async subscribeContact(email: string, data?: Record<string, any>) { ... }
async unsubscribeContact(email: string) { ... }
async getContact(email: string) { ... }
async deleteContact(email: string) { ... }
async createCampaign(options: PlunkCampaignOptions) { ... }
```

---

### Step 2: Deprecate EmailService.ts

**Option A: Delete it entirely**
```bash
# All functionality is now in EmailEventsService
rm apps/web/lib/services/email-service.ts
```

**Option B: Make it an alias (for backwards compatibility)**
```typescript
// apps/web/lib/services/email-service.ts
import { getEmailEventsService } from './email-events.service';

/**
 * @deprecated Use getEmailEventsService() instead
 */
export function getEmailService() {
  return getEmailEventsService();
}

export type EmailService = ReturnType<typeof getEmailEventsService>;
```

---

### Step 3: Update All Imports

Find and replace across codebase:

```bash
# Find files using old services
grep -r "getEmailService" apps/web/

# Replace with:
import { getEmailEventsService } from '@/lib/services/email-events.service';
const emailEvents = getEmailEventsService();
```

---

## 📊 Service Comparison

| Feature | PlunkService | EmailService (OLD) | EmailEventsService (NEW) |
|---------|--------------|-------------------|-------------------------|
| **Purpose** | API wrapper | Business logic | Business logic |
| **Level** | Low | Mid | High |
| **Methods** | 10 generic | 7 specific | 49 specific |
| **Use directly?** | ❌ No | ⚠️ Deprecated | ✅ Yes |
| **Email templates** | Basic | Basic | Professional |
| **Brand colors** | Generic | Generic | #00876f |
| **NO emojis** | ❌ No | ❌ No | ✅ Yes |

---

## ✅ Recommended Clean Architecture

### PlunkService (packages/adapters/)
**Role:** Low-level Plunk API wrapper  
**Use:** Internal only, called by EmailEventsService

```typescript
// Low-level API methods only
class PlunkService {
  async sendTransactionalEmail(options: PlunkEmailOptions) { ... }
  async trackEvent(options: PlunkEvent) { ... }
  async upsertContact(contact: PlunkContact) { ... }
  async subscribeContact(email: string, data?) { ... }
  async unsubscribeContact(email: string) { ... }
  // ... other API methods
}
```

---

### EmailEventsService (apps/web/lib/services/)
**Role:** High-level business logic for ALL emails  
**Use:** This is what you import everywhere

```typescript
// High-level business email methods
class EmailEventsService {
  // Onboarding (4)
  async sendWelcomeEmail(email, name, role) { ... }
  async sendEmailVerification(email, url) { ... }
  async sendPasswordReset(email, url) { ... }
  async sendProfileCompletionReminder(email, name, pct) { ... }
  
  // Gig Lifecycle (7)
  async sendGigPublished(email, gigDetails) { ... }
  async sendNewApplicationNotification(...) { ... }
  async sendDeadlineApproaching(...) { ... }
  // ... etc
  
  // Applications (6)
  async sendApplicationSubmittedConfirmation(...) { ... }
  async sendApplicationAccepted(...) { ... }
  // ... etc
  
  // ALL 49 methods...
}
```

---

## 🚀 Implementation Plan

### Option A: Quick Clean (Recommended)

**1. Update PlunkService.ts**
```typescript
// Remove these methods (they're now in EmailEventsService):
- sendWelcomeEmail()
- sendCreditPurchaseEmail()
- trackUserSignup()
- trackPurchase()
- trackPresetGenerated()
```

**2. Delete or alias EmailService.ts**
```bash
# Since all functionality is in EmailEventsService
mv apps/web/lib/services/email-service.ts apps/web/lib/services/email-service.ts.deprecated
```

**3. Update imports in existing code**
```typescript
// Find and replace:
// OLD
import { getEmailService } from '@/lib/services/email-service';

// NEW
import { getEmailEventsService } from '@/lib/services/email-events.service';
```

**4. Test everything still works**

---

### Option B: Gradual Migration (Safer)

**Phase 1: Keep everything, add @deprecated tags**
```typescript
// PlunkService.ts
/**
 * @deprecated Use EmailEventsService.sendWelcomeEmail() instead
 */
async sendWelcomeEmail(to: string, name?: string) { ... }
```

**Phase 2: Update new code to use EmailEventsService**

**Phase 3: Migrate existing code gradually**

**Phase 4: Remove deprecated methods**

---

## 🎯 Final Clean Structure

```
packages/adapters/src/external/
└── PlunkService.ts
    ├── sendTransactionalEmail()  ← Generic API
    ├── trackEvent()              ← Generic API
    ├── upsertContact()           ← Generic API
    ├── subscribeContact()        ← Generic API
    └── ... (API methods only)

apps/web/lib/services/
└── email-events.service.ts  ← USE THIS EVERYWHERE
    ├── sendWelcomeEmail()              ← Onboarding
    ├── sendGigPublished()              ← Gigs
    ├── sendApplicationAccepted()       ← Applications
    ├── sendSubscriptionUpgraded()      ← Monetization
    ├── sendMilestoneEmail()            ← Engagement
    └── ... (All 49 business methods)
```

---

## 📋 Migration Checklist

### Clean Up Services
- [ ] Remove business methods from PlunkService
- [ ] Deprecate or delete EmailService
- [ ] Keep only EmailEventsService for business logic

### Update Imports
- [ ] Find all `getEmailService()` calls
- [ ] Replace with `getEmailEventsService()`
- [ ] Update method calls if needed

### Test Everything
- [ ] Run test suite
- [ ] Test email sending
- [ ] Verify events tracking
- [ ] Check no regressions

### Documentation
- [ ] Update code comments
- [ ] Update documentation
- [ ] Add migration notes

---

## 💡 Recommendation

**DO THIS NOW (Quick & Clean):**

1. **Keep PlunkService.ts simple** - Just API wrapper
2. **Use EmailEventsService.ts everywhere** - All business logic
3. **Delete EmailService.ts** - No longer needed
4. **Update any existing code** - Replace imports

This gives you:
- ✅ Clear separation of concerns
- ✅ No duplication
- ✅ Easy to maintain
- ✅ All 49 methods in one place
- ✅ Consistent design (NO emojis, brand colors)

---

## 🔥 Quick Refactor Script

Want me to:
1. Clean up PlunkService (remove duplicate methods)
2. Delete EmailService (or make it an alias)
3. Update documentation
4. Create migration guide

**Ready to refactor?** Let me know and I'll do it! 🚀


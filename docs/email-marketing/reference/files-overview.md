# 📁 Plunk Integration - Files Overview

Complete overview of all Plunk integration files and their purposes.

## 🏗️ Core Service Layer

### PlunkService (`packages/adapters/src/external/PlunkService.ts`)
**Purpose:** Core service adapter for Plunk API
- Event tracking
- Transactional email sending
- Contact management (subscribe/unsubscribe)
- Campaign creation
- Helper methods for common use cases

**Key Methods:**
- `trackEvent()` - Track events for automation
- `sendTransactionalEmail()` - Send emails
- `upsertContact()` - Create/update contacts
- `subscribeContact()` / `unsubscribeContact()` - Manage subscriptions
- Helper methods: `trackUserSignup()`, `trackPurchase()`, `sendWelcomeEmail()`, etc.

---

## 🔌 API Routes

### 1. Track Events (`apps/web/app/api/plunk/track/route.ts`)
**Endpoint:** `POST /api/plunk/track`

**Purpose:** Track user events for email automation triggers

**Request Body:**
```json
{
  "event": "user.signup",
  "email": "user@example.com",
  "subscribed": true,
  "data": { "name": "John" }
}
```

### 2. Send Email (`apps/web/app/api/plunk/send/route.ts`)
**Endpoint:** `POST /api/plunk/send`

**Purpose:** Send transactional emails

**Request Body:**
```json
{
  "to": "user@example.com",
  "subject": "Welcome!",
  "body": "<h1>Hello</h1>",
  "name": "John"
}
```

### 3. Manage Contacts (`apps/web/app/api/plunk/contacts/route.ts`)
**Endpoint:** `POST /api/plunk/contacts`

**Purpose:** Create or update contacts

### 4. Subscribe (`apps/web/app/api/plunk/contacts/subscribe/route.ts`)
**Endpoint:** `POST /api/plunk/contacts/subscribe`

**Purpose:** Subscribe users to email marketing

### 5. Unsubscribe (`apps/web/app/api/plunk/contacts/unsubscribe/route.ts`)
**Endpoint:** `POST /api/plunk/contacts/unsubscribe`

**Purpose:** Unsubscribe users from marketing emails

### 6. Test Endpoint (`apps/web/app/api/plunk/test/route.ts`)
**Endpoint:** `POST /api/plunk/test` or `GET /api/plunk/test`

**Purpose:** Test your Plunk integration quickly

**Usage:**
```bash
curl -X POST http://localhost:3000/api/plunk/test \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

---

## ⚛️ React Hooks

### usePlunk (`apps/web/lib/hooks/usePlunk.ts`)
**Purpose:** Client-side React hook for Plunk integration

**Features:**
- Loading state management
- Error handling
- Methods: `trackEvent()`, `sendEmail()`, `subscribeContact()`, etc.

**Usage:**
```tsx
const { trackEvent, loading, error } = usePlunk();

await trackEvent({
  event: 'button.clicked',
  email: 'user@example.com'
});
```

---

## 🎨 UI Components

### NewsletterSignup (`apps/web/components/marketing/NewsletterSignup.tsx`)
**Purpose:** Ready-to-use newsletter signup component

**Features:**
- Email validation
- Loading states
- Success/error messages
- Fully styled with Tailwind

**Usage:**
```tsx
import { NewsletterSignup } from '@/components/marketing/NewsletterSignup';

<NewsletterSignup />
```

---

## 🔧 Service Layer

### EmailService (`apps/web/lib/services/email-service.ts`)
**Purpose:** High-level email service wrapper

**Methods:**
- `sendWelcomeEmail()` - Send welcome emails
- `sendCreditPurchaseConfirmation()` - Purchase confirmations
- `sendPresetGeneratedEmail()` - Preset notifications
- `sendCollaborationInvite()` - Collaboration invites
- `sendGigInvitation()` - Gig invitations
- `trackUserSignup()` - Track signups
- `subscribeToNewsletter()` - Newsletter subscriptions

**Usage:**
```typescript
import { getEmailService } from '@/lib/services/email-service';

const emailService = getEmailService();
await emailService.sendWelcomeEmail(email, name);
```

---

## 📚 Example Implementations

### 1. Signup Example (`apps/web/app/api/examples/signup-with-plunk/route.ts`)
**Purpose:** Shows how to integrate Plunk into signup flow

**Key Features:**
- Track signup event
- Send welcome email
- Subscribe to newsletter
- Proper error handling

### 2. Purchase Example (`apps/web/app/api/examples/credit-purchase-with-plunk/route.ts`)
**Purpose:** Shows how to integrate into Stripe webhook

**Key Features:**
- Track purchase event
- Send confirmation email
- Track milestones

---

## 🧪 Testing

### Test Script (`scripts/test-plunk-integration.ts`)
**Purpose:** Command-line test script

**Run with:**
```bash
npx tsx scripts/test-plunk-integration.ts your-email@example.com
```

**Tests:**
- API connection
- Event tracking
- Email sending
- Contact management

### Test API Route (`apps/web/app/api/plunk/test/route.ts`)
**Purpose:** HTTP endpoint for testing

**Run with:**
```bash
curl -X POST http://localhost:3000/api/plunk/test \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

---

## 📖 Documentation

### 1. Setup Guide (`PLUNK_SETUP_COMPLETE.md`)
**Purpose:** Complete setup checklist and overview
- What was created
- Quick start guide
- Integration checklist
- Common use cases
- Troubleshooting

### 2. Integration Guide (`PLUNK_INTEGRATION_GUIDE.md`)
**Purpose:** Comprehensive integration documentation
- Detailed setup instructions
- API routes documentation
- Usage examples
- Best practices
- Advanced features
- Troubleshooting

### 3. Quick Start (`QUICK_START_PLUNK.md`)
**Purpose:** 5-minute quick start guide
- Minimal setup steps
- Quick code examples
- Common events reference
- Next steps

### 4. This File (`PLUNK_FILES_OVERVIEW.md`)
**Purpose:** Overview of all integration files

---

## ⚙️ Configuration

### Environment Variables (`env.example`)
**Added:**
```bash
# Plunk Email Marketing
PLUNK_API_KEY=your_plunk_api_key
```

---

## 📊 File Structure

```
preset/
├── packages/adapters/src/external/
│   └── PlunkService.ts                    # Core service
│
├── apps/web/
│   ├── app/api/plunk/
│   │   ├── track/route.ts                 # Track events
│   │   ├── send/route.ts                  # Send emails
│   │   ├── test/route.ts                  # Test endpoint
│   │   └── contacts/
│   │       ├── route.ts                   # Manage contacts
│   │       ├── subscribe/route.ts         # Subscribe
│   │       └── unsubscribe/route.ts       # Unsubscribe
│   │
│   ├── app/api/examples/
│   │   ├── signup-with-plunk/route.ts     # Signup example
│   │   └── credit-purchase-with-plunk/route.ts  # Purchase example
│   │
│   ├── lib/
│   │   ├── hooks/usePlunk.ts              # React hook
│   │   └── services/email-service.ts      # Email service
│   │
│   └── components/marketing/
│       └── NewsletterSignup.tsx           # Newsletter component
│
├── scripts/
│   └── test-plunk-integration.ts          # Test script
│
├── env.example                             # Updated with Plunk key
│
└── Documentation/
    ├── PLUNK_SETUP_COMPLETE.md            # Setup checklist
    ├── PLUNK_INTEGRATION_GUIDE.md         # Full guide
    ├── QUICK_START_PLUNK.md               # Quick start
    └── PLUNK_FILES_OVERVIEW.md            # This file
```

---

## 🎯 How to Use

### 1. **Setup** (One-time)
1. Add `PLUNK_API_KEY` to `.env`
2. Create email templates in Plunk dashboard
3. Set up automation workflows

### 2. **Client-Side** (React Components)
```tsx
import { usePlunk } from '@/lib/hooks/usePlunk';
const { trackEvent } = usePlunk();
```

### 3. **Server-Side** (API Routes)
```typescript
import { getEmailService } from '@/lib/services/email-service';
const emailService = getEmailService();
```

### 4. **Direct Service** (Advanced)
```typescript
import { getPlunkService } from '@/../../packages/adapters/src/external/PlunkService';
const plunk = getPlunkService();
```

### 5. **UI Components**
```tsx
import { NewsletterSignup } from '@/components/marketing/NewsletterSignup';
```

---

## 🚦 Quick Test

### Option 1: Use Test Endpoint
```bash
curl -X POST http://localhost:3000/api/plunk/test \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

### Option 2: Use Test Script
```bash
npx tsx scripts/test-plunk-integration.ts test@example.com
```

### Option 3: Use Newsletter Component
Add `<NewsletterSignup />` to any page and test signup

---

## 📝 Next Steps

1. ✅ Review [PLUNK_SETUP_COMPLETE.md](./PLUNK_SETUP_COMPLETE.md)
2. ✅ Follow [QUICK_START_PLUNK.md](./QUICK_START_PLUNK.md)
3. ✅ Test with `/api/plunk/test` endpoint
4. ✅ Add `NewsletterSignup` to your footer
5. ✅ Integrate into signup/purchase flows
6. ✅ Create automations in Plunk dashboard

---

## 🔗 Resources

- **Plunk Dashboard:** https://app.useplunk.com
- **Plunk API Docs:** https://docs.useplunk.com
- **Track Event API:** https://docs.useplunk.com/api-reference/actions/track

---

**Everything is ready! Start building amazing email experiences! 📧✨**


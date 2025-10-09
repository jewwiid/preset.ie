# 🔑 Plunk API Keys Guide

## Two Types of Keys

Plunk provides two types of API keys, each with different purposes:

### 1. Secret Key (`sk_...`) - Server-Side Only 🔒

**Purpose:** Full API access for server-side operations

**Can do:**
- ✅ Send transactional emails
- ✅ Create/update/delete contacts
- ✅ Track events
- ✅ Create campaigns
- ✅ Manage subscriptions

**Use in:**
- API routes (`/app/api/`)
- Server components
- Node.js scripts
- Backend services

**⚠️ NEVER expose this in client-side code!**

**Environment variable:**
```bash
PLUNK_API_KEY=sk_your_secret_key_here
```

---

### 2. Public Key (`pk_...`) - Client-Side Safe 🌐

**Purpose:** Limited API access for browser/client-side

**Can do:**
- ✅ Track events only
- ❌ Cannot send emails
- ❌ Cannot manage contacts
- ❌ Cannot create campaigns

**Use in:**
- Client components (`'use client'`)
- Browser JavaScript
- Mobile apps
- Public-facing code

**Safe to expose in client-side code**

**Environment variable:**
```bash
NEXT_PUBLIC_PLUNK_PUBLIC_KEY=pk_your_public_key_here
```

---

## 📁 How to Set Up Both Keys

### 1. Add Both to Your `.env` File

```bash
# Server-side (secret key) - NEVER expose to client
PLUNK_API_KEY=sk_410545c...

# Client-side (public key) - safe to expose
NEXT_PUBLIC_PLUNK_PUBLIC_KEY=pk_eb6467f...
```

### 2. Current Setup (Using Secret Key)

Your current integration **already works perfectly** with just the secret key for:
- ✅ All API routes (server-side)
- ✅ Email sending
- ✅ Contact management
- ✅ Event tracking from server

---

## 🎯 When to Use Which Key

### Use Secret Key (Server-Side) ✅

**Current usage (already implemented):**

```typescript
// API routes - ✅ CORRECT (server-side)
import { getPlunkService } from '@/../../packages/adapters/src/external/PlunkService';

export async function POST(request: Request) {
  const plunk = getPlunkService(); // Uses PLUNK_API_KEY (secret)
  await plunk.sendWelcomeEmail(email, name);
}
```

```typescript
// Server components - ✅ CORRECT
import { getEmailService } from '@/lib/services/email-service';

const emailService = getEmailService(); // Uses secret key
await emailService.sendWelcomeEmail(email, name);
```

### Use Public Key (Client-Side) - Optional Enhancement

**For direct browser tracking (optional):**

Create a new hook for client-side tracking:

```typescript
// lib/hooks/usePlunkClientTracking.ts
'use client';

export function usePlunkClientTracking() {
  const publicKey = process.env.NEXT_PUBLIC_PLUNK_PUBLIC_KEY;

  const trackEvent = async (event: string, email: string, data?: any) => {
    if (!publicKey) {
      console.warn('Public key not configured');
      return;
    }

    try {
      const response = await fetch('https://api.useplunk.com/v1/track', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ event, email, data }),
      });

      return await response.json();
    } catch (error) {
      console.error('Tracking failed:', error);
    }
  };

  return { trackEvent };
}
```

**Usage:**
```tsx
'use client';

import { usePlunkClientTracking } from '@/lib/hooks/usePlunkClientTracking';

export function MyComponent() {
  const { trackEvent } = usePlunkClientTracking();

  const handleClick = () => {
    // This calls Plunk directly from the browser
    trackEvent('button.clicked', 'user@example.com', {
      buttonId: 'cta-button'
    });
  };

  return <button onClick={handleClick}>Click Me</button>;
}
```

---

## 🔐 Security Best Practices

### ✅ DO:

1. **Keep secret key server-side only**
   ```typescript
   // ✅ GOOD - API route (server)
   import { getPlunkService } from '@/lib/services/plunk';
   const plunk = getPlunkService(); // Uses secret key
   ```

2. **Use public key for client-side tracking**
   ```typescript
   // ✅ GOOD - Client component
   const publicKey = process.env.NEXT_PUBLIC_PLUNK_PUBLIC_KEY;
   fetch('https://api.useplunk.com/v1/track', {
     headers: { 'Authorization': `Bearer ${publicKey}` }
   });
   ```

3. **Proxy through API routes for sensitive operations**
   ```typescript
   // ✅ GOOD - Client calls your API, which uses secret key
   fetch('/api/plunk/send', { /* data */ }); // Your API uses secret key
   ```

### ❌ DON'T:

1. **Never use secret key in client components**
   ```typescript
   // ❌ BAD - Exposes secret key to browser
   'use client';
   const secretKey = process.env.PLUNK_API_KEY; // WRONG!
   ```

2. **Never commit keys to git**
   ```bash
   # ✅ GOOD - .gitignore already includes .env
   .env
   .env.local
   ```

---

## 📊 Comparison Table

| Feature | Secret Key (`sk_...`) | Public Key (`pk_...`) |
|---------|----------------------|----------------------|
| **Send emails** | ✅ Yes | ❌ No |
| **Track events** | ✅ Yes | ✅ Yes |
| **Manage contacts** | ✅ Yes | ❌ No |
| **Create campaigns** | ✅ Yes | ❌ No |
| **Where to use** | Server-side only | Client or server |
| **Can expose publicly** | ❌ Never | ✅ Yes |
| **Environment var** | `PLUNK_API_KEY` | `NEXT_PUBLIC_PLUNK_PUBLIC_KEY` |

---

## 🎯 Your Current Setup (Perfect!)

Your integration is **already set up correctly** using the secret key:

✅ **What's working:**
- All API routes use secret key (secure)
- Email sending works
- Contact management works
- Event tracking works
- Everything is server-side (secure)

✅ **What you have:**
```typescript
// Server-side only (secure)
const plunk = getPlunkService(); // Uses PLUNK_API_KEY (secret)
```

---

## 🚀 Optional: Add Public Key for Direct Browser Tracking

**Do you need this?** Probably not! Your current setup is perfect.

**When you might want it:**
- Analytics tracking from browser without hitting your API
- Third-party integrations that need client-side tracking
- Reducing server load for simple event tracking

**To add it:**

1. Add public key to `.env`:
   ```bash
   NEXT_PUBLIC_PLUNK_PUBLIC_KEY=pk_your_public_key
   ```

2. Use the client tracking hook (shown above)

---

## 💡 Recommendation

**Keep using your current setup!** 

Your integration with the **secret key on the server-side is the most secure approach**. You don't need the public key unless you want direct browser-to-Plunk tracking for simple events.

**What you have now:**
```
Client → Your API (/api/plunk/*) → Plunk
         ↑ (uses secret key securely)
```

**With public key (optional):**
```
Client → Plunk directly (only for tracking)
         ↑ (uses public key, limited access)
```

---

## ✅ Summary

| What | Which Key | Where |
|------|-----------|-------|
| **Your current setup** | Secret key | Server-side (API routes) ✅ |
| **Send emails** | Secret key | Server-side only ✅ |
| **Manage contacts** | Secret key | Server-side only ✅ |
| **Track events (server)** | Secret key | Server-side ✅ |
| **Track events (browser)** | Public key (optional) | Client-side 🤷 |

**Your integration is complete and secure! The public key is optional for advanced use cases.** 🎉


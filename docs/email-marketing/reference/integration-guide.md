# Plunk Email Marketing Integration Guide

This guide explains how to use Plunk for email marketing in your Preset application.

## 📚 Table of Contents

1. [Setup](#setup)
2. [Features](#features)
3. [API Routes](#api-routes)
4. [Usage Examples](#usage-examples)
5. [Common Use Cases](#common-use-cases)
6. [Best Practices](#best-practices)

---

## Setup

### 1. Get Your Plunk API Key

1. Sign up at [useplunk.com](https://useplunk.com)
2. Navigate to Settings → API Keys
3. Copy your API key

### 2. Add to Environment Variables

Add your Plunk API key to your `.env` file:

```bash
PLUNK_API_KEY=your_plunk_api_key_here
```

### 3. Verify Installation

The integration is ready to use! No additional dependencies needed.

---

## Features

✅ **Event Tracking** - Track user actions for automated email sequences  
✅ **Transactional Emails** - Send order confirmations, notifications, etc.  
✅ **Contact Management** - Subscribe/unsubscribe users  
✅ **Automation Triggers** - Trigger email sequences based on events  
✅ **Custom Metadata** - Attach custom data to contacts and events  

---

## API Routes

### Track Events

**Endpoint:** `POST /api/plunk/track`

Track user events for email automation triggers.

```typescript
// Request
{
  "event": "user.signup",
  "email": "user@example.com",
  "subscribed": true,
  "data": {
    "name": "John Doe",
    "plan": "pro"
  }
}

// Response
{
  "success": true,
  "contact": "contact-id",
  "event": "event-id",
  "timestamp": "2025-10-09T12:00:00.000Z"
}
```

### Send Transactional Email

**Endpoint:** `POST /api/plunk/send`

Send one-off transactional emails.

```typescript
// Request
{
  "to": "user@example.com",
  "subject": "Welcome to Preset!",
  "body": "<h1>Welcome!</h1><p>Thanks for joining.</p>",
  "name": "John Doe"
}

// Response
{
  "success": true,
  "emails": [...]
}
```

### Manage Contacts

**Create/Update Contact:** `POST /api/plunk/contacts`

```typescript
{
  "email": "user@example.com",
  "subscribed": true,
  "data": {
    "firstName": "John",
    "lastName": "Doe",
    "credits": 100
  }
}
```

**Subscribe Contact:** `POST /api/plunk/contacts/subscribe`

```typescript
{
  "email": "user@example.com",
  "data": {
    "source": "newsletter-signup"
  }
}
```

**Unsubscribe Contact:** `POST /api/plunk/contacts/unsubscribe`

```typescript
{
  "email": "user@example.com"
}
```

---

## Usage Examples

### Using the React Hook (Client-Side)

```typescript
'use client';

import { usePlunk } from '@/lib/hooks/usePlunk';

export function SignupForm() {
  const { trackEvent, loading, error } = usePlunk();

  const handleSignup = async (email: string, name: string) => {
    try {
      // Track signup event
      await trackEvent({
        event: 'user.signup',
        email,
        subscribed: true,
        data: { name, source: 'web' }
      });
      
      console.log('User signed up and tracked!');
    } catch (err) {
      console.error('Failed to track signup:', err);
    }
  };

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      handleSignup('user@example.com', 'John Doe');
    }}>
      {/* Form fields */}
      <button disabled={loading}>Sign Up</button>
      {error && <p className="text-red-500">{error}</p>}
    </form>
  );
}
```

### Using the Service Directly (Server-Side)

```typescript
import { getPlunkService } from '@/../../packages/adapters/src/external/PlunkService';

// In an API route or server action
export async function POST(request: Request) {
  const { email, credits, amount } = await request.json();
  
  const plunk = getPlunkService();
  
  // Track purchase
  await plunk.trackPurchase(email, {
    credits,
    amount,
    currency: 'USD'
  });
  
  // Send confirmation email
  await plunk.sendCreditPurchaseEmail(email, credits, amount);
  
  return Response.json({ success: true });
}
```

---

## Common Use Cases

### 1. User Signup Flow

```typescript
// When a user signs up
const plunk = getPlunkService();

await plunk.trackUserSignup('user@example.com', {
  name: 'John Doe',
  plan: 'free',
  referralSource: 'google'
});

// Optionally send welcome email
await plunk.sendWelcomeEmail('user@example.com', 'John Doe');
```

### 2. Credit Purchase

```typescript
// After successful Stripe payment
const plunk = getPlunkService();

await plunk.trackPurchase('user@example.com', {
  credits: 100,
  amount: 1999, // $19.99 in cents
  currency: 'USD',
  transactionId: 'txn_123'
});

await plunk.sendCreditPurchaseEmail(
  'user@example.com',
  100, // credits
  1999, // amount in cents
  'John Doe'
);
```

### 3. Preset Generation

```typescript
// Track when users generate presets
const plunk = getPlunkService();

await plunk.trackPresetGenerated('user@example.com', {
  presetName: 'Vintage Film',
  category: 'photography',
  creditsUsed: 5
});
```

### 4. Newsletter Subscription

```typescript
'use client';

import { usePlunk } from '@/lib/hooks/usePlunk';

export function NewsletterForm() {
  const { subscribeContact } = usePlunk();

  const handleSubscribe = async (email: string) => {
    await subscribeContact({
      email,
      data: {
        subscriptionSource: 'footer',
        interests: ['presets', 'tutorials']
      }
    });
  };

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      const email = e.currentTarget.email.value;
      handleSubscribe(email);
    }}>
      <input name="email" type="email" placeholder="Your email" />
      <button>Subscribe</button>
    </form>
  );
}
```

### 5. Abandoned Cart Recovery

```typescript
// Track when user adds credits to cart but doesn't complete
const plunk = getPlunkService();

await plunk.trackEvent({
  event: 'cart.abandoned',
  email: 'user@example.com',
  data: {
    credits: 100,
    amount: 1999,
    cartUrl: 'https://presetie.com/credits/purchase'
  }
});

// Set up an automation in Plunk dashboard to send reminder after 1 hour
```

---

## Best Practices

### 1. Event Naming Convention

Use a consistent naming pattern for events:

```typescript
// Good
'user.signup'
'purchase.completed'
'preset.generated'
'cart.abandoned'
'subscription.cancelled'

// Bad
'signup'
'buy-credits'
'GeneratedPreset'
```

### 2. Error Handling

Always handle errors gracefully:

```typescript
try {
  await plunk.trackEvent({ ... });
} catch (error) {
  console.error('Failed to track event:', error);
  // Don't fail the main operation if tracking fails
}
```

### 3. Privacy & GDPR Compliance

- Only track users who have consented
- Provide easy unsubscribe options
- Respect user preferences

```typescript
// Check user preferences before tracking
if (user.emailMarketingConsent) {
  await plunk.trackEvent({ ... });
}
```

### 4. Custom Metadata

Add useful metadata to help with segmentation:

```typescript
await plunk.trackEvent({
  event: 'preset.generated',
  email: 'user@example.com',
  data: {
    presetType: 'cinematic',
    creditsUsed: 5,
    plan: 'pro',
    totalPresetsGenerated: 42,
    userSince: '2024-01-15'
  }
});
```

### 5. Testing

Test email integration in development:

```typescript
// Use test email addresses in development
const email = process.env.NODE_ENV === 'development' 
  ? 'test@example.com' 
  : user.email;

await plunk.trackEvent({
  event: 'test.event',
  email,
  data: { environment: process.env.NODE_ENV }
});
```

---

## Email Automation Setup

### In Your Plunk Dashboard:

1. **Create Automation Workflows**
   - Go to Automations → Create New
   - Set trigger event (e.g., `user.signup`)
   - Design your email sequence

2. **Set Up Triggers**
   ```
   Event: user.signup
   Delay: Send immediately
   Template: Welcome Email
   ```

3. **Use Custom Data**
   Access event data in email templates:
   ```html
   <h1>Welcome {{data.name}}!</h1>
   <p>You're on the {{data.plan}} plan.</p>
   ```

---

## Troubleshooting

### Event Not Triggering Emails

1. Check that the event name matches exactly in Plunk dashboard
2. Verify the email is subscribed (`subscribed: true`)
3. Check automation is published and active

### API Errors

```typescript
// Check for common issues
const plunk = getPlunkService();

// 401 Unauthorized - Check API key
// 400 Bad Request - Check request format
// 429 Too Many Requests - Rate limit exceeded
```

---

## Resources

- [Plunk Documentation](https://docs.useplunk.com)
- [API Reference](https://docs.useplunk.com/api-reference/actions/track)
- [Plunk Dashboard](https://app.useplunk.com)

---

## Example: Complete Signup Flow

```typescript
// In your signup API route
import { getPlunkService } from '@/../../packages/adapters/src/external/PlunkService';

export async function POST(request: Request) {
  const { email, name, password } = await request.json();
  
  // 1. Create user in database
  const user = await createUser({ email, name, password });
  
  // 2. Track signup event in Plunk
  const plunk = getPlunkService();
  
  try {
    // Create/update contact with user data
    await plunk.upsertContact({
      email,
      subscribed: true,
      data: {
        name,
        plan: 'free',
        signupDate: new Date().toISOString(),
        creditsRemaining: 10
      }
    });
    
    // Track the signup event
    await plunk.trackUserSignup(email, {
      name,
      referralSource: request.headers.get('referer'),
      userAgent: request.headers.get('user-agent')
    });
    
    // Send welcome email
    await plunk.sendWelcomeEmail(email, name);
    
  } catch (error) {
    // Log error but don't fail signup
    console.error('Plunk tracking failed:', error);
  }
  
  return Response.json({ success: true, user });
}
```

---

## Next Steps

1. ✅ Add `PLUNK_API_KEY` to your `.env` file
2. 🎨 Create email templates in Plunk dashboard
3. ⚙️ Set up automation workflows
4. 📧 Start tracking events in your app
5. 📊 Monitor email performance in Plunk analytics

Happy emailing! 📧✨


# 🚀 Quick Start: Plunk Email Marketing

Get started with Plunk email marketing in 5 minutes!

## Step 1: Get Your API Key

1. Sign up at [useplunk.com](https://useplunk.com)
2. Go to Settings → API Keys
3. Copy your API key

## Step 2: Add to Environment

Create or update your `.env` file:

```bash
PLUNK_API_KEY=sk_your_api_key_here
```

## Step 3: Test the Integration

### Option A: Using the React Hook (Client-Side)

```tsx
'use client';

import { usePlunk } from '@/lib/hooks/usePlunk';

export function MyComponent() {
  const { trackEvent, loading } = usePlunk();

  const handleAction = async () => {
    await trackEvent({
      event: 'button.clicked',
      email: 'user@example.com',
      data: { buttonName: 'Get Started' }
    });
  };

  return (
    <button onClick={handleAction} disabled={loading}>
      Get Started
    </button>
  );
}
```

### Option B: Using the Email Service (Server-Side)

```typescript
// In an API route or server action
import { getEmailService } from '@/lib/services/email-service';

const emailService = getEmailService();

// Send welcome email
await emailService.sendWelcomeEmail(
  'user@example.com',
  'John Doe'
);

// Track signup
await emailService.trackUserSignup('user@example.com', {
  name: 'John Doe',
  plan: 'free'
});
```

## Step 4: Set Up Automations in Plunk

1. Go to [Plunk Dashboard](https://app.useplunk.com)
2. Click **Automations** → **Create New**
3. Set up your email sequence:
   - **Trigger:** `user.signup`
   - **Delay:** Immediate
   - **Email:** Welcome email template

## Common Events You Can Track

```typescript
// User Actions
'user.signup'           // When user creates account
'user.login'            // When user logs in
'user.profile.updated'  // When user updates profile

// Purchases
'purchase.completed'    // When credits are purchased
'purchase.abandoned'    // When cart is abandoned

// Content Creation
'preset.generated'      // When preset is created
'preset.shared'         // When preset is shared
'preset.featured'       // When preset becomes featured

// Engagement
'collaboration.invited' // When user is invited to collab
'gig.invited'          // When user is invited to gig
'newsletter.subscribed' // When user subscribes
```

## Available Methods

### Track Events
```typescript
await trackEvent({
  event: 'event.name',
  email: 'user@example.com',
  data: { key: 'value' }
});
```

### Send Emails
```typescript
await sendEmail({
  to: 'user@example.com',
  subject: 'Hello!',
  body: '<h1>Welcome</h1>'
});
```

### Manage Contacts
```typescript
// Subscribe
await subscribeContact({
  email: 'user@example.com',
  data: { source: 'footer' }
});

// Unsubscribe
await unsubscribeContact('user@example.com');
```

## Next Steps

📖 **Read the Full Guide:** [PLUNK_INTEGRATION_GUIDE.md](./PLUNK_INTEGRATION_GUIDE.md)

🎨 **Add Newsletter Signup:** Use `NewsletterSignup` component in your footer

⚙️ **Integrate into Existing Flows:** See examples in `/app/api/examples/`

📊 **Monitor Performance:** Check analytics in Plunk dashboard

---

Need help? Check the [full documentation](./PLUNK_INTEGRATION_GUIDE.md) or [Plunk docs](https://docs.useplunk.com).


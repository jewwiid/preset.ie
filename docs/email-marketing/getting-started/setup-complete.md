# ✅ Plunk Email Marketing Integration - Complete

Your Plunk email marketing integration is now fully set up and ready to use!

## 📦 What Was Created

### Core Service Layer
- ✅ **PlunkService** (`packages/adapters/src/external/PlunkService.ts`)
  - Complete API wrapper for Plunk
  - Event tracking, transactional emails, contact management
  - Helper methods for common use cases

### API Routes
- ✅ **POST /api/plunk/track** - Track events for automation triggers
- ✅ **POST /api/plunk/send** - Send transactional emails
- ✅ **POST /api/plunk/contacts** - Create/update contacts
- ✅ **POST /api/plunk/contacts/subscribe** - Subscribe users
- ✅ **POST /api/plunk/contacts/unsubscribe** - Unsubscribe users

### React Hook
- ✅ **usePlunk** (`apps/web/lib/hooks/usePlunk.ts`)
  - Client-side hook for easy Plunk integration
  - Handles loading states and errors
  - Perfect for forms and user interactions

### Email Service Wrapper
- ✅ **EmailService** (`apps/web/lib/services/email-service.ts`)
  - High-level service for common email operations
  - Methods for welcome emails, purchase confirmations, etc.
  - Automatic event tracking

### UI Components
- ✅ **NewsletterSignup** (`apps/web/components/marketing/NewsletterSignup.tsx`)
  - Ready-to-use newsletter signup component
  - Can be dropped into any page

### Example Implementations
- ✅ **Signup Flow Example** (`apps/web/app/api/examples/signup-with-plunk/route.ts`)
- ✅ **Purchase Flow Example** (`apps/web/app/api/examples/credit-purchase-with-plunk/route.ts`)

### Documentation
- ✅ **PLUNK_INTEGRATION_GUIDE.md** - Complete integration guide
- ✅ **QUICK_START_PLUNK.md** - 5-minute quick start guide
- ✅ **Updated env.example** - Added PLUNK_API_KEY

## 🚀 Quick Start

### 1. Add Your API Key

```bash
# In your .env file
PLUNK_API_KEY=sk_your_plunk_api_key
```

### 2. Start Using It!

#### Client-Side (React Component)
```tsx
import { usePlunk } from '@/lib/hooks/usePlunk';

const { trackEvent } = usePlunk();

await trackEvent({
  event: 'user.signup',
  email: 'user@example.com',
  data: { name: 'John' }
});
```

#### Server-Side (API Route)
```typescript
import { getEmailService } from '@/lib/services/email-service';

const emailService = getEmailService();
await emailService.sendWelcomeEmail('user@example.com', 'John');
```

## 📋 Integration Checklist

### Setup
- [ ] Sign up at [useplunk.com](https://useplunk.com)
- [ ] Get your API key from Settings
- [ ] Add `PLUNK_API_KEY` to `.env` file
- [ ] Restart your dev server

### In Plunk Dashboard
- [ ] Create email templates
- [ ] Set up automation workflows
- [ ] Configure triggers for events:
  - `user.signup` → Welcome email
  - `purchase.completed` → Purchase confirmation
  - `preset.generated` → Generation notification

### In Your App
- [ ] Add newsletter signup to footer (use `NewsletterSignup` component)
- [ ] Track user signup events
- [ ] Track purchase events
- [ ] Send transactional emails

### Testing
- [ ] Test newsletter signup
- [ ] Test welcome email on signup
- [ ] Test purchase confirmation
- [ ] Verify events appear in Plunk dashboard

## 🎯 Common Use Cases

### 1. User Signup
```typescript
import { getEmailService } from '@/lib/services/email-service';

const emailService = getEmailService();

// Track signup + send welcome email
await emailService.trackUserSignup(email, { name, plan: 'free' });
await emailService.sendWelcomeEmail(email, name);
```

### 2. Credit Purchase
```typescript
// Automatic purchase tracking + confirmation email
await emailService.sendCreditPurchaseConfirmation(
  email,
  100, // credits
  1999, // $19.99 in cents
  name
);
```

### 3. Preset Generated
```typescript
await emailService.sendPresetGeneratedEmail(
  email,
  'Vintage Film',
  'https://presetie.com/presets/123',
  userName
);
```

### 4. Newsletter Subscription
```tsx
// Drop this component anywhere
import { NewsletterSignup } from '@/components/marketing/NewsletterSignup';

<NewsletterSignup />
```

## 📊 Event Tracking

Track these events to trigger email automations:

| Event | When to Track | Automation Use |
|-------|---------------|----------------|
| `user.signup` | User creates account | Welcome sequence |
| `purchase.completed` | Credits purchased | Thank you + tips |
| `preset.generated` | Preset created | Generation tips |
| `cart.abandoned` | User leaves checkout | Recovery email |
| `collaboration.invited` | User invited to collab | Invitation email |
| `gig.invited` | User invited to gig | Gig notification |
| `newsletter.subscribed` | Newsletter signup | Newsletter sequence |

## 🔗 Quick Links

- **Quick Start Guide:** [QUICK_START_PLUNK.md](./QUICK_START_PLUNK.md)
- **Full Documentation:** [PLUNK_INTEGRATION_GUIDE.md](./PLUNK_INTEGRATION_GUIDE.md)
- **Plunk Dashboard:** [app.useplunk.com](https://app.useplunk.com)
- **Plunk API Docs:** [docs.useplunk.com](https://docs.useplunk.com)

## 📝 Example: Complete Signup Flow

```typescript
// apps/web/app/api/auth/signup/route.ts
import { getEmailService } from '@/lib/services/email-service';

export async function POST(request: Request) {
  const { email, name, password, subscribeToNewsletter } = await request.json();
  
  // 1. Create user in database
  const user = await createUser({ email, name, password });
  
  // 2. Send welcome email + track signup
  const emailService = getEmailService();
  await emailService.sendWelcomeEmail(email, name);
  await emailService.trackUserSignup(email, {
    name,
    plan: 'free',
    signupDate: new Date().toISOString()
  });
  
  // 3. Subscribe to newsletter if opted in
  if (subscribeToNewsletter) {
    await emailService.subscribeToNewsletter(email);
  }
  
  return Response.json({ success: true, user });
}
```

## 🎨 Where to Use the Newsletter Component

Add the newsletter signup component to:

1. **Footer** - Best for overall visibility
2. **Preset Pages** - Capture interested users
3. **After Signup** - Grow your list
4. **Settings Page** - Let users manage preferences

```tsx
// Example: In your footer
import { NewsletterSignup } from '@/components/marketing/NewsletterSignup';

<footer>
  <div className="container">
    <h3>Stay Updated</h3>
    <NewsletterSignup />
  </div>
</footer>
```

## ⚙️ Advanced Features

### Custom Event Data
```typescript
await trackEvent({
  event: 'preset.featured',
  email: user.email,
  data: {
    presetName: 'Vintage Film',
    category: 'photography',
    credits: 100,
    userTier: 'pro',
    totalPresets: 42
  }
});
```

### Email Personalization
Use event data in Plunk email templates:
```html
<!-- In Plunk dashboard email template -->
<h1>Hi {{data.name}}!</h1>
<p>Your preset "{{data.presetName}}" is now featured!</p>
<p>You have {{data.credits}} credits remaining.</p>
```

### Unsubscribe Handling
```typescript
// Add unsubscribe link to emails
import { getEmailService } from '@/lib/services/email-service';

// In your unsubscribe page/route
const emailService = getEmailService();
await emailService.unsubscribeFromMarketing(email);
```

## 🔐 Security Best Practices

1. **Never expose API key client-side** - Only use in server routes
2. **Validate email addresses** - Already handled in API routes
3. **Rate limit API calls** - Prevent abuse
4. **Handle errors gracefully** - Don't break user flow if tracking fails

```typescript
try {
  await emailService.trackUserSignup(email, userData);
} catch (error) {
  // Log error but don't fail the signup
  console.error('Failed to track signup:', error);
}
```

## 📈 Monitoring & Analytics

### In Plunk Dashboard
- View email open rates
- Track click-through rates
- Monitor automation performance
- See subscriber growth

### In Your App
Check the usePlunk hook for loading/error states:
```typescript
const { loading, error, trackEvent } = usePlunk();

if (loading) return <Spinner />;
if (error) return <ErrorMessage message={error} />;
```

## 🆘 Troubleshooting

### Event not triggering email
1. Check event name matches exactly in Plunk dashboard
2. Verify automation is published and active
3. Ensure user is subscribed (`subscribed: true`)

### API errors
- **401 Unauthorized** - Check `PLUNK_API_KEY` is set correctly
- **400 Bad Request** - Validate request payload format
- **429 Rate Limit** - Reduce request frequency

### Testing emails
Use test emails in development:
```typescript
const testEmail = process.env.NODE_ENV === 'development'
  ? 'test@example.com'
  : user.email;
```

## ✨ Next Steps

1. **Set up your first automation** in Plunk dashboard
2. **Add NewsletterSignup** to your footer
3. **Integrate into signup flow** using example code
4. **Track preset generations** for user engagement
5. **Monitor performance** in Plunk analytics

---

**Need Help?**
- 📖 [Full Guide](./PLUNK_INTEGRATION_GUIDE.md)
- 🚀 [Quick Start](./QUICK_START_PLUNK.md)
- 🌐 [Plunk Docs](https://docs.useplunk.com)

**Your Plunk integration is ready to go! Start sending amazing emails! 📧✨**


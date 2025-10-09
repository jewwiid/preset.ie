# 🔧 Plunk Setup - Action Required

## ⚠️ Server Restart Needed

Your Plunk API key has been added, but the development server needs to be restarted to pick it up.

### 📝 Steps to Complete Setup:

#### 1. Restart Your Dev Server

Stop your current dev server (Ctrl+C) and restart it:

```bash
npm run dev
```

Or if using a specific workspace:

```bash
cd apps/web
npm run dev
```

#### 2. Verify the API Key is Loaded

After restart, test the integration:

```bash
curl -X POST http://localhost:3000/api/plunk/test \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@example.com"}'
```

**Replace `your-email@example.com` with your actual email to receive a test email!**

#### 3. Expected Success Response

You should see something like:

```json
{
  "success": true,
  "message": "Plunk integration test completed",
  "testEmail": "your-email@example.com",
  "results": {
    "trackEvent": { "success": true, "contact": "...", "event": "..." },
    "sendEmail": { "success": true },
    "contactManagement": { "success": true }
  },
  "nextSteps": [
    "Check your Plunk dashboard at https://app.useplunk.com",
    "Verify the test event appears in your events log",
    "Check the test email in inbox: your-email@example.com",
    "Review the contact data in your contacts list"
  ]
}
```

---

## ✅ Quick Verification Checklist

After restarting:

- [ ] Dev server restarted successfully
- [ ] Test endpoint returns `"success": true`
- [ ] Test email received in inbox
- [ ] Event visible in [Plunk Dashboard](https://app.useplunk.com)
- [ ] Contact created in Plunk contacts list

---

## 🚀 Once Working, Try These:

### 1. Test Newsletter Signup Component

Add to any page to test:

```tsx
import { NewsletterSignup } from '@/components/marketing/NewsletterSignup';

export default function TestPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Test Newsletter Signup</h1>
      <NewsletterSignup />
    </div>
  );
}
```

### 2. Track a Custom Event

In any component:

```tsx
'use client';

import { usePlunk } from '@/lib/hooks/usePlunk';

export function TestButton() {
  const { trackEvent, loading } = usePlunk();

  const handleClick = async () => {
    await trackEvent({
      event: 'test.button.clicked',
      email: 'your-email@example.com',
      data: {
        timestamp: new Date().toISOString(),
        page: 'test-page'
      }
    });
    alert('Event tracked! Check Plunk dashboard.');
  };

  return (
    <button onClick={handleClick} disabled={loading}>
      {loading ? 'Tracking...' : 'Track Test Event'}
    </button>
  );
}
```

### 3. Send a Test Welcome Email

Create a test API route:

```typescript
// app/api/test-welcome/route.ts
import { getEmailService } from '@/lib/services/email-service';
import { NextResponse } from 'next/server';

export async function POST() {
  const emailService = getEmailService();
  
  await emailService.sendWelcomeEmail(
    'your-email@example.com',
    'Test User'
  );
  
  return NextResponse.json({ success: true });
}
```

Then test with:
```bash
curl -X POST http://localhost:3000/api/test-welcome
```

---

## 🐛 Troubleshooting

### Issue: Still getting "API key not set" error

**Solution:** 
1. Check your `.env` file has: `PLUNK_API_KEY=sk_your_actual_key`
2. Make sure there are no spaces around the `=`
3. Ensure the file is named exactly `.env` (not `.env.local` or `.env.example`)
4. Restart your dev server completely

### Issue: API key looks correct but still not working

**Solution:**
```bash
# Verify the key is being loaded
node -e "require('dotenv').config(); console.log('PLUNK_API_KEY:', process.env.PLUNK_API_KEY ? 'Found ✓' : 'Not found ✗')"
```

### Issue: Getting 401 Unauthorized from Plunk

**Solution:**
1. Verify your API key in [Plunk Dashboard](https://app.useplunk.com) → Settings → API Keys
2. Make sure you copied the full key including the `sk_` prefix
3. Generate a new key if needed

---

## 📧 Next Steps After Successful Test

1. ✅ **Set up automations** in [Plunk Dashboard](https://app.useplunk.com)
2. ✅ **Add newsletter signup** to your footer
3. ✅ **Integrate into signup flow** (see `PLUNK_INTEGRATION_GUIDE.md`)
4. ✅ **Track credit purchases** (see example implementations)
5. ✅ **Monitor performance** in Plunk analytics

---

## 📚 Documentation

- **[Quick Start](./QUICK_START_PLUNK.md)** - 5-minute guide
- **[Full Guide](./PLUNK_INTEGRATION_GUIDE.md)** - Complete documentation
- **[Setup Complete](./PLUNK_SETUP_COMPLETE.md)** - What was created
- **[Files Overview](./PLUNK_FILES_OVERVIEW.md)** - All files reference

---

**Need Help?** Check the troubleshooting section above or review the [Integration Guide](./PLUNK_INTEGRATION_GUIDE.md).


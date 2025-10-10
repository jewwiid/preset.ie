# Email System Quick Reference

## 🚀 How to Send an Email

### 1. Using Event Classes (Recommended)

```typescript
import { OnboardingEvents } from '@/lib/services/emails/events/onboarding.events';

const onboarding = new OnboardingEvents();
await onboarding.sendWelcomeEmail(
  authUserId,
  'user@example.com',
  'John Doe',
  'TALENT'
);
```

### 2. Using Plunk Directly

```typescript
import { getPlunkService } from '@/../../packages/adapters/src/external/PlunkService';
import { getWelcomeEmailTemplate } from '@/lib/services/emails/templates';

const plunk = getPlunkService();
await plunk.sendTransactionalEmail({
  to: 'user@example.com',
  subject: 'Welcome to Preset',
  body: getWelcomeEmailTemplate(name, role, description, email, userId)
});
```

---

## 📋 All Email Event Classes

```typescript
// Import available event classes
import { OnboardingEvents } from '@/lib/services/emails/events/onboarding.events';
import { GigEvents } from '@/lib/services/emails/events/gigs.events';
import { ApplicationEvents } from '@/lib/services/emails/events/applications.events';
import { MessagingEvents } from '@/lib/services/emails/events/messaging.events';
import { ShowcaseEvents } from '@/lib/services/emails/events/showcases.events';
import { ReviewEvents } from '@/lib/services/emails/events/reviews.events';
import { CreditsEvents } from '@/lib/services/emails/events/credits.events';
import { MarketplaceEvents } from '@/lib/services/emails/events/marketplace.events';
import { EngagementEvents } from '@/lib/services/emails/events/engagement.events';
```

---

## 🎯 Common Use Cases

### Send Welcome Email After Signup

```typescript
// In apps/web/app/api/auth/verify/route.ts
import { sendWelcomeAfterVerification } from '@/lib/services/emails/events/verification.events';

await sendWelcomeAfterVerification({
  authUserId: user.id,
  email: user.email,
  name: user.full_name,
  role: user.role
});
```

### Notify User of New Application

```typescript
// When talent applies to a gig
const gigEvents = new GigEvents();
await gigEvents.sendNewApplicationNotification(
  contributorId,
  contributorEmail,
  gigTitle,
  applicantName,
  applicantId,
  applicationUrl
);
```

### Send Credits Low Warning

```typescript
// In credits monitoring cron job
const creditsEvents = new CreditsEvents();
await creditsEvents.sendCreditsLowWarning(
  userId,
  userEmail,
  userName,
  currentBalance,
  userTier,
  topUpUrl
);
```

---

## ⚙️ Email Preference Checking

### Check if User Should Receive Email

```typescript
import { getEmailPreferenceChecker } from '@/lib/services/email-preference-checker.service';

const checker = getEmailPreferenceChecker();
const { shouldSend, reason } = await checker.shouldSendEmail(authUserId, 'gig');

if (shouldSend) {
  // Send email
} else {
  console.log(`Email skipped: ${reason}`);
}
```

### Preference Categories

- `'gig'` - Gig notifications
- `'application'` - Application updates
- `'message'` - Messages
- `'booking'` - Booking & collaboration
- `'system'` - Account & system
- `'marketing'` - Marketing & tips

---

## 🔧 Database Triggers

### Create a New Email Trigger

```sql
CREATE OR REPLACE FUNCTION trigger_my_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM call_email_api(
    '/api/emails/my-endpoint',
    jsonb_build_object(
      'authUserId', NEW.user_id,
      'email', NEW.email,
      'data', NEW.some_data
    )
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER my_email_trigger
AFTER INSERT ON my_table
FOR EACH ROW
EXECUTE FUNCTION trigger_my_email();
```

---

## 📊 Email Logs

### Check Recent Email Activity

```sql
-- Recent emails
SELECT * FROM email_logs 
ORDER BY created_at DESC 
LIMIT 20;

-- Failed emails
SELECT * FROM email_logs 
WHERE status = 'failed' 
ORDER BY created_at DESC;

-- Emails by endpoint
SELECT endpoint, COUNT(*), 
  SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as success_count
FROM email_logs 
GROUP BY endpoint;
```

---

## 🎨 Create New Email Template

### 1. Create Template Function

```typescript
// In apps/web/lib/services/emails/templates/myCategory.templates.ts

import { getEmailTemplate } from './shared.templates';

export function getMyEmailTemplate(
  recipientName: string,
  data: any,
  userEmail?: string,
  userId?: string
): string {
  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #1a1a1a; font-size: 28px; font-weight: 700;">
        My Email Title
      </h1>
    </div>

    <div style="background-color: #f9fafb; border-radius: 12px; padding: 25px;">
      <p style="color: #4b5563; font-size: 15px;">
        Email content here
      </p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="https://presetie.com/action" 
         style="display: inline-block; 
                background: linear-gradient(135deg, #00876f 0%, #00a389 100%); 
                color: white; 
                padding: 14px 32px; 
                text-decoration: none; 
                border-radius: 8px; 
                font-weight: 600;">
        Take Action
      </a>
    </div>
  `;

  return getEmailTemplate(content, userEmail, userId);
}
```

### 2. Export from Index

```typescript
// In apps/web/lib/services/emails/templates/index.ts
export * from './myCategory.templates';
```

---

## 🧪 Testing Emails

### Test Single Email

```bash
# Start dev server
npm run dev

# In another terminal
curl -X POST http://localhost:3000/api/emails/welcome \
  -H "Content-Type: application/json" \
  -d '{
    "authUserId": "test-123",
    "name": "Test User",
    "role": "TALENT"
  }'
```

### Run Full Test Suite

```bash
python test_all_email_types.py
```

---

## 🔑 Environment Setup

### Required Variables

```env
# Plunk
PLUNK_API_KEY=sk_...

# App
NEXT_PUBLIC_APP_URL=https://presetie.com

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://...supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

---

## 🚨 Troubleshooting

### Email Not Sending

1. **Check Plunk API key**: `echo $PLUNK_API_KEY`
2. **Check email logs**: `SELECT * FROM email_logs WHERE status = 'failed';`
3. **Check preference**: User might have opted out
4. **Check Plunk dashboard**: Look for API errors

### Trigger Not Firing

1. **Verify trigger exists**: `SELECT * FROM pg_trigger WHERE tgname = 'my_trigger';`
2. **Check function**: `SELECT pg_get_functiondef('trigger_my_email'::regproc);`
3. **Test manually**: Execute trigger function directly
4. **Check pg_net**: `SELECT * FROM pg_extension WHERE extname = 'pg_net';`

### Template Not Rendering

1. **Check template export**: Is it exported from `index.ts`?
2. **Check imports**: Are all dependencies imported?
3. **Check syntax**: Run `npm run check-types`
4. **Test template**: Call template function directly

---

## 📞 Support

For email system issues:

1. Check [COMPLETE-EMAIL-SYSTEM.md](./COMPLETE-EMAIL-SYSTEM.md)
2. Review [EMAIL-PREFERENCES-SYSTEM.md](./EMAIL-PREFERENCES-SYSTEM.md)
3. Check Plunk dashboard for delivery logs
4. Review `email_logs` table for trigger issues

---

_Last updated: October 10, 2025_


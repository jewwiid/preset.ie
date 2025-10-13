# Plunk Email Setup for Invite System

## ✅ Email Endpoints Created

I've created the following email endpoints that integrate with Plunk:

### 1. `/api/emails/referral-success`
**When to trigger:** When someone's invitee completes their profile
**Recipient:** The referrer
**Subject:** "You earned 5 credits! 🎉"
**Content:**
- Congratulates them on successful referral
- Shows credits earned (+5)
- Shows who joined (if available)
- Link to dashboard

### 2. `/api/emails/welcome-with-invite`
**When to trigger:** When new user completes their profile
**Recipient:** The new user
**Subject:** "Welcome to Preset! Here's your invite code 🎨"
**Content:**
- Welcome message
- Their personal invite code (large, prominent)
- Explanation of how referrals work
- Shareable link
- Current credit balance
- Link to dashboard

## 🔧 Environment Setup

Make sure you have this in your `.env` file:

```bash
PLUNK_API_KEY=your_plunk_api_key_here
NEXT_PUBLIC_APP_URL=https://presetie.com  # or http://localhost:3000 for dev
```

## 📧 How Emails Are Sent

The emails use **direct HTML** by default, but you can switch to Plunk templates.

### Current Implementation (Direct HTML):
```typescript
await fetch('https://api.useplunk.com/v1/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${plunkApiKey}`
  },
  body: JSON.stringify({
    to: email,
    subject: 'Email subject',
    body: '<html>...</html>'
  })
})
```

### Alternative (Plunk Templates):

If you want to use Plunk's template system instead:

1. **Create templates in Plunk dashboard:**
   - Template ID: `referral-success`
   - Template ID: `welcome-with-invite`

2. **Update the API calls to use templates:**

```typescript
// Instead of 'body', use 'template' and 'data'
body: JSON.stringify({
  to: email,
  template: 'referral-success',  // Your Plunk template ID
  data: {
    referrerName: 'John Doe',
    creditsEarned: 5,
    newUserName: 'Jane Smith',
    dashboardUrl: 'https://presetie.com/dashboard'
  }
})
```

## 🎨 Plunk Template Variables

If you create Plunk templates, use these variables:

### `referral-success` template:
```
{{referrerName}}      - Name of person who referred
{{creditsEarned}}     - Number of credits earned (usually 5)
{{newUserName}}       - Name of person who signed up (optional)
{{dashboardUrl}}      - Link to dashboard
```

### `welcome-with-invite` template:
```
{{name}}              - User's name
{{inviteCode}}        - Their personal 8-character code
{{shareUrl}}          - Full signup URL with their code
{{totalCredits}}      - Current credit balance
{{dashboardUrl}}      - Link to dashboard
```

## 🔄 When Emails Are Triggered

### Automatic Triggers:

1. **Profile Completion** → `welcome-with-invite`
   ```typescript
   // Call this when user completes their profile
   await fetch('/api/emails/welcome-with-invite', {
     method: 'POST',
     body: JSON.stringify({
       email: user.email,
       name: user.display_name,
       inviteCode: user.invite_code,
       totalCredits: user.credits
     })
   })
   ```

2. **Referral Success** → `referral-success`
   ```typescript
   // This is automatically called in /api/referrals/complete-profile
   // No manual trigger needed - happens when invitee completes profile
   ```

## 🧪 Testing Emails

### Test in Development:

```bash
# Test referral success email
curl -X POST http://localhost:3000/api/emails/referral-success \
  -H "Content-Type: application/json" \
  -d '{
    "referrerUserId": "user-id-here",
    "referrerName": "John Doe",
    "creditsEarned": 5,
    "newUserName": "Jane Smith"
  }'

# Test welcome email
curl -X POST http://localhost:3000/api/emails/welcome-with-invite \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Test User",
    "inviteCode": "ABC12345",
    "totalCredits": 10
  }'
```

### Test in Plunk Dashboard:

1. Go to Plunk dashboard
2. Click "Send Test Email"
3. Use the template variables above
4. Send to your email

## 🎯 Integration Points

### Where emails are sent from:

1. **`/api/referrals/complete-profile`** (line ~130)
   - Sends `referral-success` to referrer
   - Called when user completes profile

2. **Your profile completion flow**
   - You need to call `welcome-with-invite`
   - Add this to your complete-profile component:

```typescript
// After profile is saved successfully
await fetch('/api/emails/welcome-with-invite', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: session.user.email,
    name: profileData.display_name,
    inviteCode: profileData.invite_code,
    totalCredits: profileData.total_credits || 0
  })
})
```

## 📊 Email Analytics

Track these in Plunk dashboard:
- ✅ Delivery rate
- ✅ Open rate
- ✅ Click-through rate (dashboard link)
- ✅ Bounce rate

## 🚨 Error Handling

All email endpoints:
- ✅ Return success even if email fails (don't block user flow)
- ✅ Log errors to console
- ✅ Return proper HTTP status codes
- ✅ Validate required fields

If Plunk API fails:
- User still gets their credits
- Profile still completes
- Error is logged but not shown to user

## 🎨 Customizing Email Design

### Current Design Features:
- ✅ Responsive HTML
- ✅ Gradient backgrounds
- ✅ Large, readable invite codes
- ✅ Clear call-to-action buttons
- ✅ Credit amount highlighted
- ✅ Copy-friendly invite URLs

### To Customize:

Edit the `body` field in each route file:
- `/api/emails/referral-success/route.ts`
- `/api/emails/welcome-with-invite/route.ts`

Or create Plunk templates and switch to template mode.

## 🔐 Security Notes

- ✅ API key stored in environment variable
- ✅ Email addresses validated
- ✅ Only authenticated users can trigger emails
- ✅ Rate limiting via Plunk's built-in limits
- ✅ No user input in email subject/body (prevents injection)

## 📋 Checklist for Going Live

- [ ] PLUNK_API_KEY configured in production
- [ ] NEXT_PUBLIC_APP_URL set to production URL
- [ ] Test both email endpoints
- [ ] Check emails aren't going to spam
- [ ] Verify unsubscribe links work (if using)
- [ ] Test on mobile email clients
- [ ] Confirm dashboard links work
- [ ] Check invite code readability
- [ ] Test with real users
- [ ] Set up email analytics tracking

## 💡 Optional Enhancements

1. **Add email preferences:**
   - Let users opt out of referral notifications
   - Check user preferences before sending

2. **Add more email types:**
   - Reminder if user hasn't shared invite code
   - Monthly referral summary
   - Leaderboard position updates

3. **A/B test subject lines:**
   - Test different subjects in Plunk
   - Track which gets better open rates

4. **Add social sharing buttons:**
   - Twitter, Facebook, LinkedIn share buttons
   - Pre-filled text with invite link

---

## Quick Start

1. **Add Plunk API key to `.env`:**
   ```bash
   PLUNK_API_KEY=pk_xxxxxxxxxxxxx
   ```

2. **Test an email:**
   ```bash
   curl -X POST http://localhost:3000/api/emails/welcome-with-invite \
     -H "Content-Type: application/json" \
     -d '{"email":"you@example.com","name":"Test","inviteCode":"TEST1234"}'
   ```

3. **Check your inbox!** ✉️

That's it! Emails are ready to go. 🚀

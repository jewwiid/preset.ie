# Email Verification via Plunk - Complete Setup Guide

## Overview

Custom email verification system using Plunk with branded emails. This replaces Supabase's default verification emails.

## Architecture

```
1. User Signs Up
   ↓
2. Profile Created → verification_email_trigger fires
   ↓
3. Verification Email Sent (Plunk)
   ↓
4. User Clicks Link → /api/auth/verify
   ↓
5. email_verified = TRUE → welcome_after_verification_trigger fires
   ↓
6. Welcome Email Sent (Plunk)
```

## Files Created

### Templates
- `apps/web/lib/services/emails/templates/verification.templates.ts`
  - `getVerifyEmailTemplate()` - Branded verification email
  - `getWelcomeAfterVerificationTemplate()` - Welcome email after verification

### Email Events
- `apps/web/lib/services/emails/events/verification.events.ts`
  - `sendVerificationEmail()` - Sends verification email
  - `sendWelcomeAfterVerification()` - Sends welcome email after verification

### API Endpoints
- `apps/web/app/api/emails/verify-email/route.ts` - Called by trigger to send verification
- `apps/web/app/api/emails/welcome-verified/route.ts` - Called by trigger to send welcome
- `apps/web/app/api/auth/verify/route.ts` - Handles verification link clicks

### Pages
- `apps/web/app/auth/verification-success/page.tsx` - Success page
- `apps/web/app/auth/verification-error/page.tsx` - Error page with reasons

### Database
- `supabase/migrations/20251009240000_add_email_verification.sql`
  - Adds `email_verified` and `email_verified_at` columns
  - Creates `verification_email_trigger` (sends verification on signup)
  - Creates `welcome_after_verification_trigger` (sends welcome after verification)
  - Removes old `welcome_email_trigger`

## Deployment Steps

### 1. Disable Supabase Email Verification
```
Supabase Dashboard → Authentication → Settings → Email Auth
→ Turn OFF "Confirm email"
```

### 2. Run Database Migration (PRODUCTION)
```sql
-- Run this in your PRODUCTION Supabase Studio:
supabase/migrations/20251009240000_add_email_verification.sql
```

### 3. Deploy Code to Production
Ensure these files are deployed:
- All new API routes (`/api/emails/verify-email`, `/api/auth/verify`, etc.)
- Email templates and event functions
- Verification success/error pages

### 4. Verify Environment Variables
```
PLUNK_API_KEY=sk_...
NEXT_PUBLIC_APP_URL=https://presetie.com
```

### 5. Test the Flow

**Step 1: Sign up a new user**
- Go to https://presetie.com/auth/signup
- Fill in details and create account

**Step 2: Check email_logs**
```sql
SELECT * FROM email_logs 
WHERE endpoint = '/api/emails/verify-email'
ORDER BY created_at DESC LIMIT 1;
```
Should show status = 'sent'

**Step 3: Check inbox**
- User receives verification email (Plunk-branded)
- Click "Verify Email Address" button

**Step 4: After clicking**
- Redirects to `/auth/verification-success`
- Check email_logs again:
```sql
SELECT * FROM email_logs 
WHERE endpoint = '/api/emails/welcome-verified'
ORDER BY created_at DESC LIMIT 1;
```
Should show welcome email sent!

**Step 5: Check inbox again**
- User receives welcome email

## Verification Token Format

Token: `{userId}:{timestamp}:{randomString}`

Example: `abc-123:1760049588:f3b2c9a1e7d4`

- **userId**: Auth user ID
- **timestamp**: Unix timestamp (for expiry check)
- **randomString**: Random 16-character hash
- **Expiry**: 24 hours

## Email Flow

### Verification Email
- **Subject**: "Verify Your Email - Preset"
- **Content**: 
  - Branded header
  - Verification button
  - Expires in 24 hours notice
  - Alternative text link
- **Sent**: Immediately on signup

### Welcome Email (After Verification)
- **Subject**: "Welcome to Preset - Email Verified"
- **Content**:
  - Success message
  - Role-specific next steps
  - Getting started checklist
  - CTA based on role (Complete Profile / Browse Talent / Explore)
- **Sent**: After clicking verification link

## Triggers

### 1. verification_email_trigger
- **Event**: AFTER INSERT on users_profile
- **Action**: Sends verification email via Plunk
- **Payload**: authUserId, email, name, verificationToken

### 2. welcome_after_verification_trigger  
- **Event**: AFTER UPDATE on users_profile
- **Condition**: email_verified changes from FALSE → TRUE
- **Action**: Sends welcome email via Plunk
- **Payload**: authUserId, email, name, role

## Monitoring

### Check Verification Status
```sql
SELECT 
  up.display_name,
  up.email_verified,
  up.email_verified_at,
  up.created_at,
  au.email
FROM users_profile up
JOIN auth.users au ON up.user_id = au.id
ORDER BY up.created_at DESC
LIMIT 10;
```

### Check Verification Emails Sent
```sql
SELECT 
  endpoint,
  payload->>'email' as email,
  payload->>'name' as name,
  status,
  error,
  created_at
FROM email_logs
WHERE endpoint IN ('/api/emails/verify-email', '/api/emails/welcome-verified')
ORDER BY created_at DESC
LIMIT 20;
```

## Troubleshooting

### No verification email received
1. Check email_logs for entry with endpoint '/api/emails/verify-email'
2. Check status is 'sent' not 'failed'
3. Verify PLUNK_API_KEY is set in production
4. Check spam folder

### Verification link doesn't work
1. Check token hasn't expired (< 24 hours)
2. Check user exists in database
3. Check email_verified column exists in users_profile

### No welcome email after verification
1. Check email_logs for '/api/emails/welcome-verified' entry
2. Verify welcome_after_verification_trigger exists
3. Check email_verified was updated to TRUE

## Security Considerations

- ✅ Tokens expire after 24 hours
- ✅ Tokens include user ID validation
- ✅ One-time use (email_verified can only go FALSE → TRUE once)
- ✅ HTTPS only in production
- ✅ Server-side validation

## Next Steps

After verification works:
1. Add "Resend verification email" feature
2. Add verification reminder emails (1 day, 3 days, 7 days)
3. Track verification conversion rates
4. A/B test verification email subject lines


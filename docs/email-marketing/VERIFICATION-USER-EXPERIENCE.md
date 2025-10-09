# Email Verification - Complete User Experience

## Overview

Anti-spam email verification flow with clear user messaging at every step.

---

## User Journey

### 1️⃣ **User Signs Up**

**What happens:**
- User fills signup form (name, email, password, role, DOB)
- Clicks "Create account"
- Account created in `auth.users` (NO PROFILE YET)
- Verification email sent immediately via Plunk

**User sees:**
```
✅ Account created! 
Please check your email to verify your account.
```

**Database state:**
- ✅ Entry in `auth.users` (email, password hash, metadata)
- ❌ NO entry in `users_profile` (prevents spam)
- ✅ Entry in `email_logs` (verification email sent)

---

### 2️⃣ **User Receives Verification Email**

**Email content:**
- Subject: "Verify Your Email - Preset"
- Branded Preset design (green #00876f theme)
- Clear "Verify Email Address" button
- Alternative text link (if button doesn't work)
- Expires in 24 hours notice

**What user should do:**
- Open email
- Click "Verify Email Address" button
- OR copy/paste verification link

---

### 3️⃣ **User Tries to Sign In (Before Verification)**

**What happens:**
- User enters email/password
- Authentication succeeds (user exists)
- System checks for profile → NOT FOUND
- Redirects to `/auth/verification-pending`

**User sees:**
```
🔒 Verify Your Email

You cannot access the platform until you verify your email

This helps us prevent spam and keep the community safe.

A verification email has been sent to:
[their-email@example.com]

Please check your inbox and click the verification link to:
✓ Activate your account
✓ Access the full platform  
✓ Start collaborating

[Resend Verification Email Button]
```

**Why this is good UX:**
- ✅ Clear explanation WHY they can't access
- ✅ Shows their email address
- ✅ Provides resend option
- ✅ Doesn't feel like an error (helpful tone)

---

### 4️⃣ **User Clicks Verification Link**

**What happens:**
- Link format: `https://presetie.com/api/auth/verify?token={userId}:{timestamp}:{signature}`
- Backend validates token (checks expiry, format)
- Profile created from user_metadata with `email_verified=TRUE`
- `welcome_after_verification_trigger` fires
- Welcome email sent automatically
- Redirects to `/auth/verification-success`

**User sees:**
```
✅ Email Verified Successfully

Welcome to Preset, [Name]!

Your email has been verified. You can now access all features of Preset.

Check your inbox for a welcome email with next steps!

[Go to Dashboard Button]
```

**Database state:**
- ✅ Entry in `users_profile` (with email_verified=TRUE)
- ✅ New entry in `email_logs` (welcome email sent)
- ✅ User can now access platform

---

### 5️⃣ **User Receives Welcome Email**

**Email content:**
- Subject: "Welcome to Preset - Email Verified"
- Success checkmark icon
- Personalized greeting with name
- Role-specific content:
  - **TALENT**: "Your Creative Journey Starts Now" → Complete Profile
  - **CONTRIBUTOR**: "Start Finding Amazing Talent" → Browse Talent
  - **BOTH**: "Welcome to the Creative Community" → Explore Preset
- Getting started checklist
- Branded CTA button

---

### 6️⃣ **User Signs In (After Verification)**

**What happens:**
- User enters email/password
- Authentication succeeds
- System finds profile with email_verified=TRUE
- Redirects to dashboard

**User sees:**
- Dashboard (full access)
- All features unlocked
- Normal user experience

---

## Error Scenarios

### Expired Token (> 24 hours)

**User sees:**
```
❌ Verification Link Expired

This verification link has expired.

[Sign Up Again Button]
[Sign In Button]
```

### Invalid Token

**User sees:**
```
❌ Invalid Verification Token

The verification link is invalid or has been tampered with.

[Sign Up Again Button]
```

### Already Verified

**What happens:**
- If user clicks link again after already verifying
- System detects email_verified=TRUE
- Redirects directly to dashboard

---

## Anti-Spam Benefits

### What We Prevent:

❌ **Fake signups polluting database**
- No profile created until verified

❌ **Bot signups**
- Requires email access to verify

❌ **Disposable email abuse**
- User must receive and click email

❌ **Multiple fake accounts**
- Each needs unique, accessible email

### What Users Get:

✅ **Clean, active community**
- All users are real, verified people

✅ **Trusted connections**
- Know everyone verified their email

✅ **Better security**
- Reduces spam messages/gigs

---

## Technical Implementation

### No Profile = No Access

**Protected routes check:**
```typescript
if (!profile) {
  // User hasn't verified email
  redirect('/auth/verification-pending')
}
```

**Applied to:**
- Dashboard
- Gigs
- Marketplace
- Messages
- All user actions

### Sign In Flow

```
User enters credentials
↓
Auth succeeds (user exists in auth.users)
↓
Check for profile in users_profile
↓
No profile? → /auth/verification-pending
↓
Profile exists? → /dashboard
```

### Verification Token Security

**Format**: `{userId}:{timestamp}:{randomString}`

**Validation:**
- ✅ Valid UUID for userId
- ✅ Timestamp within 24 hours
- ✅ Three-part format

**Security:**
- Tokens expire (24 hours)
- One-time use (email_verified can't go TRUE → TRUE)
- Server-side validation only
- HTTPS only in production

---

## Monitoring

### Check Unverified Users

```sql
SELECT 
  au.email,
  au.created_at as signup_date,
  EXTRACT(EPOCH FROM (NOW() - au.created_at))/3600 as hours_since_signup
FROM auth.users au
LEFT JOIN users_profile up ON au.id = up.user_id
WHERE up.id IS NULL
ORDER BY au.created_at DESC;
```

### Check Verification Emails Sent

```sql
SELECT 
  payload->>'email' as email,
  payload->>'name' as name,
  status,
  created_at,
  CASE 
    WHEN status = 'sent' THEN '✅'
    WHEN status = 'failed' THEN '❌'
    ELSE '⏳'
  END as status_icon
FROM email_logs
WHERE endpoint = '/api/emails/verify-email'
ORDER BY created_at DESC
LIMIT 20;
```

### Verification Conversion Rate

```sql
-- Total signups vs verified users
SELECT 
  COUNT(DISTINCT au.id) as total_signups,
  COUNT(DISTINCT up.id) as verified_users,
  ROUND(COUNT(DISTINCT up.id)::NUMERIC / NULLIF(COUNT(DISTINCT au.id), 0) * 100, 2) as verification_rate
FROM auth.users au
LEFT JOIN users_profile up ON au.id = up.user_id;
```

---

## Future Enhancements

1. **Verification Reminders**
   - Send reminder after 24 hours if not verified
   - Send final reminder after 7 days
   - Delete unverified accounts after 30 days

2. **Resend Verification**
   - ✅ Already implemented on verification-pending page
   - Track resend attempts
   - Rate limit (max 3 per hour)

3. **Email Change Flow**
   - If user changes email, require re-verification
   - Send verification to new email
   - Keep old email until verified

4. **Analytics Dashboard**
   - Verification funnel (signup → verify → complete profile)
   - Drop-off points
   - Email delivery rates

---

## Testing Checklist

### Signup Flow
- [ ] User fills form
- [ ] Account created
- [ ] Verification email received
- [ ] Email has correct branding
- [ ] Verification button works

### Before Verification
- [ ] User tries to sign in
- [ ] Redirected to verification-pending
- [ ] Clear message shown
- [ ] Resend button works
- [ ] Cannot access dashboard/gigs/marketplace

### Verification
- [ ] Click verification link
- [ ] Profile created
- [ ] Welcome email received
- [ ] Redirected to success page
- [ ] Can now access platform

### After Verification
- [ ] User signs in successfully
- [ ] Redirected to dashboard
- [ ] Full platform access
- [ ] Can create gigs, message, etc.

### Edge Cases
- [ ] Expired token shows clear error
- [ ] Invalid token shows clear error
- [ ] Already verified user clicking link → dashboard
- [ ] Resend verification works
- [ ] Multiple resends within short time handled


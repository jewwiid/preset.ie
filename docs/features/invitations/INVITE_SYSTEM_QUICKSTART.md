# Invite System - Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### Step 1: Run the Database Migration
```bash
# If using Supabase CLI
supabase migration new create_invite_system
# Copy contents from migrations/create_invite_system.sql
supabase db push

# OR connect directly to your database
psql YOUR_DATABASE_URL -f migrations/create_invite_system.sql
```

### Step 2: Verify Migration Success
Check that these tables were created:
- ✅ `platform_settings`
- ✅ `invite_codes` (should have 10 initial codes)
- ✅ `referral_credits`
- ✅ `users_profile` (updated with new columns)

```sql
-- Quick verification query
SELECT COUNT(*) FROM invite_codes WHERE status = 'active';
-- Should return: 10 (initial admin codes)
```

### Step 3: Enable Invite-Only Mode
1. Navigate to `https://yoursite.com/admin`
2. Click on "Invite System" tab
3. Toggle "Require invite codes for signup" to **ON**
4. You'll see 10 pre-generated invite codes ready to use

### Step 4: Test the System

#### Test Signup with Invite Code
1. Go to signup page: `/auth/signup`
2. Notice the "Invite Code" field appears
3. Enter one of the admin codes (e.g., `ABC12345`)
4. Complete signup form
5. Code should validate ✅
6. After email verification and profile completion, you should get your own invite code

#### Test Signup without Code
1. Try signing up without entering a code
2. Should see error: "An invite code is required to sign up"
3. This confirms invite-only mode is working ✅

### Step 5: Award Referral Credits
When a user completes their profile, call the completion endpoint:

```typescript
// In your profile completion flow
await fetch('/api/referrals/complete-profile', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${userToken}` }
})
```

This will:
- Mark profile as completed
- Award 5 credits to referrer (if invited)
- Generate invite code for new user
- Send notification emails

## 🎯 Quick Reference

### Admin URLs
- **Dashboard**: `/admin`
- **Invite System**: `/admin` → "Invite System" tab

### User URLs
- **Signup with Code**: `/auth/signup?invite=CODE123`
- **Regular Signup**: `/auth/signup`

### API Endpoints

#### Check if invite-only mode is active
```bash
curl https://yoursite.com/api/auth/validate-invite
```

#### Validate an invite code
```bash
curl -X POST https://yoursite.com/api/auth/validate-invite \
  -H "Content-Type: application/json" \
  -d '{"code":"ABC12345"}'
```

#### Toggle invite-only mode (admin only)
```bash
curl -X POST https://yoursite.com/api/admin/settings/invite-mode \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{"enabled":true}'
```

#### Get user's referral stats
```bash
curl https://yoursite.com/api/referrals \
  -H "Authorization: Bearer USER_TOKEN"
```

## 📊 Common Tasks

### Generate More Invite Codes
1. Admin Dashboard → Invite System
2. Click "Generate 5 Codes" or "Generate 10 Codes"
3. Copy codes from the list below
4. Share with users

### View Referral Statistics
```sql
-- Total referrals
SELECT COUNT(*) FROM referral_credits WHERE status = 'awarded';

-- Pending referrals
SELECT COUNT(*) FROM referral_credits WHERE status = 'pending';

-- Credits awarded
SELECT SUM(credits_awarded) FROM referral_credits WHERE status = 'awarded';

-- Top referrers
SELECT
  up.display_name,
  up.total_referrals,
  COUNT(rc.id) as completed_referrals
FROM users_profile up
LEFT JOIN referral_credits rc ON rc.referrer_user_id = up.id AND rc.status = 'awarded'
GROUP BY up.id, up.display_name, up.total_referrals
ORDER BY up.total_referrals DESC
LIMIT 10;
```

### Disable Invite-Only Mode
1. Admin Dashboard → Invite System
2. Toggle OFF
3. Users can now sign up without codes
4. Referral system continues to work

### Find Unused Codes
```sql
SELECT code, created_at
FROM invite_codes
WHERE status = 'active'
  AND created_by_user_id IS NULL
ORDER BY created_at DESC;
```

## 🐛 Troubleshooting

### Issue: "Invite code required" but mode is OFF
**Solution:** Clear browser cache or check:
```sql
SELECT value FROM platform_settings WHERE key = 'invite_only_mode';
```

### Issue: Credits not being awarded
**Check:**
1. Profile completion endpoint is being called
2. User has `invited_by_code` in their profile
3. Invite code exists and is valid
4. Check `referral_credits` table for records

### Issue: User didn't get invite code after signup
**Fix:** Manually generate one:
```sql
-- Get a new code
SELECT generate_invite_code();

-- Assign to user
UPDATE users_profile
SET invite_code = 'NEWCODE123'
WHERE user_id = 'user-id-here';

-- Create code record
INSERT INTO invite_codes (code, created_by_user_id, status)
VALUES ('NEWCODE123', 'profile-id-here', 'active');
```

## 🎨 Customization

### Change Credit Amount
Edit the profile completion endpoint:
```typescript
// In apps/web/app/api/referrals/complete-profile/route.ts
credits_awarded: 10 // Change from 5 to 10
```

### Change Code Expiration
```typescript
// When generating admin codes
expires_at: NOW() + INTERVAL '180 days' // Change from 90 days
```

### Custom Invite Code Format
Edit the `generate_invite_code()` function in the migration:
```sql
-- Current: 8-character alphanumeric
-- Change to 6-character or add prefix/suffix
new_code := 'PRESET-' || upper(substring(md5(random()::text) from 1 for 6));
```

## 📧 Email Templates (Plunk)

Create these templates in your Plunk dashboard:

### 1. Welcome Email (on signup)
**Template ID:** `welcome-with-code`
**Variables:** `{{name}}`, `{{inviteCode}}`, `{{shareUrl}}`

### 2. Referral Success (when invitee completes profile)
**Template ID:** `referral-success`
**Variables:** `{{referrerName}}`, `{{creditsEarned}}`, `{{newUserName}}`

### 3. Profile Completion (with invite code)
**Template ID:** `profile-completed`
**Variables:** `{{name}}`, `{{inviteCode}}`, `{{totalCredits}}`

## 🔗 Integration with Your App

### Profile Completion Flow
```typescript
// After user completes their profile
const response = await fetch('/api/referrals/complete-profile', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${session.access_token}`
  }
})

const data = await response.json()

if (data.creditsAwarded) {
  // Show success message: "You earned 5 credits from referrals!"
  showSuccessToast('Your referrer earned 5 credits!')
}

// User now has their own invite code
const { data: profile } = await supabase
  .from('users_profile')
  .select('invite_code')
  .eq('user_id', user.id)
  .single()

// Display their code: profile.invite_code
```

### Display User's Invite Code
```typescript
// In user dashboard
const shareUrl = `${window.location.origin}/auth/signup?invite=${inviteCode}`

// Copy button
<Button onClick={() => navigator.clipboard.writeText(shareUrl)}>
  Copy Invite Link
</Button>
```

## 🚦 Go Live Checklist

Before enabling invite-only mode in production:

- [ ] Database migration completed successfully
- [ ] Generated at least 50 admin invite codes
- [ ] Tested signup flow with valid code
- [ ] Tested signup rejection without code
- [ ] Verified credits are awarded correctly
- [ ] Email templates configured in Plunk
- [ ] Admin dashboard accessible
- [ ] RLS policies tested
- [ ] Analytics/monitoring in place
- [ ] Support team briefed on new system

## 📈 Success Metrics

Track these KPIs:

1. **Invite Conversion Rate**: (Used codes / Total codes) × 100
2. **Profile Completion Rate**: (Completed profiles / Signups) × 100
3. **Referral Chain Length**: Average referrals per user
4. **Time to Completion**: Days from signup to profile completion
5. **Credit Velocity**: Credits awarded per day

---

## Need Help?

- Check the full documentation: [`INVITE_SYSTEM_IMPLEMENTATION.md`](./INVITE_SYSTEM_IMPLEMENTATION.md)
- Review database schema: [`migrations/create_invite_system.sql`](./migrations/create_invite_system.sql)
- Contact support: support@presetie.com

Happy inviting! 🎉

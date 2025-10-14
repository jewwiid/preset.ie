# Testing Guide - New Pricing & CREATOR Tier

## Overview

This guide walks you through testing the new pricing structure, CREATOR tier, and updated credit allowances.

---

## Pre-Test Checklist

✅ All 8 migrations executed successfully in Supabase
✅ Dev server running on port 3000
✅ Stripe test mode enabled
✅ Test user account created with FREE tier

---

## Test 1: Verify Database State

### Check Subscription Tiers
```sql
SELECT * FROM subscription_tiers ORDER BY name;
```

**Expected Result:**
```
FREE    - 15 credits
PLUS    - 150 credits
PRO     - 500 credits
CREATOR - 1500 credits
```

### Check Credit Packages
```sql
SELECT id, name, credits, price_usd, is_popular
FROM credit_packages
WHERE is_active = true
ORDER BY sort_order;
```

**Expected Result:**
```
starter    - 10cr  @ $1.99
basic      - 25cr  @ $4.99
popular    - 50cr  @ $8.99  (is_popular=true)
pro        - 100cr @ $14.99
enterprise - 250cr @ $29.99
creator    - 500cr @ $49.99
```

### Check FREE User Credits
```sql
SELECT
    p.display_name,
    p.subscription_tier,
    c.user_credits,
    c.platform_credits
FROM profiles p
LEFT JOIN user_credits c ON p.user_id = c.user_id
WHERE p.subscription_tier = 'FREE'
LIMIT 5;
```

**Expected Result:** All FREE users should have 15 credits minimum

---

## Test 2: Subscription Page

### Steps:
1. Navigate to `http://localhost:3000/subscription`
2. Sign in with test account

### Verify:
- [ ] 4 tier cards display (FREE, PLUS, PRO, CREATOR)
- [ ] Grid layout: 2 columns on medium screens, 4 on large
- [ ] Icons display correctly:
  - FREE: Star icon
  - PLUS: Zap icon (with "Most Popular" badge)
  - PRO: Crown icon
  - CREATOR: Sparkles icon
- [ ] Credits display:
  - FREE: 15 credits per month
  - PLUS: 150 credits per month
  - PRO: 500 credits per month
  - CREATOR: 1,500 credits per month
- [ ] Prices display:
  - FREE: $0/month
  - PLUS: $9.99/month
  - PRO: $24.99/month
  - CREATOR: $49.99/month
- [ ] Current tier card has "Current Plan" badge
- [ ] All upgrade buttons are clickable

### Screenshots to capture:
- Full subscription page view (desktop)
- Mobile view (responsive grid)
- Hover states on tier cards

---

## Test 3: Credit Purchase Page

### Steps:
1. Navigate to `http://localhost:3000/credits/purchase`
2. Sign in with test account

### Verify:
- [ ] User profile card displays:
  - Avatar/initials
  - Display name
  - Current tier badge (FREE/PLUS/PRO/CREATOR)
  - Handle
- [ ] Credit gauge displays:
  - Current balance in center
  - Circular progress ring
  - Color changes based on balance (green/yellow/red)
- [ ] Credit details cards:
  - Available credits count
  - Used credits count
- [ ] Subscription info:
  - Last reset date
  - Next reset date
  - Progress bar showing cycle
  - Days until reset
  - Subscription tier button

### Credit Packages Grid:
- [ ] 6 packages display in 3 columns
- [ ] Package cards show:
  - Name (Starter, Basic, Popular, Pro, Enterprise, Creator)
  - Credits (10, 25, 50, 100, 250, 500)
  - Price ($1.99, $4.99, $8.99, $14.99, $29.99, $49.99)
  - Savings percentage badge
- [ ] "Popular Pack" has "MOST POPULAR" badge
- [ ] Purchase buttons are enabled
- [ ] Lootbox status card displays (if no lootbox active)

### How Credits Work Section:
- [ ] Info cards display correctly
- [ ] Icons render properly
- [ ] Text is readable and accurate

---

## Test 4: Stripe Subscription Checkout

### Test PLUS Tier Upgrade

**Steps:**
1. Go to `/subscription`
2. Click "Upgrade" on PLUS tier
3. Fill in Stripe test card: `4242 4242 4242 4242`
4. Enter any future expiry date (e.g., 12/25)
5. Enter any 3-digit CVC (e.g., 123)
6. Complete checkout

**Verify:**
- [ ] Redirect to Stripe Checkout page
- [ ] Product shows: "Plus Subscription"
- [ ] Price shows: $9.99/month
- [ ] Description includes: "150 credits per month, 5 monthly bumps"
- [ ] After payment, redirect to success URL
- [ ] Webhook receives `checkout.session.completed`
- [ ] User profile updated to PLUS tier
- [ ] Credits updated to 150

**Database Verification:**
```sql
-- Check subscription
SELECT * FROM subscriptions WHERE user_id = '<profile_id>';

-- Check profile
SELECT subscription_tier FROM profiles WHERE id = '<profile_id>';

-- Check credits
SELECT * FROM user_credits WHERE user_id = '<auth_user_id>';
```

### Test CREATOR Tier Upgrade

**Repeat steps above for CREATOR tier**

**Expected:**
- Product: "Creator Subscription"
- Price: $49.99/month
- Description: "1500 credits per month, 25 monthly bumps"
- Credits updated to 1500

---

## Test 5: Credit Package Purchase

### Test "Popular Pack" Purchase

**Steps:**
1. Go to `/credits/purchase`
2. Click "Buy Credits" on Popular Pack (50 credits @ $8.99)
3. Complete Stripe checkout with test card
4. Return to credit purchase page

**Verify:**
- [ ] Redirect to Stripe Checkout
- [ ] Product shows: "Popular Pack"
- [ ] Price shows: $8.99
- [ ] Credits add to balance immediately
- [ ] Purchase transaction logged

**Database Verification:**
```sql
-- Check credits were added
SELECT current_balance, purchased_credits_balance
FROM user_credits
WHERE user_id = '<auth_user_id>';

-- Check purchase logged
SELECT * FROM user_credit_purchases
WHERE user_id = '<auth_user_id>'
ORDER BY created_at DESC
LIMIT 1;
```

---

## Test 6: Subscription Downgrade

### Test Cancellation Flow

**Steps:**
1. In Stripe Dashboard (test mode), find the test subscription
2. Click "Cancel subscription"
3. Confirm cancellation

**Verify:**
- [ ] Webhook receives `customer.subscription.deleted`
- [ ] User profile downgraded to FREE tier
- [ ] Monthly allowance set to 15 (not 5!)
- [ ] User keeps purchased credits (current_balance unchanged)

**Database Verification:**
```sql
-- Check subscription status
SELECT status FROM subscriptions WHERE user_id = '<profile_id>';

-- Check profile tier
SELECT subscription_tier FROM profiles WHERE id = '<profile_id>';

-- Check credits allowance
SELECT subscription_tier, monthly_allowance, current_balance
FROM user_credits
WHERE user_id = '<auth_user_id>';
```

**Expected:**
- Status: CANCELED
- Tier: FREE
- Monthly allowance: 15
- Current balance: Unchanged

---

## Test 7: New User Signup

### Test Credit Allocation

**Steps:**
1. Sign out completely
2. Create new account at `/auth/signup`
3. Complete email verification (if enabled)
4. Check profile and credits

**Verify:**
- [ ] Profile created with subscription_tier = 'FREE'
- [ ] User receives 15 credits (not 5!)
- [ ] Credits record created in user_credits

**Database Verification:**
```sql
-- Check new user
SELECT
    p.display_name,
    p.subscription_tier,
    c.user_credits,
    c.monthly_allowance
FROM profiles p
LEFT JOIN user_credits c ON p.user_id = c.user_id
WHERE p.user_id = '<new_auth_user_id>';
```

**Expected:**
- subscription_tier: FREE
- user_credits: 15
- monthly_allowance: 15

---

## Test 8: Responsive Design

### Mobile View (375px width)

**Verify:**
- [ ] Subscription page: Cards stack vertically (1 column)
- [ ] Credit purchase: Grid becomes 1 column
- [ ] User profile card: Elements stack properly
- [ ] Credit gauge: Remains centered and readable
- [ ] Buttons: Full width on mobile

### Tablet View (768px width)

**Verify:**
- [ ] Subscription page: 2 columns
- [ ] Credit purchase: 2-3 columns
- [ ] All text remains readable

### Desktop View (1440px width)

**Verify:**
- [ ] Subscription page: 4 columns, max-width 7xl
- [ ] Credit purchase: 3 columns, max-width 4xl
- [ ] All spacing looks balanced

---

## Test 9: Edge Cases

### Test 1: Already Purchased Package
1. Purchase a credit package
2. Try to purchase the same package again
3. Should succeed (no limit on repeat purchases)

### Test 2: Invalid Tier
1. Manually change subscription_tier in database to 'INVALID'
2. Navigate to subscription page
3. Should default to FREE tier display

### Test 3: No Credits
1. Use all credits in account
2. Navigate to credit purchase page
3. Credit gauge should show 0 with red color
4. Purchase flow should still work

### Test 4: Expired Card
1. Use test card `4000 0000 0000 0341` (card declined)
2. Attempt to purchase
3. Should show Stripe error, no credits added

---

## Known Issues to Watch For

### Issue 1: Stripe Price IDs
**Problem:** Price IDs are placeholders (e.g., `price_starter_pack`)
**Workaround:** Checkout uses `price_data` instead of `price` parameter
**Fix:** Create actual Stripe products and update IDs in `stripe.ts`

### Issue 2: TypeScript Errors
**Problem:** `npx tsc` may timeout or show errors
**Workaround:** Dev server compiles on-demand, may still work
**Fix:** Run `npx tsc --noEmit` with shorter timeout or check specific files

### Issue 3: Subscription Bumps Not Used
**Problem:** Monthly bumps feature exists but no UI to use them
**Status:** Implemented in database, UI pending
**Fix:** Phase 3 - Build bump usage UI in marketplace

---

## Success Criteria

All tests pass when:

- ✅ All 4 tiers display correctly on subscription page
- ✅ All 6 credit packages display with correct pricing
- ✅ FREE users have 15 credits minimum
- ✅ Stripe checkout works for subscriptions and credit purchases
- ✅ Webhooks process all tier changes correctly
- ✅ New users receive 15 credits on signup
- ✅ Downgrades set monthly_allowance to 15 (not 5)
- ✅ Responsive design works on all screen sizes
- ✅ No console errors on any page

---

## Rollback Plan

If critical issues are found:

### Option 1: Code Rollback
```bash
git revert HEAD~5  # Revert last 5 commits
git push
```

### Option 2: Database Rollback (Soft)
```sql
-- Hide CREATOR tier without breaking enum
UPDATE subscription_tiers
SET max_moodboards_per_day = 0
WHERE name = 'CREATOR';

-- Disable CREATOR in checkout
-- (Remove from subscriptionPlans object in create-checkout-session/route.ts)
```

### Option 3: Database Rollback (Hard)
**WARNING:** Only if absolutely necessary
```sql
-- Downgrade all CREATOR users to PRO
UPDATE profiles
SET subscription_tier = 'PRO'
WHERE subscription_tier = 'CREATOR';

UPDATE subscriptions
SET tier = 'PRO'
WHERE tier = 'CREATOR';
```

**Note:** Cannot remove 'CREATOR' from enum without recreating it

---

## Next Steps After Testing

Once all tests pass:

1. **Update Stripe Price IDs**
   - Create products in Stripe Dashboard
   - Update `apps/web/lib/stripe.ts` with real price IDs

2. **Deploy to Staging**
   - Push to staging branch
   - Run migrations on staging database
   - Repeat all tests in staging environment

3. **Deploy to Production**
   - Schedule maintenance window (low traffic time)
   - Run migrations on production database
   - Deploy Next.js app
   - Monitor Stripe webhooks for errors
   - Track conversion metrics

4. **Monitor Metrics**
   - Track FREE → PAID conversion rate
   - Monitor CREATOR tier adoption
   - Check credit package sales distribution
   - Track average revenue per user (ARPU)

---

## Support Resources

- **Stripe Dashboard**: https://dashboard.stripe.com/test
- **Supabase Dashboard**: https://supabase.com/dashboard
- **Webhook Logs**: Check Next.js console for webhook events
- **Database Logs**: Supabase → Logs → Postgres

---

## Contact

If you encounter issues during testing:
- Check webhook logs in Next.js console
- Check Supabase logs for database errors
- Verify Stripe test mode is enabled
- Check that all migrations ran successfully

**Testing completed by:** _________________
**Date:** _________________
**Issues found:** _________________

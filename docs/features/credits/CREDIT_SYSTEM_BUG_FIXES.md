# Credit System Bug Fixes - Implementation Guide

**Date:** 2025-01-12
**Priority:** CRITICAL
**Estimated Time:** 4 hours
**Status:** IN PROGRESS

---

## Executive Summary

This document details 6 critical bugs found in the credit consumption system during a comprehensive audit. The bugs range from incorrect credit tracking to missing refund logic, potentially causing users to lose credits unfairly.

**Impact:**
- Users losing credits on failed generations
- Incorrect consumption tracking
- Referral credits never being awarded
- Race conditions in credit deduction

---

## Bugs Identified

### 🚨 BUG #1: Double Credit Consumption Bug (CRITICAL)
**File:** `apps/web/app/api/playground/apply-style/route.ts`
**Line:** 194
**Severity:** CRITICAL

#### Problem
```typescript
// ❌ WRONG - Sets consumed_this_month to NEW balance instead of adding
consumed_this_month: userCredits.current_balance - STYLE_APPLICATION_COST,
```

#### Impact
- Monthly consumption tracking completely broken for style applications
- Users' consumption stats are incorrect
- Analytics and reporting are wrong

#### Fix
```typescript
// ✅ CORRECT - Adds to existing consumption
consumed_this_month: userCredits.consumed_this_month + STYLE_APPLICATION_COST,
```

#### Testing
```bash
# Before fix: consumed_this_month shows balance value
# After fix: consumed_this_month increments correctly

# Test script:
node scripts/test-credit-bugs.js --bug=1
```

---

### 🚨 BUG #2: Missing Refund Logic in Playground (CRITICAL)
**File:** `apps/web/app/api/playground/generate/route.ts`
**Lines:** 1381-1387 (deduction), 1638-1665 (error handling)
**Severity:** CRITICAL

#### Problem
Credits are deducted immediately but there's NO refund when:
- API calls fail
- Image generation fails
- Database operations fail
- Timeout occurs

The enhance-image API has proper refund logic (lines 498-541), but playground doesn't.

#### Impact
- Users permanently lose credits on failures
- No compensation for service errors
- Poor user experience

#### Fix
Add comprehensive refund logic with try-catch blocks:

```typescript
try {
  // Deduct credits
  await supabaseAdmin
    .from('user_credits')
    .update({
      current_balance: userCredits.current_balance - creditsNeeded,
      consumed_this_month: userCredits.consumed_this_month + creditsNeeded
    })
    .eq('user_id', user.id);

  // ... API call and generation logic ...

} catch (error) {
  console.error('Generation failed, refunding credits:', error);

  // REFUND CREDITS
  await refundUserCredits(
    supabaseAdmin,
    user.id,
    creditsNeeded,
    'playground_generation',
    `Generation failed: ${error.message}`
  );

  throw error;
}
```

#### Testing
```bash
# Force API failure and verify refund
node scripts/test-credit-bugs.js --bug=2 --force-api-failure
```

---

### 🚨 BUG #3: Referral Credits Never Awarded (CRITICAL)
**File:** `apps/web/app/api/referrals/complete-profile/route.ts`
**Lines:** 116-129
**Severity:** CRITICAL

#### Problem
The code tries to call `/api/credits/add` endpoint which **doesn't exist**:

```typescript
// ❌ This endpoint doesn't exist!
await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/credits/add`, {
  method: 'POST',
  body: JSON.stringify({
    userId: referrer.user_id,
    amount: 5,
    transactionType: 'referral_bonus'
  })
});
```

Additional issues:
- No error handling if fetch fails
- Referral record created but credits never awarded
- No transaction rollback on failure

#### Impact
- Referrers see "5 credits earned" but never receive them
- `referral_credits` table shows awarded but no actual credit change
- Trust issues with referral system

#### Fix
**Option A:** Create the missing endpoint
**Option B:** Direct database update (RECOMMENDED)

```typescript
// Replace fetch with direct DB update
const { error: creditError } = await supabase
  .from('user_credits')
  .update({
    current_balance: supabase.sql`current_balance + 5`,
    updated_at: new Date().toISOString()
  })
  .eq('user_id', referrer.user_id);

if (creditError) {
  // Rollback referral_credits entry
  await supabase
    .from('referral_credits')
    .delete()
    .eq('id', referralCredit.id);

  throw new Error('Failed to award referral credits');
}

// Log transaction
await supabase
  .from('credit_transactions')
  .insert({
    user_id: referrer.user_id,
    transaction_type: 'referral_bonus',
    credits_used: 5,
    status: 'completed',
    metadata: { referred_user_id: profile.id }
  });
```

#### Testing
```bash
# Test referral flow end-to-end
node scripts/test-credit-bugs.js --bug=3 --test-referral
```

---

### 🚨 BUG #4: No Transaction Atomicity (CRITICAL)
**File:** `apps/web/app/api/playground/generate/route.ts`
**Lines:** 1381-1536
**Severity:** CRITICAL

#### Problem
Credits are deducted **before** critical operations complete:
1. Credits deducted (line 1381)
2. Project save attempted (line 1494-1536)
3. If project save fails → user lost credits but has no generation

#### Impact
- Credit loss with no generation record
- No way to recover or refund automatically
- Data integrity issues

#### Fix
Use Supabase transactions (RPC function):

```typescript
// Create a database function for atomic operations
-- In SQL migration:
CREATE OR REPLACE FUNCTION playground_generate_with_transaction(
  p_user_id UUID,
  p_credits_needed INTEGER,
  p_project_data JSONB
) RETURNS JSONB AS $$
DECLARE
  v_project_id UUID;
  v_new_balance INTEGER;
BEGIN
  -- Deduct credits
  UPDATE user_credits
  SET
    current_balance = current_balance - p_credits_needed,
    consumed_this_month = consumed_this_month + p_credits_needed
  WHERE user_id = p_user_id
  RETURNING current_balance INTO v_new_balance;

  -- Insert project
  INSERT INTO playground_projects (user_id, title, prompt, ...)
  VALUES (...)
  RETURNING id INTO v_project_id;

  -- Log transaction
  INSERT INTO credit_transactions (...)
  VALUES (...);

  RETURN jsonb_build_object(
    'project_id', v_project_id,
    'new_balance', v_new_balance
  );
EXCEPTION
  WHEN OTHERS THEN
    -- Transaction automatically rolled back
    RAISE EXCEPTION 'Transaction failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;
```

Then call from API:
```typescript
const { data, error } = await supabaseAdmin
  .rpc('playground_generate_with_transaction', {
    p_user_id: user.id,
    p_credits_needed: creditsNeeded,
    p_project_data: projectData
  });

if (error) {
  // Everything automatically rolled back
  throw new Error('Generation transaction failed');
}
```

#### Testing
```bash
# Force DB failure and verify rollback
node scripts/test-credit-bugs.js --bug=4 --force-db-failure
```

---

### 🔍 BUG #5: Inconsistent Credit Costs (MODERATE)
**Files:** Multiple
**Severity:** MODERATE

#### Problem
Credit costs hardcoded differently:

| Endpoint | Provider | Cost | Line |
|----------|----------|------|------|
| `/api/enhance-image` | NanoBanana | 1 | Line 15 |
| `/api/enhance-image` | Seedream | 1 | Line 15 |
| `/api/playground/generate` | NanoBanana | 1 | Line 608 |
| `/api/playground/generate` | Seedream | 2 | Line 608 |

Enhancement API charges same for both but tracks 4x internally for NanoBanana.

#### Impact
- Confusing pricing
- Difficult to maintain
- Risk of charging errors

#### Fix
Create centralized config:

```typescript
// apps/web/lib/credits/constants.ts
export const CREDIT_COSTS = {
  nanobanana: {
    userCredits: 1,
    platformCredits: 4,
    costUsd: 0.025,
    ratio: 4
  },
  seedream: {
    userCredits: 2,
    platformCredits: 2,
    costUsd: 0.05,
    ratio: 1
  }
} as const;

export const OPERATION_COSTS = {
  generation: (provider: 'nanobanana' | 'seedream') =>
    CREDIT_COSTS[provider].userCredits,
  enhancement: (provider: 'nanobanana' | 'seedream') =>
    CREDIT_COSTS[provider].userCredits,
  styleApplication: 1,
  videoGeneration: 5
} as const;
```

Update all endpoints to import and use these constants.

#### Testing
```bash
# Verify all endpoints use correct costs
node scripts/test-credit-bugs.js --bug=5 --verify-costs
```

---

### 🔍 BUG #6: SQL Refund Function Issues (MODERATE)
**File:** `scripts/database/CREDIT_MANAGEMENT_SCHEMA.sql`
**Lines:** 230-260
**Severity:** MODERATE

#### Problem
```sql
consumed_this_month = GREATEST(consumed_this_month - p_credits, 0)
```

This prevents negative values but **loses track of over-refunds**:
- User consumed 5 credits this month
- Refund 10 credits
- `consumed_this_month` becomes 0 (should track -5 deficit)

#### Impact
- Cannot detect over-refund situations
- Analytics incorrect
- No audit trail for discrepancies

#### Fix
```sql
CREATE OR REPLACE FUNCTION refund_user_credits(
  p_user_id UUID,
  p_credits INTEGER,
  p_enhancement_type VARCHAR(50)
) RETURNS VOID AS $$
DECLARE
  v_over_refund INTEGER;
BEGIN
  -- Calculate if this would cause over-refund
  SELECT
    CASE
      WHEN consumed_this_month < p_credits
      THEN p_credits - consumed_this_month
      ELSE 0
    END
  INTO v_over_refund
  FROM user_credits
  WHERE user_id = p_user_id;

  -- Update credits
  UPDATE user_credits
  SET
    current_balance = current_balance + p_credits,
    consumed_this_month = GREATEST(consumed_this_month - p_credits, 0),
    updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Log refund transaction with over-refund tracking
  INSERT INTO credit_transactions (
    user_id,
    transaction_type,
    credits_used,
    enhancement_type,
    status,
    metadata
  ) VALUES (
    p_user_id,
    'refund',
    p_credits,
    p_enhancement_type,
    'completed',
    jsonb_build_object('over_refund_amount', v_over_refund)
  );

  -- Alert if over-refund occurred
  IF v_over_refund > 0 THEN
    INSERT INTO system_alerts (type, level, message, metadata)
    VALUES (
      'over_refund_detected',
      'warning',
      'Over-refund detected for user: ' || p_user_id,
      jsonb_build_object(
        'user_id', p_user_id,
        'over_refund_amount', v_over_refund,
        'credits_refunded', p_credits
      )
    );
  END IF;
END;
$$ LANGUAGE plpgsql;
```

#### Testing
```sql
-- Test over-refund detection
SELECT refund_user_credits(
  'test-user-id',
  10, -- Refund 10
  'test'
);

-- Verify alert was created
SELECT * FROM system_alerts
WHERE type = 'over_refund_detected'
ORDER BY created_at DESC LIMIT 1;
```

---

## Implementation Order

### Phase 1: Setup (30 min)
1. ✅ Create this documentation
2. ⏳ Create centralized credit utilities (`apps/web/lib/credits/`)
3. ⏳ Create `/api/credits/add` endpoint
4. ⏳ Backup current credit tables

```bash
# Backup command
pg_dump -h <host> -U <user> -d <db> \
  -t user_credits \
  -t credit_transactions \
  -t referral_credits \
  > credit_tables_backup_$(date +%Y%m%d_%H%M%S).sql
```

### Phase 2: Critical Fixes (1 hour)
5. ⏳ Fix Bug #1 - Apply-style consumption
6. ⏳ Fix Bug #2 - Playground refund logic
7. ⏳ Fix Bug #3 - Referral credits
8. ⏳ Fix Bug #4 - Transaction atomicity

### Phase 3: Moderate Fixes (30 min)
9. ⏳ Fix Bug #5 - Standardize costs
10. ⏳ Fix Bug #6 - SQL refund function

### Phase 4: Testing (1.5 hours)
11. ⏳ Create automated test script
12. ⏳ Run manual test checklist
13. ⏳ Verify database integrity

### Phase 5: Deployment (30 min)
14. ⏳ Run database migrations
15. ⏳ Deploy API changes
16. ⏳ Monitor for 1 hour
17. ⏳ Run post-deployment verification

---

## Testing Checklist

### Pre-Deployment Tests

#### Bug #1: Apply-Style Consumption
- [ ] Apply style to image
- [ ] Check `consumed_this_month` increments (not replaces)
- [ ] Verify `current_balance` decreases correctly
- [ ] Check `credit_transactions` log created

#### Bug #2: Playground Refund
- [ ] Start generation that will fail
- [ ] Verify credits are refunded
- [ ] Check refund appears in `credit_transactions`
- [ ] Test timeout scenario
- [ ] Test API error scenario
- [ ] Test database failure scenario

#### Bug #3: Referral Credits
- [ ] Create new user with invite code
- [ ] Complete profile
- [ ] Check referrer receives 5 credits
- [ ] Verify `referral_credits` table updated
- [ ] Verify `credit_transactions` log created
- [ ] Check `user_credits.current_balance` increased

#### Bug #4: Transaction Atomicity
- [ ] Force database failure during generation
- [ ] Verify credits NOT deducted
- [ ] Verify no orphaned project record
- [ ] Check error logged properly

#### Bug #5: Credit Costs
- [ ] Generate with NanoBanana (should cost 1)
- [ ] Generate with Seedream (should cost 2)
- [ ] Enhance with NanoBanana (should cost 1)
- [ ] Enhance with Seedream (should cost 2)
- [ ] Verify all costs match config

#### Bug #6: SQL Refund
- [ ] Refund more than consumed this month
- [ ] Verify `system_alerts` entry created
- [ ] Check `credit_transactions` has metadata
- [ ] Verify over-refund amount tracked

### Database Integrity Checks

```sql
-- Check for negative balances (should be 0)
SELECT user_id, current_balance
FROM user_credits
WHERE current_balance < 0;

-- Check for missing transactions (should be 0)
SELECT COUNT(*)
FROM user_credits uc
WHERE uc.lifetime_consumed > 0
  AND NOT EXISTS (
    SELECT 1 FROM credit_transactions ct
    WHERE ct.user_id = uc.user_id
  );

-- Check for orphaned refunds (should be 0)
SELECT COUNT(*)
FROM credit_transactions
WHERE transaction_type = 'refund'
  AND api_request_id NOT IN (
    SELECT id FROM enhancement_tasks
  );

-- Check consumption tracking (should match)
SELECT
  uc.user_id,
  uc.consumed_this_month as tracked_consumption,
  SUM(CASE WHEN ct.transaction_type = 'deduction' THEN ct.credits_used ELSE 0 END) as actual_consumption
FROM user_credits uc
LEFT JOIN credit_transactions ct ON ct.user_id = uc.user_id
  AND ct.created_at >= DATE_TRUNC('month', NOW())
GROUP BY uc.user_id, uc.consumed_this_month
HAVING uc.consumed_this_month != SUM(CASE WHEN ct.transaction_type = 'deduction' THEN ct.credits_used ELSE 0 END);
```

---

## Rollback Procedures

### Code Rollback
```bash
# Revert all code changes
git revert <commit-hash>
git push origin main

# Or rollback to specific commit
git reset --hard <previous-commit>
git push origin main --force
```

### Database Rollback
```sql
-- Restore from backup
psql -h <host> -U <user> -d <db> < credit_tables_backup_TIMESTAMP.sql

-- Or use rollback migration
psql -h <host> -U <user> -d <db> < migrations/rollback_credit_fixes.sql
```

### Manual Credit Restoration
If individual users need credit restoration:

```sql
-- Restore specific user credits
UPDATE user_credits
SET
  current_balance = current_balance + <amount>,
  consumed_this_month = consumed_this_month - <amount>
WHERE user_id = '<user-id>';

-- Log manual restoration
INSERT INTO credit_transactions (
  user_id,
  transaction_type,
  credits_used,
  status,
  metadata
) VALUES (
  '<user-id>',
  'manual_adjustment',
  <amount>,
  'completed',
  '{"reason": "bug_fix_restoration", "admin": "<admin-id>"}'::jsonb
);
```

---

## Monitoring & Alerts

### Post-Deployment Monitoring

Monitor these metrics for 24 hours after deployment:

1. **Credit Refund Rate**
   - Expected: <5% of generations
   - Alert if >10%

2. **Negative Balance Occurrences**
   - Expected: 0
   - Alert immediately if any

3. **Failed Credit Transactions**
   - Expected: <1%
   - Alert if >2%

4. **Referral Credit Awards**
   - Expected: 100% success rate
   - Alert if <95%

### SQL Queries for Monitoring

```sql
-- Refund rate (last 24 hours)
SELECT
  COUNT(*) FILTER (WHERE transaction_type = 'refund') * 100.0 / COUNT(*) as refund_rate_pct
FROM credit_transactions
WHERE created_at >= NOW() - INTERVAL '24 hours';

-- Negative balances
SELECT user_id, current_balance
FROM user_credits
WHERE current_balance < 0;

-- Failed transactions (last 24 hours)
SELECT COUNT(*)
FROM credit_transactions
WHERE created_at >= NOW() - INTERVAL '24 hours'
  AND status = 'failed';

-- Referral success rate (last 7 days)
SELECT
  COUNT(*) FILTER (WHERE status = 'awarded') * 100.0 / COUNT(*) as success_rate_pct
FROM referral_credits
WHERE created_at >= NOW() - INTERVAL '7 days';
```

---

## Success Criteria

✅ All 6 bugs fixed and deployed
✅ All tests passing
✅ No negative credit balances
✅ Refund rate <5%
✅ Referral credit success rate 100%
✅ No data integrity issues
✅ Monitoring dashboard created
✅ Documentation complete

---

## Support & Escalation

**If issues arise during implementation:**
1. Check rollback procedures above
2. Review test results
3. Check database integrity queries
4. Escalate to senior engineer if needed

**Emergency contacts:**
- Database issues: [DBA contact]
- API issues: [Backend lead]
- User support: [Support lead]

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-01-12 | Initial document created | Claude |
| | Bug audit completed | |
| | Implementation plan finalized | |

---

**Status: READY FOR IMPLEMENTATION**

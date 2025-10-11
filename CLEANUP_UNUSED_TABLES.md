# Database Cleanup - Remove Unused Credit Pool System

## 🗑️ Tables/Systems to Remove or Ignore

### Your Actual Model:
- **WaveSpeed API** (pay-per-generation, no pre-purchased credits)
- **User Credits** (internal virtual currency)
- **Track usage & costs** (not credit pools)

---

## ❌ Tables NOT Needed (Can Be Removed)

### 1. `credit_pools` ❌
**Why:** You don't pre-purchase credits from WaveSpeed
```sql
-- This table tracks pre-purchased credit balances
-- You pay-per-generation, so this is useless
DROP TABLE IF EXISTS credit_pools CASCADE;
```

### 2. `credit_purchase_requests` ❌
**Why:** No manual credit purchasing workflow needed
```sql
-- This was for requesting manual credit refills
-- Not needed for pay-per-generation model
DROP TABLE IF EXISTS credit_purchase_requests CASCADE;
```

### 3. `api_providers` ❌ (Optional - Your Choice)
**Why:** You only use WaveSpeed, don't need multi-provider config

**Option A: Remove it**
```sql
DROP TABLE IF EXISTS api_providers CASCADE;
```

**Option B: Keep for documentation**
- Stores API endpoints, cost estimates
- Could be useful reference
- Not hurting anything if you keep it

**Recommendation:** Keep it but ignore it in admin UI

---

## ✅ Tables to KEEP (Essential)

### 1. `user_credits` ✅ ESSENTIAL
**Why:** Tracks user balances (what they see)
```sql
-- Columns:
user_id              -- Which user
current_balance      -- Credits they have
consumed_this_month  -- Usage this period
monthly_allowance    -- Their tier limit
subscription_tier    -- free/plus/pro
```
**Keep:** Everything

### 2. `credit_transactions` ✅ ESSENTIAL
**Why:** Your main tracking/audit log
```sql
-- Columns:
user_id           -- Who used it
transaction_type  -- deduction, refund, allocation
credits_used      -- How many user credits
cost_usd          -- What WaveSpeed charges YOU
provider          -- nanobanana, seedream, etc.
enhancement_type  -- image_gen, video_gen, etc.
api_request_id    -- Links to task
status            -- completed, failed
created_at        -- When
```
**Keep:** Everything - this is your gold mine for analytics!

### 3. `enhancement_tasks` ✅ ESSENTIAL
**Why:** Tracks individual generation attempts
```sql
-- Columns:
id                -- Task ID
user_id          -- Who requested
provider         -- Which AI model
status           -- completed, failed, processing
error_message    -- Why it failed
result_url       -- Generated image/video URL
cost_usd         -- WaveSpeed cost
enhancement_type -- What function
```
**Keep:** Everything - essential for failure tracking

### 4. `system_alerts` ✅ USEFUL
**Why:** Error logging and monitoring
**Keep:** Yes - useful for debugging

---

## 🔧 Database Functions to Review

### ❌ Remove: `consume_platform_credits`
```sql
-- This function updates credit_pools table
-- Since we're removing that table, remove this too
DROP FUNCTION IF EXISTS consume_platform_credits(character varying, integer, numeric);
```

### ✅ Keep: `consume_user_credits`
```sql
-- Deducts from user balance
-- Creates transaction record
-- Essential!
```
**Keep:** Yes

### ✅ Keep: `refund_user_credits`
```sql
-- Refunds user on failures
-- Creates refund transaction
-- Essential!
```
**Keep:** Yes

---

## 📝 Cleanup SQL Script

Run this to clean up unnecessary tables:

```sql
-- ============================================================================
-- CLEANUP SCRIPT: Remove Pre-Purchased Credit Pool System
-- ============================================================================

BEGIN;

-- 1. Remove credit_pools table
DROP TABLE IF EXISTS credit_pools CASCADE;

-- 2. Remove credit purchase requests
DROP TABLE IF EXISTS credit_purchase_requests CASCADE;

-- 3. Remove the consume_platform_credits function
DROP FUNCTION IF EXISTS consume_platform_credits(character varying, integer, numeric);

-- 4. Optional: Remove api_providers (only if you're sure)
-- DROP TABLE IF EXISTS api_providers CASCADE;

-- 5. Clean up any orphaned system alerts
DELETE FROM system_alerts 
WHERE type IN ('low_platform_credits', 'credit_refill_success', 'credit_refill_failed');

-- 6. Verify what's left
SELECT 
  table_name,
  CASE 
    WHEN table_name IN ('user_credits', 'credit_transactions', 'enhancement_tasks') 
    THEN '✅ Keep - Essential'
    WHEN table_name = 'system_alerts'
    THEN '✅ Keep - Useful'
    WHEN table_name = 'api_providers'
    THEN '⚠️ Optional - Your choice'
    ELSE '❓ Review'
  END as recommendation
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE '%credit%'
  OR table_name IN ('enhancement_tasks', 'system_alerts', 'api_providers')
ORDER BY recommendation, table_name;

COMMIT;
```

---

## 🎯 Code Changes Needed

### 1. Remove from `enhance-image/route.ts`
**Delete lines 518-526:**
```typescript
// ❌ DELETE THIS - Not needed for pay-per-generation
await supabaseAdmin.rpc('consume_platform_credits', {
  p_provider: providerUsed,
  p_user_id: user.id,
  p_user_credits: USER_CREDITS_PER_ENHANCEMENT,
  p_operation_type: enhancementType,
  p_task_id: taskId,
  p_moodboard_id: moodboardId
});
```

### 2. Keep Transaction Logging
**Lines 535-553 - KEEP THESE:**
```typescript
// ✅ KEEP - This is your usage tracking
await supabaseAdmin
  .from('credit_transactions')
  .insert({
    user_id: user.id,
    transaction_type: 'deduction',
    credits_used: USER_CREDITS_PER_ENHANCEMENT,
    cost_usd: 0.10, // What WaveSpeed charges YOU
    provider: providerUsed,
    enhancement_type: enhancementType,
    // ...
  });
```

---

## 🗂️ Files to Update/Remove

### API Routes to Remove:
```
apps/web/app/api/admin/refill-credits/route.ts  ❌ DELETE
  - Manual credit refill (not needed)
```

### API Routes to Update:
```
apps/web/app/api/admin/credit-stats/route.ts  ⚠️ UPDATE
  - Remove credit_pools queries
  - Show actual usage stats instead
```

### Components to Update:
```
apps/web/app/components/CreditManagementDashboard.tsx  ⚠️ UPDATE
  - Remove platform credit pool display
  - Show usage analytics instead
  - Show WaveSpeed cost tracking
```

### Documentation to Update:
```
docs support/credit_management_system.md  ⚠️ UPDATE
  - Remove platform pool documentation
  - Document pay-per-generation model
```

---

## 📊 What Your Admin Dashboard Should Show Instead

### Current (Wrong):
- Platform Credits Remaining: 800
- fal.ai Balance: 500
- Auto-refill threshold

### New (Correct):
- **Usage This Month:** 0 generations
- **Success Rate:** N/A (no data yet)
- **WaveSpeed Costs This Month:** $0.00
- **Active Users:** 7 users with credits
- **Provider Breakdown:**
  - NanoBanana: 0 calls ($0.00)
  - Seedream: 0 calls ($0.00)
- **Failure Rate:** 0%
- **Refunds Issued:** 0

---

## ⚠️ Before You Delete Anything

### Backup First:
```bash
# Export current schema
pg_dump -h YOUR_HOST -U postgres -d YOUR_DB --schema-only > schema_backup.sql

# Export credit_pools data (just in case)
pg_dump -h YOUR_HOST -U postgres -d YOUR_DB -t credit_pools --data-only > credit_pools_backup.sql
```

### Test in Staging First:
1. Run cleanup script in staging
2. Test admin dashboard
3. Test user credit operations
4. Verify nothing breaks
5. Then apply to production

---

## 🎯 Summary

### Remove:
- ❌ `credit_pools` table
- ❌ `credit_purchase_requests` table
- ❌ `consume_platform_credits()` function
- ❌ `/api/admin/refill-credits` route
- ❌ Platform credit tracking code in enhance-image route

### Keep:
- ✅ `user_credits` table
- ✅ `credit_transactions` table
- ✅ `enhancement_tasks` table
- ✅ `system_alerts` table
- ✅ `consume_user_credits()` function
- ✅ `refund_user_credits()` function

### Update:
- ⚠️ Admin dashboard to show usage/costs instead of pools
- ⚠️ Credit stats API to query actual usage
- ⚠️ Documentation to reflect pay-per-generation model

---

**Next Steps:**
1. Review this cleanup plan
2. Run the cleanup SQL script
3. I'll create the new monitoring dashboard SQL
4. I'll provide updated admin dashboard code

Ready to proceed? 🚀


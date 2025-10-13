# Platform Credits Status Analysis

## ❌ **CRITICAL FINDING: Platform Credits Are NOT Actually Being Tracked**

### The Problem

You're seeing platform credit data (fal_ai with 500 credits, nanobanan with 1000 credits), but **they're not actually being consumed or tracked** in production!

---

## 🔍 Evidence

### 1. Function Signature Mismatch

**Database Function Definition** (from `full.sql` line 3734):
```sql
CREATE FUNCTION consume_platform_credits(
  p_provider VARCHAR(50),
  p_credits INTEGER,
  p_cost DECIMAL(8,4)
) RETURNS VOID
```

**How It's Being Called** (from `enhance-image/route.ts` line 519):
```typescript
await supabaseAdmin.rpc('consume_platform_credits', {
  p_provider: providerUsed,
  p_user_id: user.id,           // ❌ NOT IN FUNCTION SIGNATURE
  p_user_credits: USER_CREDITS_PER_ENHANCEMENT,  // ❌ WRONG PARAMETER NAME
  p_operation_type: enhancementType,  // ❌ NOT IN FUNCTION SIGNATURE
  p_task_id: taskId,            // ❌ NOT IN FUNCTION SIGNATURE
  p_moodboard_id: moodboardId   // ❌ NOT IN FUNCTION SIGNATURE
});
```

**Result:** This function call is **FAILING SILENTLY** or throwing errors that are being ignored!

### 2. What The Function Actually Expects

```typescript
// CORRECT way to call it:
await supabaseAdmin.rpc('consume_platform_credits', {
  p_provider: 'nanobanan',     // ✅ matches
  p_credits: 4,                // ❌ should be 4 (NB credits), not 1 (user credit)
  p_cost: 0.10                 // ❌ missing entirely in current call
});
```

---

## 🎯 What's Actually Happening

### Current Flow:
```
1. User charged: 1 credit from user_credits table ✅
2. Platform credits call: consume_platform_credits() ❌ FAILS
3. Transaction logged: With wrong data ⚠️
4. Platform credit_pools: NEVER UPDATED ❌
```

### The Numbers You're Seeing:
- **fal_ai: 500 credits** - Initial seeded data, never consumed
- **nanobanan: 1000 credits** - Initial seeded data, never consumed  
- **Total Purchased: 0** - Because it's not tracking
- **Total Consumed: 0** - Because function isn't working

---

## 💰 Financial Impact

### Current State:
- ✅ User credits ARE being tracked (user_credits table works)
- ❌ Platform credits NOT being tracked (credit_pools never updated)
- ❌ You have NO VISIBILITY into actual NanoBanana API costs
- ❌ Can't monitor when to refill platform credits
- ❌ Auto-refill won't work (relies on credit_pools balance)

### What This Means:
1. **You don't know how much NanoBanana is costing you**
2. **The 1:4 ratio is tracked in transactions, but not in pools**
3. **If NanoBanana runs out of credits, you won't know until it fails**
4. **Your admin dashboard shows fake data**

---

## ✅ The Fix

### Option 1: Fix The Function Call (Proper Tracking)

**Update `apps/web/app/api/enhance-image/route.ts` line 519:**

```typescript
// Calculate actual provider credits used (4x for NanoBanana, 2x for Seedream)
const providerCreditsUsed = providerUsed === 'seedream' 
  ? USER_CREDITS_PER_ENHANCEMENT * 2 
  : USER_CREDITS_PER_ENHANCEMENT * 4;

const providerCost = providerUsed === 'seedream' ? 0.05 : 0.10;

// Consume platform credits correctly
const { error: platformError } = await supabaseAdmin.rpc('consume_platform_credits', {
  p_provider: providerUsed,
  p_credits: providerCreditsUsed,  // 4 for NanoBanana, 2 for Seedream
  p_cost: providerCost             // $0.10 for NanoBanana, $0.05 for Seedream
});

if (platformError) {
  console.error('Failed to consume platform credits:', platformError);
  // Consider if this should fail the request or just log
}
```

### Option 2: Remove Platform Credits Tracking (Simpler)

If you don't need platform credit pool tracking:

1. **Remove the function call** from enhance-image route (line 518-526)
2. **Only track user credits** (which already works)
3. **Monitor NanoBanana API costs externally** (via their dashboard)

**Pros:**
- Simpler code
- One less point of failure
- User credits work fine

**Cons:**
- No built-in cost monitoring
- No auto-refill capability
- Admin dashboard shows wrong data

---

## 🔧 About fal.ai

### You Asked: "We're not using fal.ai"

**Correct!** The fal.ai entry in `credit_pools` is:

1. **Legacy/Planned Provider:** Was set up but never implemented
2. **Documentation Artifact:** Mentioned in docs as an example
3. **Should Be Removed:** If you're not using it

**To Remove fal.ai:**
```sql
-- Remove from credit_pools
DELETE FROM credit_pools WHERE provider = 'fal_ai';

-- Remove from api_providers (if exists)
DELETE FROM api_providers WHERE name = 'fal_ai';
```

---

## 📊 Current Platform Credit Setup

### What Exists in Your Database:

```sql
-- From your database (likely):
credit_pools:
├─ id: UUID
├─ provider: 'nanobanan' or 'fal_ai'
├─ total_purchased: 0
├─ total_consumed: 0
├─ available_balance: 1000 (nanobanan), 500 (fal_ai)
├─ cost_per_credit: 0.025
├─ status: 'active'
└─ created_at, updated_at
```

### What's NOT Working:
- `total_consumed` - Never increments (function not called correctly)
- `available_balance` - Never decreases (function not called correctly)
- `total_purchased` - Never set (manual refill only)

---

## 🎯 Recommendations

### Immediate Action (Choose One):

#### Recommendation A: Fix Platform Tracking (If You Want It)
1. Fix the `consume_platform_credits` function call
2. Add error handling for failures
3. Test that credit_pools updates properly
4. Verify admin dashboard shows real data

**Timeline:** 1-2 hours  
**Benefit:** Full cost visibility, auto-refill capability  
**Risk:** More complexity

#### Recommendation B: Remove Platform Tracking (Simpler)
1. Remove `consume_platform_credits` call from enhance-image route
2. Remove or hide credit_pools from admin dashboard
3. Monitor costs via NanoBanana dashboard
4. Keep user credit tracking only

**Timeline:** 30 minutes  
**Benefit:** Simpler, less points of failure  
**Risk:** No built-in cost monitoring

### My Recommendation: **Option B (Remove Platform Tracking)**

**Why:**
1. User credit tracking already works perfectly
2. You can monitor NanoBanana costs in their dashboard
3. One less system to maintain and debug
4. Avoids the current silent failure
5. You can always add it back later if needed

---

## 🔍 How to Verify

### Check if Platform Credits Are Being Consumed:

```sql
-- Check credit_pools
SELECT 
  provider,
  total_consumed,
  available_balance,
  updated_at
FROM credit_pools
WHERE provider IN ('nanobanan', 'fal_ai');

-- If total_consumed = 0 and updated_at is old,
-- then platform credits are NOT being tracked
```

### Check credit_transactions:

```sql
-- See what's actually being logged
SELECT 
  provider,
  credits_used,
  cost_usd,
  metadata,
  created_at
FROM credit_transactions
WHERE provider IN ('nanobanan', 'fal_ai', 'seedream', 'nanobanana')
ORDER BY created_at DESC
LIMIT 20;
```

---

## 📝 Action Items

### To Clean Up Platform Credits:

- [ ] **Decide:** Keep platform tracking or remove it?
- [ ] **If Keep:** Fix the consume_platform_credits call
- [ ] **If Remove:** Delete the function call
- [ ] **Remove fal.ai** from credit_pools (not being used)
- [ ] **Test:** Verify chosen approach works
- [ ] **Update:** Admin dashboard to match reality
- [ ] **Document:** Which providers you're actually using

### Current Provider Status:

| Provider | Status | Credit Pool | Actually Used? |
|----------|--------|-------------|----------------|
| nanobanan | Active | 1000 credits | ✅ Yes (via NanoBanana API) |
| seedream | Active | None | ✅ Yes (via WaveSpeed API) |
| fal_ai | Inactive | 500 credits | ❌ No (remove) |

---

## 💡 Summary

**The Short Version:**

1. **Platform credits exist in database** but aren't being tracked ✅/❌
2. **Function call is wrong** - using non-existent parameters ❌
3. **User credits work fine** - that's what actually matters ✅
4. **fal.ai is not used** - should be removed 🗑️
5. **NanoBanana costs are tracked in transactions** but not in pools ⚠️

**The Action:**

Choose to either:
- **Fix** the platform tracking (1-2 hours) 
- **Remove** the platform tracking (30 minutes) ← Recommended

Either way, **remove fal.ai** since you're not using it!

---

**Generated:** 2025-01-11  
**Priority:** 🟡 MEDIUM (Not blocking users, but causing confusion)  
**Effort:** 30 min - 2 hours depending on approach


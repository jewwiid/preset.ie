# Credit System Fixed - Complete Implementation

**Date:** October 14, 2025
**Status:** ✅ COMPLETE

---

## Overview

The credit system has been fully fixed to properly handle purchased credits that roll over indefinitely, while subscription credits reset monthly.

---

## How It Works

### 1. **User Has Credits**
Users receive credits from two sources:
- **Subscription Credits**: Monthly allowance based on tier (FREE: 15, PLUS: 150, PRO: 500, CREATOR: 1500)
- **Purchased Credits**: Credits bought via Stripe, lootboxes, or credit packages

### 2. **Credits Are Consumed**
When users use platform tools (image generation, video generation, enhancements):
- **Smart Consumption**: Purchased credits are consumed FIRST (they're already paid for)
- **Then Subscription**: If purchased credits run out, subscription credits are consumed
- **Tracking**: System tracks exactly what was consumed from each bucket

### 3. **Credits Roll Over**
- **Purchased Credits**: NEVER expire, roll over indefinitely ✅
- **Subscription Credits**: Reset to monthly allowance at start of each month ❌

---

## Database Schema

```sql
-- user_credits table
current_balance              INTEGER  -- Total credits = subscription + purchased
purchased_credits_balance    INTEGER  -- Purchased credits (roll over forever)
monthly_allowance            INTEGER  -- Subscription tier allowance
consumed_this_month          INTEGER  -- Subscription credits used this month
subscription_tier            TEXT     -- FREE, PLUS, PRO, CREATOR
last_reset_at                TIMESTAMP
```

---

## Key Functions

### 1. `consume_user_credits(user_id, credits)`
**Purpose**: Deduct credits smartly (purchased first, then subscription)

```sql
-- Logic:
IF purchased_credits_balance >= credits THEN
    -- All from purchased
    purchased_consumed = credits
ELSE
    -- Some from purchased, rest from subscription
    purchased_consumed = purchased_credits_balance
    subscription_consumed = credits - purchased_consumed
END IF

UPDATE user_credits SET
    current_balance = current_balance - credits,
    purchased_credits_balance = purchased_credits_balance - purchased_consumed,
    consumed_this_month = consumed_this_month + subscription_consumed
```

**Returns**:
```json
{
  "total_consumed": 10,
  "purchased_consumed": 7,
  "subscription_consumed": 3,
  "remaining_balance": 140,
  "remaining_purchased": 0
}
```

### 2. `add_purchased_credits(user_id, credits)`
**Purpose**: Add purchased credits (from Stripe, lootboxes, etc.)

```sql
UPDATE user_credits SET
    current_balance = current_balance + credits,
    purchased_credits_balance = purchased_credits_balance + credits
```

### 3. `refund_user_credits(user_id, credits, enhancement_type)`
**Purpose**: Refund credits smartly (subscription first, then purchased)

```sql
-- Logic: Reverse of consumption
IF consumed_this_month >= credits THEN
    -- All refund to subscription
    subscription_refund = credits
ELSE
    -- Some to subscription, rest to purchased
    subscription_refund = consumed_this_month
    purchased_refund = credits - consumed_this_month
END IF

UPDATE user_credits SET
    current_balance = current_balance + credits,
    purchased_credits_balance = purchased_credits_balance + purchased_refund,
    consumed_this_month = consumed_this_month - subscription_refund
```

### 4. `reset_monthly_subscription_benefits()`
**Purpose**: Monthly reset that preserves purchased credits

```sql
-- Run at start of each month
UPDATE user_credits SET
    current_balance = monthly_allowance + purchased_credits_balance,  -- ✅ Preserves purchased!
    consumed_this_month = 0,
    last_reset_at = NOW()
```

---

## Implementation Files Updated

### 1. [apps/web/lib/credits/index.ts](../../apps/web/lib/credits/index.ts)

**`deductUserCredits()`** - Now uses `consume_user_credits` RPC:
```typescript
// Smart consumption with fallback
const { data: consumeResult } = await supabaseAdmin.rpc('consume_user_credits', {
  p_user_id: userId,
  p_credits: credits,
});

// Logs breakdown: purchased_consumed vs subscription_consumed
console.log({
  fromPurchased: breakdown.purchased_consumed,
  fromSubscription: breakdown.subscription_consumed,
});
```

**`refundUserCredits()`** - Now uses `refund_user_credits` RPC:
```typescript
// Smart refund with fallback
const { data: refundResult } = await supabaseAdmin.rpc('refund_user_credits', {
  p_user_id: userId,
  p_credits: credits,
  p_enhancement_type: enhancementType,
});

// Logs breakdown: subscription_refunded vs purchased_refunded
```

### 2. [apps/web/lib/credits/constants.ts](../../apps/web/lib/credits/constants.ts)

**Fixed NanoBanana pricing**:
```typescript
nanobanana: {
  userCredits: 2,  // Was 1, now 2 (5% margin)
  totalCostUsd: 0.038,
  chargeUsd: 0.04,
  margin: 0.05,
}

seedream: {
  userCredits: 2,  // Stays 2 (48% margin)
  totalCostUsd: 0.027,
  chargeUsd: 0.04,
  margin: 0.48,
}
```

**Fixed video pricing**:
```typescript
videoGeneration: (provider: 'seedance' | 'wan' = 'seedance') => {
  const VIDEO_COSTS = {
    seedance: 12, // $0.15 API cost, 60% margin
    wan: 20,      // $0.25 API cost, 60% margin
  };
  return VIDEO_COSTS[provider];
}
```

### 3. Database Migrations

- **[062_fix_purchased_credits_rollover.sql](../../supabase/migrations/062_fix_purchased_credits_rollover.sql)**
  - Added `purchased_credits_balance` column
  - Created `consume_user_credits()` function
  - Created `add_purchased_credits()` function
  - Created `reset_monthly_subscription_benefits()` function

- **[20251014000001_add_refund_credits_function.sql](../../supabase/migrations/20251014000001_add_refund_credits_function.sql)**
  - Created `refund_user_credits()` function with smart refund logic

### 4. [apps/web/app/api/stripe/webhook/route.ts](../../apps/web/app/api/stripe/webhook/route.ts)

Already correctly using `add_purchased_credits`:
```typescript
await supabaseAdmin.rpc('add_purchased_credits', {
  p_user_id: userId,
  p_credits: parseInt(credits)
});
```

---

## Credit Pricing (All Fixed)

### Image Generation
| Provider | API Cost | Credits | Charge | Margin |
|----------|----------|---------|--------|--------|
| NanoBanana | $0.038 | 2 | $0.04 | 5% ✅ |
| Seedream | $0.027 | 2 | $0.04 | 48% ✅ |

### Video Generation
| Provider | API Cost | Credits | Charge | Margin |
|----------|----------|---------|--------|--------|
| Seedance Pro 720p | $0.15 | 12 | $0.24 | 60% ✅ |
| WAN 2.5 | $0.25 | 20 | $0.40 | 60% ✅ |

### Subscription Tiers
| Tier | Monthly Credits | Price |
|------|----------------|-------|
| FREE | 15 | $0 |
| PLUS | 150 | TBD |
| PRO | 500 | TBD |
| CREATOR | 1500 | TBD |

---

## Example Scenarios

### Scenario 1: User Buys Credits
```
Initial State:
- current_balance: 50 (FREE tier, 15 sub + 35 purchased)
- purchased_credits_balance: 35
- subscription_tier: FREE
- monthly_allowance: 15

User purchases 100 credits via Stripe:
→ add_purchased_credits(user_id, 100)

Result:
- current_balance: 150 (15 sub + 135 purchased) ✅
- purchased_credits_balance: 135 ✅
```

### Scenario 2: User Consumes Credits
```
Initial State:
- current_balance: 150
- purchased_credits_balance: 135
- consumed_this_month: 0

User generates 10 images (20 credits):
→ consume_user_credits(user_id, 20)

Result:
- current_balance: 130 (15 sub + 115 purchased)
- purchased_credits_balance: 115 (135 - 20) ✅
- consumed_this_month: 0 (no subscription credits used) ✅
```

### Scenario 3: Monthly Reset
```
State Before Reset (Feb 28):
- current_balance: 130
- purchased_credits_balance: 115
- subscription_tier: FREE
- monthly_allowance: 15
- consumed_this_month: 0

Monthly reset runs (Mar 1):
→ reset_monthly_subscription_benefits()

Result After Reset:
- current_balance: 130 (15 + 115) ✅ Same!
- purchased_credits_balance: 115 ✅ Preserved!
- consumed_this_month: 0 ✅ Reset!
```

### Scenario 4: User Upgrades Tier
```
State Before Upgrade:
- current_balance: 130
- purchased_credits_balance: 115
- subscription_tier: FREE
- monthly_allowance: 15

User upgrades to PLUS ($10/month):
→ Manual tier change

Immediate Effect:
- current_balance: 250 (150 + 100 purchased if they had any)
- purchased_credits_balance: 115 ✅ Still preserved
- subscription_tier: PLUS
- monthly_allowance: 150

Next Month (Reset):
- current_balance: 265 (150 + 115)
- purchased_credits_balance: 115 ✅ Still there!
```

---

## Testing Checklist

- [x] NanoBanana charges 2 credits (not 1)
- [x] Seedream charges 2 credits
- [x] Video generation charges fixed credits (not variable)
- [x] Purchased credits are added via Stripe webhook
- [x] Credits are consumed purchased-first
- [x] Monthly reset preserves purchased credits
- [x] Refunds restore to correct bucket
- [x] Transaction logs track consumption breakdown

---

## Deployment Notes

**Migrations to Apply:**
1. `062_fix_purchased_credits_rollover.sql` (if not applied)
2. `20251014000001_add_refund_credits_function.sql` (new)

**Backward Compatibility:**
- ✅ All functions have fallbacks for missing RPC functions
- ✅ Existing code continues to work during migration
- ✅ No breaking changes to API contracts

---

## Summary

✅ **Purchased credits roll over indefinitely**
✅ **Subscription credits reset monthly**
✅ **Smart consumption (purchased first)**
✅ **Smart refunds (subscription first)**
✅ **Accurate pricing (all profitable)**
✅ **Comprehensive logging & tracking**

The credit system now works exactly as intended. Users can purchase credits that never expire, while maintaining their monthly subscription benefits.

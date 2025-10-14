# Complete Tier & Pricing Implementation Plan

**Status:** Ready for Implementation
**Estimated Time:** 2-3 weeks
**Complexity:** Medium
**Risk Level:** Low (verified with Supabase CLI)

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Database Schema Analysis](#database-schema-analysis)
3. [Current State Audit](#current-state-audit)
4. [Implementation Phases](#implementation-phases)
5. [Detailed Migration Scripts](#detailed-migration-scripts)
6. [Code Changes Checklist](#code-changes-checklist)
7. [Testing & Validation](#testing--validation)
8. [Rollback Plan](#rollback-plan)

---

## Executive Summary

### Goals
1. ✅ Add CREATOR tier (4th subscription level)
2. ✅ Update credit allocations for all tiers
3. ✅ Implement tiered model pricing (Budget/Standard/Premium/Ultra)
4. ✅ Clarify that anyone can purchase credits (not subscription-locked)
5. ✅ Integrate Sora 2 and VEO 3 premium models

### Key Changes
| Item | Current | Recommended |
|------|---------|-------------|
| **Tiers** | FREE, PLUS, PRO | FREE, PLUS, PRO, CREATOR |
| **FREE Credits** | 5/month | 15/month |
| **PLUS Credits** | 50/month | 150/month |
| **PRO Credits** | 200/month | 500/month |
| **CREATOR Credits** | N/A | 1,500/month |
| **Credit Purchase Model** | Unclear | Open to all users |
| **Video Models** | Seedream, WAN | + Sora 2, Sora 2 Pro |

---

## Database Schema Analysis

### Current Schema (Verified via Supabase CLI)

#### 1. Subscription Tier Enum
```sql
CREATE TYPE "public"."subscription_tier" AS ENUM (
    'FREE',
    'PLUS',
    'PRO'
);
```

#### 2. Tables Using `subscription_tier`

| Table | Column | Type | Purpose |
|-------|--------|------|---------|
| `users_profile` | `subscription_tier` | `subscription_tier` | User's current tier |
| `rate_limits` | `subscription_tier` | `subscription_tier` | Tier-based rate limits |
| `subscriptions` | `tier` | `subscription_tier` | Subscription records |
| `user_credits` | `subscription_tier` | `varchar(20)` | ⚠️ **String, not enum!** |

**CRITICAL FINDING:** The `user_credits` table uses `varchar(20)` instead of the enum type! This is actually GOOD for us - makes migration easier.

#### 3. Functions Using `subscription_tier`
- `check_user_rate_limit()` - Returns tier info
- `get_user_rate_limit_status()` - Checks tier limits
- `trigger_subscription_change_email()` - Email on tier change
- `send_subscription_expiring_reminders()` - Expiry reminders

#### 4. Database Triggers
- Auto-assigns FREE tier on user signup
- Updates credits based on tier changes
- Sends emails on tier changes

---

## Current State Audit

### Code References (Found via grep)

**Files with Tier References:** 30+ files

**Type Definitions:**
- `'FREE' | 'PLUS' | 'PRO'` - Found in 9 core files
- Most use string literals, not enum imports

**Key Files to Update:**

| File | Line | Current Type | Change Needed |
|------|------|--------------|---------------|
| `apps/web/app/subscription/page.tsx` | 12 | `tier: 'FREE' \| 'PLUS' \| 'PRO'` | Add `\| 'CREATOR'` |
| `apps/mobile/lib/database-types.ts` | 5 | `type SubscriptionTier = 'FREE' \| 'PLUS' \| 'PRO'` | Add `\| 'CREATOR'` |
| `apps/web/lib/services/subscription-benefits.service.ts` | 6 | `subscription_tier: 'FREE' \| 'PLUS' \| 'PRO'` | Add `\| 'CREATOR'` |
| `apps/web/lib/services/plunk-campaigns.service.ts` | 25 | `tiers?: ('FREE' \| 'PLUS' \| 'PRO')[]` | Add `\| 'CREATOR'` |
| `apps/web/lib/credits/constants.ts` | 68-72 | `SUBSCRIPTION_ALLOWANCES` object | Add `creator: 1500` |

### Credit Packages (Database)

**Current Packages (from `scripts/setup-credit-packages.js`):**
```javascript
{ id: 'starter', credits: 10, price_usd: 2.99 }
{ id: 'basic', credits: 25, price_usd: 6.99 }
{ id: 'popular', credits: 50, price_usd: 12.99, is_popular: true }
{ id: 'pro', credits: 100, price_usd: 24.99 }
{ id: 'enterprise', credits: 250, price_usd: 59.99 }
```

**Recommended Updates:**
```javascript
{ id: 'starter', credits: 10, price_usd: 1.99 }      // -33%
{ id: 'basic', credits: 25, price_usd: 4.99 }        // -29%
{ id: 'popular', credits: 50, price_usd: 8.99 }      // -31%
{ id: 'pro', credits: 100, price_usd: 14.99 }        // -40%
{ id: 'enterprise', credits: 250, price_usd: 29.99 } // -50%
{ id: 'creator', credits: 500, price_usd: 49.99 }    // NEW
```

---

## Implementation Phases

### Phase 1: Database Migration (Week 1)

**Priority:** Critical
**Estimated Time:** 2-4 hours
**Risk:** Low

#### Tasks:
1. Add 'CREATOR' to subscription_tier enum
2. Update subscription_tiers lookup table
3. Update credit_packages table
4. Add new rate_limits for CREATOR tier
5. Verify all existing data remains intact

### Phase 2: Backend Code Updates (Week 1-2)

**Priority:** High
**Estimated Time:** 1 week
**Risk:** Medium

#### Tasks:
1. Update TypeScript types (9 files)
2. Update credit constants
3. Update Stripe integration
4. Add tiered model pricing logic
5. Add Sora 2 API integration

### Phase 3: Frontend UI Updates (Week 2)

**Priority:** High
**Estimated Time:** 3-5 days
**Risk:** Low

#### Tasks:
1. Update subscription page (add 4th tier card)
2. Update credit purchase messaging
3. Add model tier badges (Budget/Premium/Ultra)
4. Update feature gates for CREATOR tier
5. Add Sora 2 model selector

### Phase 4: Testing & Validation (Week 3)

**Priority:** Critical
**Estimated Time:** 3-5 days
**Risk:** Medium

#### Tasks:
1. Test all tier upgrades/downgrades
2. Test credit purchases (all tiers)
3. Test model access restrictions
4. Test Stripe webhooks
5. Load testing with CREATOR tier users

---

## Detailed Migration Scripts

### Migration 1: Add CREATOR Tier to Enum

**File:** `supabase/migrations/20250114000001_add_creator_tier.sql`

```sql
-- =====================================================
-- Migration: Add CREATOR tier
-- Date: 2025-01-14
-- Description: Adds CREATOR tier to subscription_tier enum
-- =====================================================

-- Step 1: Add CREATOR value to enum
ALTER TYPE public.subscription_tier ADD VALUE IF NOT EXISTS 'CREATOR';

-- Step 2: Verify enum values
DO $$
DECLARE
    enum_values text[];
BEGIN
    SELECT array_agg(e.enumlabel ORDER BY e.enumsortorder)
    INTO enum_values
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'subscription_tier';

    RAISE NOTICE 'Current subscription_tier values: %', enum_values;
END $$;

-- Step 3: Add comment
COMMENT ON TYPE public.subscription_tier IS 'User subscription tiers: FREE, PLUS, PRO, CREATOR';
```

### Migration 2: Update Subscription Tiers Table

**File:** `supabase/migrations/20250114000002_update_subscription_tiers_table.sql`

```sql
-- =====================================================
-- Migration: Update subscription_tiers lookup table
-- Date: 2025-01-14
-- Description: Add CREATOR tier configuration
-- =====================================================

-- Insert CREATOR tier configuration
INSERT INTO public.subscription_tiers (
    name,
    display_name,
    max_moodboards_per_day,
    max_user_uploads,
    max_ai_enhancements
) VALUES (
    'CREATOR',
    'Creator',
    50,              -- High limit for power users
    1000,            -- 1000 uploads
    500              -- 500 AI enhancements per day
) ON CONFLICT (name) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    max_moodboards_per_day = EXCLUDED.max_moodboards_per_day,
    max_user_uploads = EXCLUDED.max_user_uploads,
    max_ai_enhancements = EXCLUDED.max_ai_enhancements;

-- Verify insertion
SELECT name, display_name, max_moodboards_per_day, max_user_uploads, max_ai_enhancements
FROM public.subscription_tiers
ORDER BY
    CASE name
        WHEN 'FREE' THEN 1
        WHEN 'PLUS' THEN 2
        WHEN 'PRO' THEN 3
        WHEN 'CREATOR' THEN 4
    END;
```

### Migration 3: Update Credit Packages

**File:** `supabase/migrations/20250114000003_update_credit_packages.sql`

```sql
-- =====================================================
-- Migration: Update credit package pricing
-- Date: 2025-01-14
-- Description: Lower prices and add Creator package
-- =====================================================

-- Update existing packages with new pricing
UPDATE public.credit_packages SET price_usd = 1.99 WHERE id = 'starter';
UPDATE public.credit_packages SET price_usd = 4.99 WHERE id = 'basic';
UPDATE public.credit_packages SET price_usd = 8.99 WHERE id = 'popular';
UPDATE public.credit_packages SET price_usd = 14.99 WHERE id = 'pro';
UPDATE public.credit_packages SET price_usd = 29.99 WHERE id = 'enterprise';

-- Add new Creator package
INSERT INTO public.credit_packages (
    id,
    name,
    description,
    credits,
    price_usd,
    is_active,
    is_popular,
    sort_order
) VALUES (
    'creator',
    'Creator Pack',
    'Maximum credits for professional production work',
    500,
    49.99,
    true,
    false,
    6
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    credits = EXCLUDED.credits,
    price_usd = EXCLUDED.price_usd,
    is_active = EXCLUDED.is_active,
    is_popular = EXCLUDED.is_popular,
    sort_order = EXCLUDED.sort_order;

-- Verify updates
SELECT id, name, credits, price_usd, is_popular, sort_order
FROM public.credit_packages
WHERE is_active = true
ORDER BY sort_order;
```

### Migration 4: Add Rate Limits for CREATOR Tier

**File:** `supabase/migrations/20250114000004_creator_rate_limits.sql`

```sql
-- =====================================================
-- Migration: Add rate limits for CREATOR tier
-- Date: 2025-01-14
-- Description: Configure rate limiting for CREATOR users
-- =====================================================

-- Messages rate limits
INSERT INTO public.rate_limits (
    resource_type,
    subscription_tier,
    time_window_minutes,
    max_actions
) VALUES
    ('messages_daily', 'CREATOR', 1440, 500),      -- 500 messages per day
    ('messages_hourly', 'CREATOR', 60, 100),       -- 100 messages per hour
    ('showcases_daily', 'CREATOR', 1440, 50),      -- 50 showcases per day
    ('presets_daily', 'CREATOR', 1440, 100),       -- 100 presets per day
    ('moodboards_daily', 'CREATOR', 1440, 50)      -- 50 moodboards per day
ON CONFLICT (resource_type, subscription_tier) DO UPDATE SET
    time_window_minutes = EXCLUDED.time_window_minutes,
    max_actions = EXCLUDED.max_actions;

-- Verify rate limits
SELECT resource_type, subscription_tier, max_actions, time_window_minutes
FROM public.rate_limits
WHERE subscription_tier = 'CREATOR'
ORDER BY resource_type;
```

### Migration 5: Update Subscription Allowances

**File:** `supabase/migrations/20250114000005_update_credit_allowances.sql`

```sql
-- =====================================================
-- Migration: Update monthly credit allowances
-- Date: 2025-01-14
-- Description: Update credits for all tiers
-- =====================================================

-- NOTE: This updates the database trigger logic
-- The actual credit allocation is in the trigger function

-- Create a helper function to get tier allowances
CREATE OR REPLACE FUNCTION public.get_tier_credit_allowance(tier_name subscription_tier)
RETURNS integer
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN CASE tier_name
        WHEN 'FREE' THEN 15
        WHEN 'PLUS' THEN 150
        WHEN 'PRO' THEN 500
        WHEN 'CREATOR' THEN 1500
        ELSE 5  -- Default fallback
    END;
END;
$$;

-- Update existing user_credits to new allowances (optional - only if you want to apply retroactively)
UPDATE public.user_credits
SET monthly_allowance = public.get_tier_credit_allowance(subscription_tier::subscription_tier)
WHERE subscription_tier IN ('FREE', 'PLUS', 'PRO');

-- Verify updates
SELECT
    subscription_tier,
    COUNT(*) as user_count,
    AVG(monthly_allowance) as avg_allowance,
    AVG(current_balance) as avg_balance
FROM public.user_credits
GROUP BY subscription_tier
ORDER BY
    CASE subscription_tier
        WHEN 'FREE' THEN 1
        WHEN 'PLUS' THEN 2
        WHEN 'PRO' THEN 3
        WHEN 'CREATOR' THEN 4
    END;
```

### Migration 6: Update Signup Trigger

**File:** `supabase/migrations/20250114000006_update_signup_trigger.sql`

```sql
-- =====================================================
-- Migration: Update user signup trigger
-- Date: 2025-01-14
-- Description: Update credit allocation on signup
-- =====================================================

-- Update the handle_new_user trigger function to use new credit amounts
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    monthly_credits INTEGER;
    user_tier subscription_tier;
BEGIN
    -- Determine tier and credits from metadata or default to FREE
    user_tier := COALESCE(NEW.raw_user_meta_data->>'subscription_tier', 'FREE')::subscription_tier;

    -- Use the helper function to get allowance
    monthly_credits := public.get_tier_credit_allowance(user_tier);

    -- Insert user_credits record
    INSERT INTO public.user_credits (
        user_id,
        subscription_tier,
        monthly_allowance,
        current_balance,
        consumed_this_month,
        last_reset_at,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        user_tier::text,  -- Note: user_credits uses varchar, not enum
        monthly_credits,
        monthly_credits,  -- Start with full balance
        0,
        DATE_TRUNC('month', NOW()),
        NOW(),
        NOW()
    ) ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$$;

-- Verify trigger still exists
SELECT
    trigger_name,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created'
AND event_object_table = 'users';
```

---

## Code Changes Checklist

### TypeScript Type Definitions

#### Files to Update:

1. **apps/mobile/lib/database-types.ts**
```typescript
// Line 5 - BEFORE
export type SubscriptionTier = 'FREE' | 'PLUS' | 'PRO'

// Line 5 - AFTER
export type SubscriptionTier = 'FREE' | 'PLUS' | 'PRO' | 'CREATOR'
```

2. **apps/web/app/subscription/page.tsx**
```typescript
// Line 12 - BEFORE
tier: 'FREE' | 'PLUS' | 'PRO'

// Line 12 - AFTER
tier: 'FREE' | 'PLUS' | 'PRO' | 'CREATOR'

// Lines 23-82 - Add new plan object
{
  id: 'creator',
  name: 'Creator',
  tier: 'CREATOR',
  price: 49.99,
  period: 'month',
  credits: 1500,
  monthlyBumps: 25,
  prioritySupport: true,
  analytics: true,
  features: [
    '1,500 credits per month',
    '25 monthly listing bumps',
    'Priority support',
    'Advanced analytics',
    'Ultra-premium models (Sora 2 Pro)',
    'API access',
    'White-label solutions',
    'Custom branding',
    'Dedicated account manager'
  ]
}
```

3. **apps/web/lib/credits/constants.ts**
```typescript
// Lines 68-72 - BEFORE
export const SUBSCRIPTION_ALLOWANCES = {
  free: 5,
  plus: 50,
  pro: 200,
} as const;

// Lines 68-72 - AFTER
export const SUBSCRIPTION_ALLOWANCES = {
  free: 15,
  plus: 150,
  pro: 500,
  creator: 1500,
} as const;
```

4. **apps/web/lib/services/subscription-benefits.service.ts**
```typescript
// Line 6 - Add | 'CREATOR'
subscription_tier: 'FREE' | 'PLUS' | 'PRO' | 'CREATOR';
```

5. **apps/web/lib/services/plunk-campaigns.service.ts**
```typescript
// Line 25 - Add | 'CREATOR'
tiers?: ('FREE' | 'PLUS' | 'PRO' | 'CREATOR')[];
```

### New Files to Create

#### 1. Model Tier Pricing Constants

**File:** `apps/web/lib/credits/model-pricing.ts`

```typescript
/**
 * Tiered Model Pricing System
 * Maps model types to credit costs based on API costs
 */

export const VIDEO_MODEL_TIERS = {
  BUDGET: 'budget',
  STANDARD: 'standard',
  PREMIUM: 'premium',
  ULTRA: 'ultra',
} as const;

export type VideoModelTier = typeof VIDEO_MODEL_TIERS[keyof typeof VIDEO_MODEL_TIERS];

export interface VideoModelPricing {
  name: string;
  tier: VideoModelTier;
  apiCost: number;
  userCredits: number;
  minSubscriptionTier: 'FREE' | 'PLUS' | 'PRO' | 'CREATOR';
  description: string;
}

export const VIDEO_MODEL_PRICING: Record<string, VideoModelPricing> = {
  // Budget Models - Available to all
  'seedream-v4-480p': {
    name: 'Seedream V4 (480p)',
    tier: VIDEO_MODEL_TIERS.BUDGET,
    apiCost: 0.027,
    userCredits: 3,
    minSubscriptionTier: 'FREE',
    description: 'Fast, budget-friendly video generation',
  },
  'seedream-v4-720p': {
    name: 'Seedream V4 (720p)',
    tier: VIDEO_MODEL_TIERS.BUDGET,
    apiCost: 0.027,
    userCredits: 5,
    minSubscriptionTier: 'FREE',
    description: 'HD budget video generation',
  },

  // Standard Models - PLUS tier and above
  'wan-2.5-i2v-480p': {
    name: 'WAN 2.5 Image-to-Video (480p)',
    tier: VIDEO_MODEL_TIERS.STANDARD,
    apiCost: 0.25,
    userCredits: 10,
    minSubscriptionTier: 'PLUS',
    description: 'High-quality image-to-video conversion',
  },
  'wan-2.5-i2v-720p': {
    name: 'WAN 2.5 Image-to-Video (720p)',
    tier: VIDEO_MODEL_TIERS.STANDARD,
    apiCost: 0.25,
    userCredits: 15,
    minSubscriptionTier: 'PLUS',
    description: 'HD image-to-video conversion',
  },
  'wan-2.5-t2v': {
    name: 'WAN 2.5 Text-to-Video',
    tier: VIDEO_MODEL_TIERS.STANDARD,
    apiCost: 0.25,
    userCredits: 12,
    minSubscriptionTier: 'PLUS',
    description: 'Generate videos from text prompts',
  },

  // Premium Models - PRO tier and above
  'sora-2-t2v': {
    name: 'Sora 2 Text-to-Video',
    tier: VIDEO_MODEL_TIERS.PREMIUM,
    apiCost: 0.40,
    userCredits: 25,
    minSubscriptionTier: 'PRO',
    description: 'OpenAI Sora 2 - Premium text-to-video',
  },
  'sora-2-i2v': {
    name: 'Sora 2 Image-to-Video',
    tier: VIDEO_MODEL_TIERS.PREMIUM,
    apiCost: 0.40,
    userCredits: 25,
    minSubscriptionTier: 'PRO',
    description: 'OpenAI Sora 2 - Premium image-to-video',
  },

  // Ultra Models - CREATOR tier only
  'sora-2-pro-t2v': {
    name: 'Sora 2 Pro Text-to-Video',
    tier: VIDEO_MODEL_TIERS.ULTRA,
    apiCost: 1.20,
    userCredits: 80,
    minSubscriptionTier: 'CREATOR',
    description: 'OpenAI Sora 2 Pro - Ultra premium quality',
  },
  'sora-2-pro-i2v': {
    name: 'Sora 2 Pro Image-to-Video',
    tier: VIDEO_MODEL_TIERS.ULTRA,
    apiCost: 1.20,
    userCredits: 80,
    minSubscriptionTier: 'CREATOR',
    description: 'OpenAI Sora 2 Pro - Ultra premium quality',
  },
};

/**
 * Check if user has access to a model based on their tier
 */
export function canAccessModel(
  modelId: string,
  userTier: 'FREE' | 'PLUS' | 'PRO' | 'CREATOR'
): boolean {
  const model = VIDEO_MODEL_PRICING[modelId];
  if (!model) return false;

  const tierOrder = { FREE: 0, PLUS: 1, PRO: 2, CREATOR: 3 };
  return tierOrder[userTier] >= tierOrder[model.minSubscriptionTier];
}

/**
 * Get credit cost for a model
 */
export function getModelCreditCost(modelId: string): number {
  const model = VIDEO_MODEL_PRICING[modelId];
  return model?.userCredits || 5; // Default fallback
}
```

### Update Video Generation Endpoint

**File:** `apps/web/app/api/playground/video/route.ts`

```typescript
// Add at top of file
import { VIDEO_MODEL_PRICING, canAccessModel, getModelCreditCost } from '@/lib/credits/model-pricing';

// Replace lines 105-109 with:
const {
  selectedProvider = 'seedream',
  selectedModel = 'seedream-v4-480p', // NEW: Specific model selection
  // ... rest of request body
} = requestBody;

// Check tier access
const { data: userProfile } = await supabaseAdmin
  .from('users_profile')
  .select('subscription_tier')
  .eq('user_id', user.id)
  .single();

const userTier = userProfile?.subscription_tier || 'FREE';

if (!canAccessModel(selectedModel, userTier)) {
  return NextResponse.json(
    {
      success: false,
      error: `This model requires ${VIDEO_MODEL_PRICING[selectedModel].minSubscriptionTier} tier or higher`
    },
    { status: 403 }
  );
}

// Get credit cost for specific model
const creditsRequired = getModelCreditCost(selectedModel);
```

---

## Testing & Validation

### Test Plan

#### Phase 1: Database Tests

```sql
-- Test 1: Verify enum includes CREATOR
SELECT enumlabel
FROM pg_enum e
JOIN pg_type t ON e.enumtypid = t.oid
WHERE t.typname = 'subscription_tier'
ORDER BY e.enumsortorder;
-- Expected: FREE, PLUS, PRO, CREATOR

-- Test 2: Verify credit packages
SELECT id, name, credits, price_usd
FROM credit_packages
WHERE is_active = true
ORDER BY sort_order;
-- Expected: 6 packages including 'creator'

-- Test 3: Verify rate limits
SELECT resource_type, subscription_tier, max_actions
FROM rate_limits
WHERE subscription_tier = 'CREATOR';
-- Expected: 5 rows

-- Test 4: Test credit allowance function
SELECT public.get_tier_credit_allowance('CREATOR'::subscription_tier);
-- Expected: 1500
```

#### Phase 2: Backend API Tests

1. **Test Tier Upgrade**
   - Upgrade FREE → PLUS
   - Verify credits change 15 → 150
   - Check Stripe webhook

2. **Test Credit Purchase (All Tiers)**
   - Test as FREE user
   - Test as PLUS user
   - Test as PRO user
   - Verify Stripe checkout works

3. **Test Model Access**
   - FREE user tries Sora 2 → Should fail
   - PRO user tries Sora 2 → Should succeed
   - CREATOR user tries Sora 2 Pro → Should succeed

#### Phase 3: Frontend UI Tests

1. **Subscription Page**
   - Verify 4 tier cards display
   - Check responsive layout
   - Test upgrade flow

2. **Credit Purchase**
   - Test package selection
   - Verify Stripe redirect
   - Check success handling

3. **Model Selector**
   - Verify tier badges show
   - Check disabled states for locked models
   - Test tooltip explanations

### Automated Test Script

**File:** `scripts/test-tier-migration.ts`

```typescript
/**
 * Automated test script for tier migration
 * Run with: npx tsx scripts/test-tier-migration.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function runTests() {
  console.log('🧪 Starting Tier Migration Tests...\n');

  // Test 1: Enum values
  console.log('Test 1: Verify subscription_tier enum');
  const { data: enumData, error: enumError } = await supabase
    .rpc('get_enum_values', { enum_name: 'subscription_tier' });

  const expectedTiers = ['FREE', 'PLUS', 'PRO', 'CREATOR'];
  const hasAllTiers = expectedTiers.every(tier =>
    enumData?.includes(tier)
  );

  console.log(`✅ ${hasAllTiers ? 'PASS' : 'FAIL'}: Enum has all tiers`);

  // Test 2: Credit packages
  console.log('\nTest 2: Verify credit packages');
  const { data: packages } = await supabase
    .from('credit_packages')
    .select('*')
    .eq('is_active', true);

  console.log(`✅ ${packages?.length === 6 ? 'PASS' : 'FAIL'}: Found ${packages?.length} packages`);

  // Test 3: Rate limits
  console.log('\nTest 3: Verify CREATOR rate limits');
  const { data: rateLimits } = await supabase
    .from('rate_limits')
    .select('*')
    .eq('subscription_tier', 'CREATOR');

  console.log(`✅ ${rateLimits?.length === 5 ? 'PASS' : 'FAIL'}: Found ${rateLimits?.length} rate limits`);

  console.log('\n✅ All tests completed!');
}

runTests().catch(console.error);
```

---

## Rollback Plan

### If Something Goes Wrong

#### Option 1: Rollback Database Migration

```sql
-- ⚠️ EMERGENCY ROLLBACK - Use only if critical issues

-- Step 1: Remove CREATOR from existing users (if any were created)
UPDATE users_profile
SET subscription_tier = 'FREE'
WHERE subscription_tier = 'CREATOR';

-- Step 2: Delete CREATOR rate limits
DELETE FROM rate_limits WHERE subscription_tier = 'CREATOR';

-- Step 3: Delete CREATOR from subscription_tiers table
DELETE FROM subscription_tiers WHERE name = 'CREATOR';

-- Step 4: Delete creator credit package
DELETE FROM credit_packages WHERE id = 'creator';

-- Note: Cannot remove enum value without recreating the enum
-- This requires dropping and recreating all dependent objects
-- Only do this if absolutely necessary
```

#### Option 2: Hide CREATOR Tier (Soft Rollback)

```sql
-- Less destructive - just hide the tier
UPDATE subscription_tiers
SET display_name = '[BETA] Creator'
WHERE name = 'CREATOR';

-- Deactivate creator package
UPDATE credit_packages
SET is_active = false
WHERE id = 'creator';
```

#### Option 3: Feature Flag (Recommended)

Add environment variable to control tier visibility:

```typescript
// .env
ENABLE_CREATOR_TIER=false

// In code
const CREATOR_TIER_ENABLED = process.env.ENABLE_CREATOR_TIER === 'true';

const plans = basePlans.filter(plan =>
  plan.tier !== 'CREATOR' || CREATOR_TIER_ENABLED
);
```

---

## Implementation Timeline

### Week 1: Database & Backend

**Day 1-2: Database Migration**
- [ ] Run migrations 1-6
- [ ] Verify with test script
- [ ] Monitor error logs

**Day 3-5: Backend Code**
- [ ] Update TypeScript types
- [ ] Update credit constants
- [ ] Add model pricing system
- [ ] Update video generation endpoint
- [ ] Test API endpoints

### Week 2: Frontend & Integration

**Day 6-8: UI Updates**
- [ ] Update subscription page
- [ ] Update credit purchase flow
- [ ] Add model tier badges
- [ ] Update feature gates
- [ ] Responsive design testing

**Day 9-10: Sora 2 Integration**
- [ ] Add Sora 2 API endpoints
- [ ] Test video generation
- [ ] Add error handling
- [ ] Update UI to show new models

### Week 3: Testing & Launch

**Day 11-13: QA Testing**
- [ ] Run all test scripts
- [ ] Manual testing all flows
- [ ] Performance testing
- [ ] Cross-browser testing
- [ ] Mobile testing

**Day 14-15: Soft Launch**
- [ ] Deploy to staging
- [ ] Beta test with 10-20 users
- [ ] Monitor analytics
- [ ] Fix any issues
- [ ] Deploy to production

---

## Success Metrics

### Track These KPIs

| Metric | Target | How to Measure |
|--------|--------|----------------|
| **CREATOR Tier Signups** | 5+ in first month | Supabase query |
| **Credit Purchase Conversion** | 15% of free users | Stripe analytics |
| **Sora 2 Usage** | 50+ generations | API logs |
| **Revenue Increase** | +50% MRR | Stripe dashboard |
| **No Breaking Bugs** | 0 critical issues | Error monitoring |

### Monitoring Queries

```sql
-- Daily tier distribution
SELECT
    subscription_tier,
    COUNT(*) as user_count,
    SUM(current_balance) as total_credits
FROM user_credits
GROUP BY subscription_tier;

-- Credit package sales
SELECT
    package_id,
    COUNT(*) as purchases,
    SUM(amount_paid_usd) as revenue
FROM user_credit_purchases
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY package_id
ORDER BY revenue DESC;

-- Model usage stats
SELECT
    model_name,
    COUNT(*) as usage_count,
    SUM(credits_used) as total_credits
FROM video_generations
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY model_name
ORDER BY usage_count DESC;
```

---

## Contact & Support

**Questions?** Create an issue or contact the team.

**Emergency Rollback?** Follow [Rollback Plan](#rollback-plan)

**Migration Issues?** Check Supabase logs and run test script.

---

## Appendix

### A. Full File List for Updates

```
Database Migrations:
✅ supabase/migrations/20250114000001_add_creator_tier.sql
✅ supabase/migrations/20250114000002_update_subscription_tiers_table.sql
✅ supabase/migrations/20250114000003_update_credit_packages.sql
✅ supabase/migrations/20250114000004_creator_rate_limits.sql
✅ supabase/migrations/20250114000005_update_credit_allowances.sql
✅ supabase/migrations/20250114000006_update_signup_trigger.sql

TypeScript Types:
✅ apps/mobile/lib/database-types.ts
✅ apps/web/app/subscription/page.tsx
✅ apps/web/lib/credits/constants.ts
✅ apps/web/lib/services/subscription-benefits.service.ts
✅ apps/web/lib/services/plunk-campaigns.service.ts
✅ apps/web/lib/credits/model-pricing.ts (NEW)

API Endpoints:
✅ apps/web/app/api/playground/video/route.ts
✅ apps/web/app/api/stripe/webhook/route.ts
✅ apps/web/app/api/stripe/create-checkout-session/route.ts

UI Components:
✅ apps/web/app/subscription/page.tsx
✅ apps/web/components/profile/CreditsDashboard.tsx
✅ apps/web/app/components/playground/VideoGenerationPanel.tsx

Test Files:
✅ scripts/test-tier-migration.ts (NEW)
```

### B. SQL Quick Reference

```sql
-- Check current tier distribution
SELECT subscription_tier, COUNT(*) FROM users_profile GROUP BY subscription_tier;

-- Find all CREATOR users
SELECT id, email, display_name FROM users_profile WHERE subscription_tier = 'CREATOR';

-- Check credit balances by tier
SELECT subscription_tier, AVG(current_balance) FROM user_credits GROUP BY subscription_tier;

-- View recent credit purchases
SELECT * FROM user_credit_purchases ORDER BY created_at DESC LIMIT 10;
```

---

**Version:** 1.0
**Last Updated:** 2025-01-14
**Status:** Ready for Implementation ✅

# Credit Pricing Status & Accuracy Report

## Current Implementation Status

### ✅ What's Working (Phase 1 & 2 Complete)

1. **Subscription Tiers**
   - FREE: 15 credits/month ✅
   - PLUS: 150 credits/month ✅
   - PRO: 500 credits/month ✅
   - CREATOR: 1,500 credits/month ✅

2. **Credit Packages**
   - Starter: 10 credits @ $1.99 ✅
   - Basic: 25 credits @ $4.99 ✅
   - Popular: 50 credits @ $8.99 ✅
   - Pro: 100 credits @ $14.99 ✅
   - Enterprise: 250 credits @ $29.99 ✅
   - Creator: 500 credits @ $49.99 ✅

3. **Image Generation/Enhancement**
   - NanoBanana: 1 credit ✅
   - Seedream: 2 credits ✅

---

## ❌ What's NOT Accurate (Needs Phase 3)

### Video Generation Pricing - **INCORRECT**

**Current Implementation** (`apps/web/app/api/playground/video/route.ts:106-109`):
```typescript
const baseCredits = selectedProvider === 'wan' ? 12 : 8
const durationMultiplier = duration > 5 ? 1.5 : 1
const resolutionMultiplier = resolution === '720p' ? 1.5 : 1
const creditsRequired = Math.ceil(baseCredits * durationMultiplier * resolutionMultiplier)
```

**Current Actual Cost:**
- Seedream V4: 8-18 credits (depending on duration/resolution)
- WAN 2.5: 12-27 credits (depending on duration/resolution)

**❌ Problems:**
1. **Arbitrary pricing** - Not based on actual API costs
2. **Too low** - Seedream V4 costs ~$0.027 but charges 8 credits ($0.16 at $0.02/credit)
3. **WAN 2.5 underpriced** - Costs $0.25 but charges 12 credits ($0.24) - basically no margin!
4. **Variable multipliers** - Duration/resolution multipliers not aligned with actual costs
5. **No Sora integration** - Sora 2 and Sora 2 Pro not available

---

## 📊 Correct Pricing (Based on Research)

### Video Generation Actual API Costs

| Model | API Cost | Recommended Credits | Revenue @ $0.02/cr | Margin |
|-------|----------|---------------------|-------------------|--------|
| **Seedream V4** | $0.027 | 2 credits | $0.04 | 48% |
| **WAN 2.5** | $0.25 | 20 credits | $0.40 | 60% |
| **Sora 2** | $0.40 | 30 credits | $0.60 | 50% |
| **Sora 2 Pro** | $1.20 | 90 credits | $1.80 | 50% |

### Current Pricing Issues

**Seedream V4:**
- Current: 8-18 credits ($0.16-$0.36)
- Should be: 2 credits ($0.04)
- **Impact:** Overcharging users by 4-9x! 😱

**WAN 2.5:**
- Current: 12-27 credits ($0.24-$0.54)
- Should be: 20 credits ($0.40)
- **Impact:** Sometimes undercharging (no margin), sometimes overcharging

---

## 🎯 Recommended Pricing Structure (Phase 3)

### Tier-Based Model Access

**FREE Tier:**
- Can use: Seedream V4 only (2 credits)
- Budget option for testing

**PLUS Tier:**
- Can use: Seedream V4 (2 cr), WAN 2.5 (20 cr)
- Standard quality videos

**PRO Tier:**
- Can use: Seedream V4 (2 cr), WAN 2.5 (20 cr), Sora 2 (30 cr)
- Premium quality videos

**CREATOR Tier:**
- Can use: All models including Sora 2 Pro (90 cr)
- Ultra-premium for professionals

---

## 💰 Cost Analysis

### Current System (BROKEN)

**Example: User generates 10 videos with Seedream V4**
- Cost to us: 10 × $0.027 = $0.27
- Charge to user: 10 × 8 credits = 80 credits = $1.60
- Margin: $1.33 (493% profit!)

**Example: User generates 10 videos with WAN 2.5**
- Cost to us: 10 × $0.25 = $2.50
- Charge to user: 10 × 12 credits = 120 credits = $2.40
- Margin: -$0.10 (LOSING MONEY!) 😱

### Proposed System (CORRECT)

**Example: User generates 10 videos with Seedream V4**
- Cost to us: 10 × $0.027 = $0.27
- Charge to user: 10 × 2 credits = 20 credits = $0.40
- Margin: $0.13 (48% profit) ✅

**Example: User generates 10 videos with WAN 2.5**
- Cost to us: 10 × $0.25 = $2.50
- Charge to user: 10 × 20 credits = 200 credits = $4.00
- Margin: $1.50 (60% profit) ✅

**Example: User generates 10 videos with Sora 2**
- Cost to us: 10 × $0.40 = $4.00
- Charge to user: 10 × 30 credits = 300 credits = $6.00
- Margin: $2.00 (50% profit) ✅

---

## 🚨 Immediate Issues

### 1. Overcharging FREE Users
- Current Seedream cost: 8 credits
- Should be: 2 credits
- **Impact:** FREE users (15 credits) can only make 1-2 videos instead of 7-8!

### 2. Losing Money on WAN 2.5
- Sometimes charges 12 credits ($0.24) for $0.25 cost
- **Impact:** Negative margins on some WAN videos

### 3. No Premium Models
- Sora 2 and Sora 2 Pro not available
- **Impact:** Missing revenue from CREATOR tier users

### 4. Confusing Variable Pricing
- Duration and resolution multipliers are arbitrary
- Users can't predict costs
- **Impact:** Poor UX, unexpected charges

---

## 📋 Phase 3 Implementation Plan

### Step 1: Update Credit Constants

**File:** `apps/web/lib/credits/constants.ts`

Add video pricing:
```typescript
export const VIDEO_COSTS = {
  seedream_v4: {
    userCredits: 2,
    apiCost: 0.027,
    tier: 'FREE', // Minimum tier required
  },
  wan_2_5: {
    userCredits: 20,
    apiCost: 0.25,
    tier: 'PLUS',
  },
  sora_2: {
    userCredits: 30,
    apiCost: 0.40,
    tier: 'PRO',
  },
  sora_2_pro: {
    userCredits: 90,
    apiCost: 1.20,
    tier: 'CREATOR',
  },
} as const;
```

### Step 2: Update Video Generation API

**File:** `apps/web/app/api/playground/video/route.ts`

Replace lines 106-109 with:
```typescript
import { VIDEO_COSTS } from '@/lib/credits/constants';

// Map provider to cost structure
const costMapping = {
  'seedream': VIDEO_COSTS.seedream_v4,
  'wan': VIDEO_COSTS.wan_2_5,
  'sora2': VIDEO_COSTS.sora_2,
  'sora2pro': VIDEO_COSTS.sora_2_pro,
};

const videoCost = costMapping[selectedProvider];
if (!videoCost) {
  return NextResponse.json(
    { success: false, error: 'Invalid video provider' },
    { status: 400 }
  );
}

// Check tier access
const { data: userProfile } = await supabaseAdmin
  .from('users_profile')
  .select('subscription_tier')
  .eq('user_id', user.id)
  .single();

const tierOrder = ['FREE', 'PLUS', 'PRO', 'CREATOR'];
const userTierIndex = tierOrder.indexOf(userProfile.subscription_tier);
const requiredTierIndex = tierOrder.indexOf(videoCost.tier);

if (userTierIndex < requiredTierIndex) {
  return NextResponse.json(
    {
      success: false,
      error: `${selectedProvider} requires ${videoCost.tier} tier or higher. Please upgrade your subscription.`,
      requiredTier: videoCost.tier
    },
    { status: 403 }
  );
}

const creditsRequired = videoCost.userCredits;
```

### Step 3: Add Model Selector UI

**File:** `apps/web/app/components/VideoModelSelector.tsx` (NEW)

Create a UI component showing:
- Available models based on user tier
- Credit cost per model
- Quality indicators (Budget/Standard/Premium/Ultra)
- "Upgrade to unlock" badges for locked models

### Step 4: Update Playground UI

Show model costs and tier requirements in the video generation interface.

### Step 5: Add Sora Integration

- Contact WaveSpeed API to get Sora 2 access
- Add Sora provider to video generation routes
- Test with CREATOR tier users

---

## 🎬 Rollout Strategy

### Phase 3A: Fix Current Pricing (Urgent)
1. Update Seedream to 2 credits (from 8) ✅ Helps FREE users
2. Update WAN to 20 credits (from 12) ⚠️ Price increase
3. Remove variable multipliers ✅ Simpler, predictable

**Impact:**
- FREE users can make 7 videos instead of 1
- WAN videos become profitable
- Clearer, more predictable pricing

### Phase 3B: Add Tier Gating (Important)
1. Check user tier before video generation
2. Show "upgrade to unlock" for premium models
3. Add model selector UI

**Impact:**
- Clear upgrade incentive
- Better tier differentiation
- Prevents unauthorized access

### Phase 3C: Add Sora Models (Nice to Have)
1. Integrate Sora 2 API
2. Add Sora 2 Pro API
3. Make available to appropriate tiers

**Impact:**
- Premium feature for high-tier users
- Higher revenue per video
- Competitive differentiation

---

## 📊 Financial Impact

### Current State (Monthly)
Assume 1000 videos/month:
- 700 Seedream (overcharged): +$931 extra revenue
- 300 WAN (undercharged): -$30 lost revenue
- **Net impact:** +$901/mo from overcharging

### After Phase 3A Fix
Same 1000 videos/month:
- 700 Seedream (correct): -$931 revenue decrease
- 300 WAN (correct): +$480 revenue increase
- **Net impact:** -$451/mo revenue loss

**BUT:**
- User satisfaction increases (fair pricing)
- FREE users can actually use the platform (7x more videos)
- Conversion rate to paid likely increases
- Better product-market fit

### After Phase 3B (Tier Gating)
- PLUS users use WAN more often
- PRO users try Sora 2
- CREATOR users get exclusive access
- **Estimated impact:** +$200-500/mo from upgrades

### After Phase 3C (Sora Models)
- CREATOR users generate Sora 2 Pro videos ($1.80 revenue each)
- Premium positioning
- **Estimated impact:** +$500-1000/mo from premium videos

---

## 🎯 Next Steps

1. **Immediate (Today):**
   - Review this document
   - Approve Phase 3A pricing changes
   - Update credit constants

2. **This Week:**
   - Implement Phase 3A (fix pricing)
   - Test with existing users
   - Monitor conversion impact

3. **Next Week:**
   - Implement Phase 3B (tier gating)
   - Add model selector UI
   - Update documentation

4. **Future:**
   - Research Sora API integration
   - Implement Phase 3C when ready
   - Add analytics for model usage

---

## 🔍 Testing Checklist

After Phase 3A implementation:

- [ ] FREE user can generate 7 Seedream videos (not 1)
- [ ] Seedream video costs 2 credits (not 8)
- [ ] WAN video costs 20 credits (not 12)
- [ ] No duration/resolution multipliers applied
- [ ] Credit balance updates correctly
- [ ] Cost display matches actual charge
- [ ] Video generation still works correctly
- [ ] No breaking changes to existing features

---

## Summary

**Current Status:** ❌ Video pricing is inaccurate and causing issues

**Problems:**
1. Overcharging FREE users (4-9x too expensive)
2. Sometimes losing money on WAN videos
3. No premium model options
4. Confusing variable pricing

**Solution:** Phase 3 implementation with accurate, tier-based pricing

**Estimated Effort:** 4-6 hours

**Priority:** HIGH - Affects user experience and profitability

# NanoBanana Credit Usage Fix

## Problem
- NanoBanana consumes 4 credits per enhancement
- App only deducts 1 credit from users
- This causes a 3 credit loss per enhancement

## Solution 1: Update Credit Deduction (Recommended)

In `/apps/web/app/api/enhance-image/route.ts`, change line 127 and 382:

```typescript
// Line 127 - Check for 4 credits instead of 1
if (!userCredits || userCredits.current_balance < 4) {
  console.log('Insufficient credits for user:', user.id, 'Balance:', userCredits?.current_balance);
  return NextResponse.json(
    { 
      success: false, 
      error: `Insufficient credits. You need 4 credits for enhancement. You have ${userCredits?.current_balance || 0} credits remaining.`,
      code: 'INSUFFICIENT_CREDITS',
      currentBalance: userCredits?.current_balance || 0,
      requiredCredits: 4,
      subscriptionTier: userCredits?.subscription_tier || 'free'
    },
    { status: 402 }
  );
}

// Line 382 - Deduct 4 credits instead of 1
await supabaseAdmin
  .from('user_credits')
  .update({ 
    current_balance: userCredits.current_balance - 4,  // Changed from -1 to -4
    consumed_this_month: userCredits.consumed_this_month + 4,  // Track 4 credits
    updated_at: new Date().toISOString()
  })
  .eq('user_id', user.id);

// Line 394 - Update transaction record
const { error: transactionError } = await supabaseAdmin
  .from('credit_transactions')
  .insert({
    user_id: user.id,
    moodboard_id: moodboardId || null,
    transaction_type: 'deduction',
    credits_used: 4,  // Changed from 1 to 4
    provider: 'nanobanan',
    api_request_id: taskId,
    enhancement_type: enhancementType,
    status: 'pending',
    created_at: new Date().toISOString()
  });
```

## Solution 2: Update UI to Show Correct Cost

In `/apps/web/app/components/EnhancementModal.tsx`, update line 317:

```typescript
<span className="text-sm text-blue-900">Enhancement Cost: 4 credits</span>
```

## Solution 3: Adjust User Credit Allowances

Update the subscription tiers to give users 4x more credits:

```sql
UPDATE user_credits 
SET 
  monthly_allowance = CASE subscription_tier
    WHEN 'free' THEN 12  -- 3 enhancements * 4 credits
    WHEN 'plus' THEN 100  -- 25 enhancements * 4 credits
    WHEN 'pro' THEN 400  -- 100 enhancements * 4 credits
  END,
  current_balance = current_balance * 4  -- Multiply existing balances by 4
WHERE 1=1;
```

## Alternative: Negotiate with NanoBanana

Contact NanoBanana support to:
1. Understand why image enhancement costs 4 credits
2. Check if there's a way to reduce it to 1 credit
3. Verify if this is the correct pricing for your API plan

## Testing the Fix

After implementing the fix:

1. Test with a user that has exactly 4 credits
2. Perform one enhancement
3. Verify user has 0 credits left
4. Check NanoBanana dashboard shows 4 credits consumed
5. Both should match now

## Long-term Recommendation

Consider implementing a credit multiplier configuration:

```typescript
// In environment variables
NANOBANAN_CREDITS_PER_ENHANCEMENT=4

// In code
const CREDITS_PER_ENHANCEMENT = parseInt(process.env.NANOBANAN_CREDITS_PER_ENHANCEMENT || '4');
```

This makes it easy to adjust if NanoBanana changes their pricing.
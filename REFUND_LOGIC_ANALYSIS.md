# Credit System & Refund Logic Analysis

## Overview
Your platform uses **NanoBanana (NB)** credits for image enhancement/generation operations. This document analyzes how credits are charged and when refunds should occur.

---

## 🔄 Current Credit Flow

### 1. Credit Deduction (UPFRONT)
**Location:** `apps/web/app/api/enhance-image/route.ts` (lines 508-526)

```typescript
// Credits are deducted IMMEDIATELY when task is submitted
await supabaseAdmin
  .from('user_credits')
  .update({ 
    current_balance: userCredits.current_balance - USER_CREDITS_PER_ENHANCEMENT,
    consumed_this_month: userCredits.consumed_this_month + USER_CREDITS_PER_ENHANCEMENT,
    updated_at: new Date().toISOString()
  })
  .eq('user_id', user.id);
```

**Key Point:** Credits are charged BEFORE the enhancement task is actually processed.

---

## 💸 Credit Cost Structure

### User Perspective
- **1 credit** per enhancement (always shown to users)

### Backend/Platform Perspective
- **NanoBanana:** 1 user credit = 4 NanoBanana credits (1:4 ratio)
- **Seedream:** 1 user credit = 2 Seedream credits (1:2 ratio)
- **Cost:** ~$0.10 USD for 4 NanoBanana credits

### Credit Pools
Two separate credit systems:
1. **User Credits** (`user_credits` table)
   - Personal monthly allowance
   - Free: 5 credits/month
   - Plus: 50 credits/month
   - Pro: 200 credits/month

2. **Platform Credits** (`credit_pools` table)
   - Shared pool for all users
   - Provider: 'nanobanan'
   - Cost per credit: $0.025
   - Auto-refill threshold: 100 credits

---

## ⚠️ THE PROBLEM: Missing Refunds

### Current Refund Logic EXISTS But Has Gaps

#### ✅ Where Refunds WORK
**Location:** `packages/adapters/src/external/AsyncTaskManager.ts` (lines 159-183)

```typescript
} catch (error) {
  console.error(`Task ${taskId} processing error:`, error);
  
  // Update task with error
  await this.supabase
    .from('enhancement_tasks')
    .update({
      status: 'failed',
      error_message: errorMessage,
      updated_at: new Date().toISOString()
    })
    .eq('id', taskId);

  // ✅ REFUND CREDITS FOR FAILED TASK
  const { data: task } = await this.supabase
    .from('enhancement_tasks')
    .select('user_id, enhancement_type')
    .eq('id', taskId)
    .single();

  if (task) {
    await this.refundCredits(task.user_id, 1, task.enhancement_type);
  }
}
```

**Note:** This class (AsyncTaskManager) exists but is NOT currently used by the main API route.

#### ❌ Where Refunds DON'T WORK
**Location:** `apps/web/app/api/enhance-image/route.ts` (lines 342-442)

When API calls fail in the main route, there's NO refund logic:

```typescript
// Line 342-367: Network/fetch errors - NO REFUND
try {
  response = await fetch('https://api.nanobananaapi.ai/...');
  responseData = await response.json();
} catch (fetchError: any) {
  console.error(`Failed to call ${selectedProvider} API:`, fetchError);
  // ❌ RETURNS ERROR WITHOUT REFUNDING CREDIT
  return NextResponse.json({ 
    success: false, 
    error: 'Failed to connect to enhancement service',
    code: 'NETWORK_ERROR'
  }, { status: 503 });
}

// Line 373-442: Various API error responses - NO REFUND
if (!response.ok || responseData.code !== 200) {
  // Handle specific error cases
  if (responseData.code === 402) {
    // ❌ RETURNS ERROR WITHOUT REFUNDING CREDIT
    return NextResponse.json({ 
      success: false, 
      error: 'Insufficient credits in enhancement service',
      code: 'ENHANCEMENT_SERVICE_CREDITS'
    }, { status: 402 });
  }
  
  // ... more error cases, ALL WITHOUT REFUNDS
}
```

**The Issue:** Credits are deducted at line 508, but if errors occur at lines 342-442, the credit is NOT refunded.

#### ❌ CRITICAL: Callback Handler Missing Refunds
**Location:** `apps/web/app/api/nanobanana/callback/route.ts` (lines 93-143)

When NanoBanana sends a failure callback, there's NO refund logic:

```typescript
} else {
  // Error - task failed
  console.error('❌ NanoBanana task failed:', {
    taskId,
    code,
    msg
  });
  
  // Update task status to failed
  const { error: updateError } = await supabaseAdmin
    .from('enhancement_tasks')
    .update({
      status: 'failed',
      error_message: msg || 'Unknown error',
      completed_at: new Date().toISOString()
    })
    .eq('id', taskId)
  
  // ❌ NO REFUND LOGIC HERE!
  // User has already been charged, but generation failed
}
```

**This is CRITICAL** because:
1. User was charged when task was submitted (line 508-516 in enhance-image route)
2. Task was sent to NanoBanana for processing
3. NanoBanana failed and sends failure callback
4. We mark task as failed BUT NEVER REFUND THE CREDIT
5. User loses credit for a failed generation

---

## 🎯 When Refunds SHOULD Occur

### Failed Generation Scenarios (User should NOT lose credits)

1. **Network/Service Errors**
   - Cannot connect to NanoBanana API
   - Service timeout
   - HTTP 5xx errors from provider

2. **Provider-Side Errors**
   - Provider out of credits (code 402)
   - Invalid response format
   - Task submission failed

3. **Image Processing Failures**
   - URL not accessible
   - Invalid image format
   - Processing timeout

4. **Task Creation Failures**
   - Database error after credit deduction
   - Task storage failed

5. **Async Processing Failures** ✅ (Already handled)
   - Task polling failed
   - Enhancement processing error
   - Callback timeout

---

## 💻 The Refund Function (Database)

**Location:** `scripts/apply-credit-schema-direct.js` (lines 252-283)

```sql
CREATE OR REPLACE FUNCTION refund_user_credits(
  p_user_id UUID,
  p_credits INTEGER,
  p_enhancement_type VARCHAR(50)
) RETURNS VOID AS $$
BEGIN
  -- Add credits back to user
  UPDATE user_credits
  SET 
    current_balance = current_balance + p_credits,
    consumed_this_month = GREATEST(consumed_this_month - p_credits, 0),
    lifetime_consumed = GREATEST(lifetime_consumed - p_credits, 0),
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Log refund transaction
  INSERT INTO credit_transactions (
    user_id,
    transaction_type,
    credits_used,
    enhancement_type,
    status
  ) VALUES (
    p_user_id,
    'refund',
    p_credits,
    p_enhancement_type,
    'completed'
  );
END;
$$ LANGUAGE plpgsql;
```

**What it does:**
- Adds credits back to user's balance
- Reduces consumed_this_month counter
- Reduces lifetime_consumed counter
- Creates a 'refund' transaction record for audit trail

---

## 📊 Platform Loss Analysis

### Current Situation
When a generation fails but credit isn't refunded:
- **User Loss:** 1 credit ($0.10 value)
- **Platform Loss:** 0 NB credits (because API call never succeeded)
- **Net Result:** User pays for nothing = Bad UX + Trust issue

### With Proper Refunds
When a generation fails with refund:
- **User Loss:** 0 credits (refunded)
- **Platform Loss:** 0 NB credits (API call never succeeded)
- **Net Result:** Fair for user, no platform loss

### Edge Case: Partial Success
If NanoBanana charges but returns error:
- **User Loss:** 1 credit (should be refunded)
- **Platform Loss:** 4 NB credits (actually consumed by provider)
- **Net Result:** Platform absorbs cost, but maintains user trust

**Recommendation:** Monitor failed tasks with status tracking to identify if NanoBanana actually consumed credits.

---

## ✅ Solution: Add Refund Logic to Main API Route

### Required Changes to `apps/web/app/api/enhance-image/route.ts`

```typescript
// Helper function to refund credits
async function refundUserCredits(
  supabaseAdmin: any,
  userId: string,
  credits: number,
  enhancementType: string,
  reason: string
) {
  console.log(`Refunding ${credits} credit(s) to user ${userId}. Reason: ${reason}`);
  
  try {
    // Call the database refund function
    const { error } = await supabaseAdmin.rpc('refund_user_credits', {
      p_user_id: userId,
      p_credits: credits,
      p_enhancement_type: enhancementType
    });

    if (error) {
      console.error('Failed to refund credits:', error);
      // Log to system alerts for admin review
      await supabaseAdmin
        .from('system_alerts')
        .insert({
          type: 'refund_failed',
          level: 'error',
          message: `Failed to refund ${credits} credits to user ${userId}`,
          metadata: { userId, credits, reason, error: error.message }
        });
    } else {
      console.log(`Successfully refunded ${credits} credit(s) to user ${userId}`);
    }
  } catch (err) {
    console.error('Exception during refund:', err);
  }
}
```

### Add Refund to Callback Handler (MOST CRITICAL)

**File:** `apps/web/app/api/nanobanana/callback/route.ts`

Add refund logic when callback receives failure:

```typescript
} else {
  // Error - task failed
  console.error('❌ NanoBanana task failed:', {
    taskId,
    code,
    msg
  })
  
  // Get task details to find user_id
  const { data: task } = await supabaseAdmin
    .from('enhancement_tasks')
    .select('user_id, enhancement_type')
    .eq('id', taskId)
    .single()
  
  // Update task status to failed
  const { error: updateError } = await supabaseAdmin
    .from('enhancement_tasks')
    .update({
      status: 'failed',
      error_message: msg || 'Unknown error',
      completed_at: new Date().toISOString()
    })
    .eq('id', taskId)
  
  if (updateError) {
    console.error('Error updating failed task status:', updateError)
  }
  
  // ✅ REFUND CREDITS TO USER
  if (task) {
    console.log(`Refunding 1 credit to user ${task.user_id} for failed task ${taskId}`)
    
    const { error: refundError } = await supabaseAdmin.rpc('refund_user_credits', {
      p_user_id: task.user_id,
      p_credits: 1,
      p_enhancement_type: task.enhancement_type
    })
    
    if (refundError) {
      console.error('Failed to refund credits:', refundError)
      // Log alert for manual review
      await supabaseAdmin
        .from('system_alerts')
        .insert({
          type: 'refund_failed',
          level: 'error',
          message: `Failed to refund credits for task ${taskId}`,
          metadata: { 
            taskId, 
            userId: task.user_id, 
            error: refundError.message 
          }
        })
    } else {
      console.log('✅ Credits refunded successfully')
    }
  }
  
  // ... rest of playground logic
}
```

### Add Refund Calls to Error Handlers

**After line 342 (network errors):**
```typescript
} catch (fetchError: any) {
  console.error(`Failed to call ${selectedProvider} API:`, fetchError);
  
  // REFUND THE CREDIT
  await refundUserCredits(
    supabaseAdmin,
    user.id,
    USER_CREDITS_PER_ENHANCEMENT,
    enhancementType,
    'Network error - API call failed'
  );
  
  return NextResponse.json({ 
    success: false, 
    error: 'Failed to connect to enhancement service',
    code: 'NETWORK_ERROR',
    refunded: true
  }, { status: 503 });
}
```

**After line 373 (API errors):**
```typescript
if (!response.ok || responseData.code !== 200) {
  console.error(`${providerUsed} API error:`, responseData);
  
  // REFUND THE CREDIT
  await refundUserCredits(
    supabaseAdmin,
    user.id,
    USER_CREDITS_PER_ENHANCEMENT,
    enhancementType,
    `API error: ${responseData.msg || responseData.code}`
  );
  
  // Return appropriate error...
}
```

**After line 496 (task creation failure):**
```typescript
if (taskError) {
  console.error('Failed to store task:', taskError);
  
  // REFUND THE CREDIT
  await refundUserCredits(
    supabaseAdmin,
    user.id,
    USER_CREDITS_PER_ENHANCEMENT,
    enhancementType,
    'Task creation failed'
  );
  
  return NextResponse.json({ 
    success: false, 
    error: 'Failed to store enhancement task',
    refunded: true
  }, { status: 500 });
}
```

---

## 📈 Monitoring & Analytics

### Recommended Metrics to Track

1. **Refund Rate**
   - Total refunds / Total attempts
   - Target: < 5%

2. **Refund Reasons**
   - Group by error type
   - Identify systematic issues

3. **Provider Reliability**
   - Success rate by provider (NanoBanana vs Seedream)
   - Average processing time

4. **Platform Loss**
   - Track cases where NanoBanana consumed credits but task failed
   - Query: `SELECT * FROM credit_transactions WHERE status = 'failed'`

### Query to Find Failed Tasks Without Refunds

```sql
-- Find users who lost credits due to failed tasks
SELECT 
  et.user_id,
  et.id as task_id,
  et.status,
  et.error_message,
  et.created_at,
  ct.transaction_type,
  ct.credits_used
FROM enhancement_tasks et
LEFT JOIN credit_transactions ct ON ct.user_id = et.user_id 
  AND ct.api_request_id = et.id
  AND ct.transaction_type = 'refund'
WHERE et.status = 'failed' 
  AND ct.id IS NULL  -- No refund transaction found
ORDER BY et.created_at DESC;
```

---

## 🎯 Summary & Recommendations

### Current State
- ✅ Refund function exists in database
- ✅ Refund logic works for async task failures
- ❌ Refund logic MISSING for API/network failures in main route
- ❌ Users lose credits when generations fail due to service issues

### Required Actions

1. **HIGH PRIORITY:** Add refund logic to `enhance-image/route.ts` for all error cases after credit deduction
2. **MEDIUM PRIORITY:** Add monitoring dashboard for refund rates and failed tasks
3. **MEDIUM PRIORITY:** Implement retry logic before refunding (1-2 retries for network errors)
4. **LOW PRIORITY:** Add user notifications when credits are refunded

### Fair Credit Policy
**"If your generation fails, you don't pay."**

Users should ONLY lose credits when:
- ✅ Generation succeeds
- ✅ Generation completes (even if result is not perfect)

Users should NEVER lose credits when:
- ❌ API/Network errors occur
- ❌ Service is unavailable
- ❌ Provider runs out of credits
- ❌ Invalid URLs or formats (before processing)
- ❌ Any error before actual generation starts

---

## 📝 Implementation Checklist

### Priority 1: Critical Fixes (Prevent Future Credit Loss)
- [ ] **CRITICAL:** Add refund logic to NanoBanana callback handler (when code !== 200)
- [ ] Add `refundUserCredits` helper function to enhance-image route
- [ ] Add refund call after network errors (line 342-367)
- [ ] Add refund call after API errors (line 373-442)
- [ ] Add refund call after task creation failure (line 496-505)

### Priority 2: Monitoring & Alerts
- [ ] Add system alerts for failed refunds
- [ ] Create monitoring dashboard for refund metrics
- [ ] Add logging for all refund operations
- [ ] Set up alerts for high refund rates (>5%)

### Priority 3: User Experience
- [ ] Update API responses to include `refunded: true` field
- [ ] Add user notifications when credits are refunded
- [ ] Document refund policy in user-facing docs
- [ ] Add refund history view in user dashboard

### Priority 4: Testing & Validation
- [ ] Test refund flow for all error scenarios
- [ ] Test callback failure refunds
- [ ] Test network error refunds
- [ ] Test API error refunds
- [ ] Verify refund transactions are logged correctly

### Priority 5: Historical Data & Remediation
- [ ] Run query to identify historical failed tasks without refunds
- [ ] Calculate total credits lost by users
- [ ] Consider retroactively refunding affected users
- [ ] Create report of affected users and amounts

---

**Generated:** 2025-01-11
**Status:** Analysis Complete - Implementation Needed


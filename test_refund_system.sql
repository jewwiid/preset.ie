-- ============================================================================
-- TEST REFUND SYSTEM
-- Quick tests to verify refund logic is working
-- ============================================================================

-- Test 1: Verify refund function exists
SELECT 
  routine_name,
  routine_type,
  'Function exists ✅' as status
FROM information_schema.routines
WHERE routine_name = 'refund_user_credits'
  AND routine_schema = 'public';

-- Expected: Should return 1 row showing the function exists

-- ============================================================================
-- Test 2: Create a test user credit record (if needed)
-- Replace 'YOUR_USER_ID' with an actual user ID from your system
-- ============================================================================
/*
INSERT INTO user_credits (
  user_id,
  subscription_tier,
  monthly_allowance,
  current_balance,
  consumed_this_month,
  last_reset_at
) VALUES (
  'YOUR_USER_ID',  -- Replace with real user ID
  'plus',
  50,
  50,
  0,
  NOW()
) ON CONFLICT (user_id) DO NOTHING;
*/

-- ============================================================================
-- Test 3: Simulate a deduction (charge user)
-- Replace 'YOUR_USER_ID' with an actual user ID
-- ============================================================================
/*
-- Deduct 1 credit from user
UPDATE user_credits
SET 
  current_balance = current_balance - 1,
  consumed_this_month = consumed_this_month + 1,
  updated_at = NOW()
WHERE user_id = 'YOUR_USER_ID';

-- Create deduction transaction
INSERT INTO credit_transactions (
  user_id,
  transaction_type,
  credits_used,
  enhancement_type,
  cost_usd,
  provider,
  api_request_id,
  status
) VALUES (
  'YOUR_USER_ID',
  'deduction',
  1,
  'image_enhancement',
  0.10,
  'nanobanana',
  'test_task_' || gen_random_uuid(),
  'completed'
);

-- Check balance after deduction
SELECT 
  user_id,
  current_balance,
  consumed_this_month,
  'Should be -1 from original' as note
FROM user_credits
WHERE user_id = 'YOUR_USER_ID';
*/

-- ============================================================================
-- Test 4: Test the refund function
-- Replace 'YOUR_USER_ID' with an actual user ID
-- ============================================================================
/*
-- Call the refund function
SELECT refund_user_credits(
  'YOUR_USER_ID'::uuid,
  1,
  'image_enhancement'
);

-- Check balance after refund
SELECT 
  user_id,
  current_balance,
  consumed_this_month,
  'Should be back to original balance' as note
FROM user_credits
WHERE user_id = 'YOUR_USER_ID';

-- Verify refund transaction was created
SELECT 
  transaction_type,
  credits_used,
  enhancement_type,
  created_at,
  'Refund transaction created ✅' as status
FROM credit_transactions
WHERE user_id = 'YOUR_USER_ID'
  AND transaction_type = 'refund'
ORDER BY created_at DESC
LIMIT 1;
*/

-- ============================================================================
-- Test 5: Check system alerts (should be empty for successful refunds)
-- ============================================================================
SELECT 
  type,
  level,
  message,
  created_at
FROM system_alerts
WHERE type = 'refund_failed'
ORDER BY created_at DESC
LIMIT 5;

-- Expected: No rows (empty) if refunds are working properly

-- ============================================================================
-- FULL INTEGRATION TEST
-- This tests the complete refund flow with a real user
-- ============================================================================

/*
DO $$
DECLARE
  test_user_id UUID;
  initial_balance INTEGER;
  balance_after_deduction INTEGER;
  balance_after_refund INTEGER;
BEGIN
  -- Use first user with credits
  SELECT user_id, current_balance 
  INTO test_user_id, initial_balance
  FROM user_credits 
  WHERE current_balance > 0 
  LIMIT 1;
  
  IF test_user_id IS NULL THEN
    RAISE EXCEPTION 'No users with credits found for testing';
  END IF;
  
  RAISE NOTICE 'Testing with user: %, Initial balance: %', test_user_id, initial_balance;
  
  -- Step 1: Deduct a credit (simulate charge)
  UPDATE user_credits
  SET 
    current_balance = current_balance - 1,
    consumed_this_month = consumed_this_month + 1
  WHERE user_id = test_user_id;
  
  SELECT current_balance INTO balance_after_deduction
  FROM user_credits WHERE user_id = test_user_id;
  
  RAISE NOTICE 'After deduction: %', balance_after_deduction;
  
  -- Step 2: Call refund function (simulate failure)
  PERFORM refund_user_credits(test_user_id, 1, 'test_enhancement');
  
  SELECT current_balance INTO balance_after_refund
  FROM user_credits WHERE user_id = test_user_id;
  
  RAISE NOTICE 'After refund: %', balance_after_refund;
  
  -- Step 3: Verify the refund worked
  IF balance_after_refund = initial_balance THEN
    RAISE NOTICE '✅ TEST PASSED: Refund system working correctly!';
  ELSE
    RAISE EXCEPTION '❌ TEST FAILED: Expected %, Got %', initial_balance, balance_after_refund;
  END IF;
  
  -- Show the transactions created
  RAISE NOTICE 'Checking transactions...';
  
  -- Cleanup: Remove test transactions (optional)
  -- DELETE FROM credit_transactions 
  -- WHERE user_id = test_user_id 
  --   AND enhancement_type = 'test_enhancement';
  
END $$;
*/

-- ============================================================================
-- LIVE MONITORING QUERIES
-- Run these to monitor refunds in production
-- ============================================================================

-- Refunds in last 24 hours
SELECT 
  COUNT(*) as refunds_today,
  SUM(credits_used) as credits_refunded,
  COUNT(DISTINCT user_id) as users_affected
FROM credit_transactions
WHERE transaction_type = 'refund'
  AND created_at > NOW() - INTERVAL '24 hours';

-- Refund rate (last 7 days)
WITH stats AS (
  SELECT 
    COUNT(*) FILTER (WHERE transaction_type = 'deduction') as deductions,
    COUNT(*) FILTER (WHERE transaction_type = 'refund') as refunds
  FROM credit_transactions
  WHERE created_at > NOW() - INTERVAL '7 days'
)
SELECT 
  deductions,
  refunds,
  CASE 
    WHEN deductions > 0 
    THEN ROUND(refunds * 100.0 / deductions, 2) 
    ELSE 0 
  END as refund_rate_pct,
  CASE 
    WHEN deductions = 0 THEN 'No usage yet'
    WHEN ROUND(refunds * 100.0 / deductions, 2) < 5 THEN '✅ Healthy (<5%)'
    WHEN ROUND(refunds * 100.0 / deductions, 2) < 10 THEN '⚠️ Moderate (5-10%)'
    ELSE '❌ High (>10%)'
  END as health_status
FROM stats;

-- Recent refunds with reasons
SELECT 
  ct.user_id,
  up.display_name,
  ct.credits_used,
  ct.enhancement_type,
  ct.error_message,
  ct.created_at
FROM credit_transactions ct
LEFT JOIN users_profile up ON ct.user_id = up.user_id
WHERE ct.transaction_type = 'refund'
  AND ct.created_at > NOW() - INTERVAL '24 hours'
ORDER BY ct.created_at DESC;

-- ============================================================================
-- NOTES:
-- ============================================================================
/*
TESTING WORKFLOW:
1. Run Test 1 to verify function exists
2. Run Test 5 to check for failed refunds
3. For manual testing, uncomment Tests 2-4 and replace USER_ID
4. For full integration test, uncomment the DO $$ block in Test 5
5. Use Live Monitoring queries for production monitoring

EXPECTED RESULTS:
- Refund rate should be < 5% (most generations succeed)
- No 'refund_failed' alerts (refunds work smoothly)
- Deductions and refunds properly logged
- User balances correct after refunds

TROUBLESHOOTING:
If refunds aren't working:
1. Check if function exists (Test 1)
2. Check system_alerts for 'refund_failed' entries
3. Verify user has user_credits record
4. Check database logs for errors
*/


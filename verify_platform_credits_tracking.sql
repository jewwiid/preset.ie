-- ============================================================================
-- SQL Queries to Verify Platform Credits Tracking Status
-- Run these to see if platform credits are actually being consumed
-- ============================================================================

-- Query 1: Check current credit_pools status
-- Expected: If working, total_consumed should increase and updated_at should be recent
SELECT 
  provider,
  available_balance,
  total_purchased,
  total_consumed,
  cost_per_credit,
  status,
  last_refill_at,
  updated_at,
  created_at,
  CASE 
    WHEN total_consumed = 0 AND updated_at < NOW() - INTERVAL '7 days' 
    THEN '❌ NOT BEING CONSUMED'
    WHEN total_consumed > 0 AND updated_at > NOW() - INTERVAL '1 day'
    THEN '✅ ACTIVELY TRACKED'
    ELSE '⚠️ UNCLEAR'
  END as status_check
FROM credit_pools
ORDER BY provider;

-- Query 2: Check recent enhancement_tasks
-- See what providers are actually being used
SELECT 
  provider,
  COUNT(*) as task_count,
  COUNT(*) FILTER (WHERE status = 'completed') as completed,
  COUNT(*) FILTER (WHERE status = 'failed') as failed,
  COUNT(*) FILTER (WHERE status = 'processing') as processing,
  MAX(created_at) as last_task,
  MIN(created_at) as first_task
FROM enhancement_tasks
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY provider
ORDER BY task_count DESC;

-- Query 3: Check credit_transactions for platform tracking
-- See if any platform deductions are logged
SELECT 
  transaction_type,
  provider,
  COUNT(*) as transaction_count,
  SUM(credits_used) as total_credits_used,
  SUM(cost_usd) as total_cost_usd,
  MAX(created_at) as most_recent
FROM credit_transactions
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY transaction_type, provider
ORDER BY transaction_type, transaction_count DESC;

-- Query 4: Check if consume_platform_credits function exists and signature
SELECT 
  routine_name,
  routine_type,
  data_type,
  routine_definition
FROM information_schema.routines
WHERE routine_name = 'consume_platform_credits'
  AND routine_schema = 'public';

-- Query 5: Check for errors in system_alerts
-- See if there are any platform credit related alerts
SELECT 
  type,
  level,
  message,
  metadata,
  created_at
FROM system_alerts
WHERE type LIKE '%credit%' OR message LIKE '%credit%'
ORDER BY created_at DESC
LIMIT 20;

-- Query 6: Compare user credits consumed vs platform credits consumed
-- This will show the mismatch
WITH user_summary AS (
  SELECT 
    SUM(credits_used) as user_credits_consumed,
    COUNT(*) as transaction_count
  FROM credit_transactions
  WHERE transaction_type = 'deduction'
    AND created_at > NOW() - INTERVAL '30 days'
),
platform_summary AS (
  SELECT 
    SUM(total_consumed) as platform_credits_consumed
  FROM credit_pools
)
SELECT 
  us.user_credits_consumed,
  us.user_credits_consumed * 4 as expected_nanobanan_credits,
  ps.platform_credits_consumed as actual_platform_credits,
  us.transaction_count,
  CASE 
    WHEN ps.platform_credits_consumed = 0 
    THEN '❌ Platform credits NOT being tracked'
    WHEN ps.platform_credits_consumed < (us.user_credits_consumed * 4)
    THEN '⚠️ Platform credits under-counted'
    ELSE '✅ Platform credits tracked'
  END as tracking_status
FROM user_summary us, platform_summary ps;

-- Query 7: Check if fal.ai is actually being used
SELECT 
  provider,
  COUNT(*) as usage_count,
  MAX(created_at) as last_used
FROM enhancement_tasks
WHERE provider = 'fal_ai'
  OR provider LIKE '%fal%'
GROUP BY provider;

-- If no results, fal.ai is not being used and can be removed

-- Query 8: Detailed view of recent enhancements
-- See what's actually being tracked
SELECT 
  et.id,
  et.user_id,
  et.provider,
  et.status,
  et.created_at,
  uc.current_balance as user_credits_after,
  ct.transaction_type,
  ct.credits_used as user_credits_charged,
  ct.cost_usd,
  ct.provider as transaction_provider
FROM enhancement_tasks et
LEFT JOIN user_credits uc ON et.user_id = uc.user_id
LEFT JOIN credit_transactions ct ON ct.api_request_id = et.id::text
WHERE et.created_at > NOW() - INTERVAL '24 hours'
ORDER BY et.created_at DESC
LIMIT 20;

-- ============================================================================
-- INTERPRETATION GUIDE
-- ============================================================================

/*
If Query 1 shows:
- total_consumed = 0 and old updated_at → Platform credits NOT working ❌
- total_consumed > 0 and recent updated_at → Platform credits working ✅

If Query 2 shows:
- Only 'nanobanan' or 'nanobanana' → You're only using NanoBanana
- 'seedream' appears → You're using both providers
- 'fal_ai' appears → Remove it, you said you're not using it

If Query 3 shows:
- No 'platform_deduction' transactions → Platform tracking not working ❌
- Has 'deduction' transactions → User credits working ✅

If Query 6 shows:
- "Platform credits NOT being tracked" → CONFIRMED: The issue exists ❌
- Numbers match (4x ratio) → Platform tracking working ✅

RECOMMENDED ACTION:
If platform credits are NOT being tracked (Query 1 and 6 confirm):
1. Either fix the consume_platform_credits call
2. Or remove it and track costs externally
*/

-- ============================================================================
-- CLEANUP SCRIPT (Only run if fal.ai is not being used)
-- ============================================================================

/*
-- Remove fal.ai from credit_pools
DELETE FROM credit_pools WHERE provider = 'fal_ai';

-- Remove fal.ai from api_providers
DELETE FROM api_providers WHERE name = 'fal_ai';

-- Verify removal
SELECT provider FROM credit_pools;
*/


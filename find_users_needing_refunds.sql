-- SQL Queries to Identify Users Who Need Refunds
-- Run these queries to find users who lost credits due to failed enhancements

-- ============================================================================
-- QUERY 1: Find all failed tasks without corresponding refund transactions
-- ============================================================================
SELECT 
  et.id as task_id,
  et.user_id,
  et.status,
  et.error_message,
  et.enhancement_type,
  et.created_at as task_created,
  et.completed_at as task_failed_at,
  up.display_name,
  up.email,
  CASE 
    WHEN rt.id IS NULL THEN 'NO REFUND' 
    ELSE 'REFUNDED' 
  END as refund_status
FROM enhancement_tasks et
LEFT JOIN users_profile up ON et.user_id = up.user_id
LEFT JOIN credit_transactions rt ON 
  rt.user_id = et.user_id 
  AND rt.api_request_id = et.id 
  AND rt.transaction_type = 'refund'
WHERE et.status = 'failed'
  AND rt.id IS NULL  -- No refund transaction found
ORDER BY et.created_at DESC;

-- ============================================================================
-- QUERY 2: Count of affected users and total credits owed
-- ============================================================================
SELECT 
  COUNT(DISTINCT et.user_id) as affected_users,
  COUNT(et.id) as total_failed_tasks,
  COUNT(et.id) as total_credits_owed,
  ROUND(COUNT(et.id) * 0.10, 2) as total_value_usd
FROM enhancement_tasks et
LEFT JOIN credit_transactions rt ON 
  rt.user_id = et.user_id 
  AND rt.api_request_id = et.id 
  AND rt.transaction_type = 'refund'
WHERE et.status = 'failed'
  AND rt.id IS NULL;

-- ============================================================================
-- QUERY 3: Breakdown by user - who was affected and how much
-- ============================================================================
SELECT 
  et.user_id,
  up.display_name,
  up.email,
  up.subscription_tier,
  uc.current_balance as current_credits,
  COUNT(et.id) as failed_tasks_without_refund,
  COUNT(et.id) as credits_owed,
  ROUND(COUNT(et.id) * 0.10, 2) as value_owed_usd
FROM enhancement_tasks et
LEFT JOIN users_profile up ON et.user_id = up.user_id
LEFT JOIN user_credits uc ON et.user_id = uc.user_id
LEFT JOIN credit_transactions rt ON 
  rt.user_id = et.user_id 
  AND rt.api_request_id = et.id 
  AND rt.transaction_type = 'refund'
WHERE et.status = 'failed'
  AND rt.id IS NULL
GROUP BY et.user_id, up.display_name, up.email, up.subscription_tier, uc.current_balance
ORDER BY failed_tasks_without_refund DESC;

-- ============================================================================
-- QUERY 4: Breakdown by error type - what causes most failures
-- ============================================================================
SELECT 
  COALESCE(et.error_message, 'Unknown error') as error_type,
  COUNT(et.id) as failure_count,
  COUNT(DISTINCT et.user_id) as affected_users,
  COUNT(et.id) as credits_owed,
  ROUND(COUNT(et.id) * 0.10, 2) as value_owed_usd,
  ROUND(COUNT(et.id) * 100.0 / SUM(COUNT(et.id)) OVER(), 2) as percentage
FROM enhancement_tasks et
LEFT JOIN credit_transactions rt ON 
  rt.user_id = et.user_id 
  AND rt.api_request_id = et.id 
  AND rt.transaction_type = 'refund'
WHERE et.status = 'failed'
  AND rt.id IS NULL
GROUP BY et.error_message
ORDER BY failure_count DESC;

-- ============================================================================
-- QUERY 5: Timeline - when did failures occur (without refunds)
-- ============================================================================
SELECT 
  DATE(et.created_at) as date,
  COUNT(et.id) as failed_tasks,
  COUNT(DISTINCT et.user_id) as affected_users,
  COUNT(et.id) as credits_owed
FROM enhancement_tasks et
LEFT JOIN credit_transactions rt ON 
  rt.user_id = et.user_id 
  AND rt.api_request_id = et.id 
  AND rt.transaction_type = 'refund'
WHERE et.status = 'failed'
  AND rt.id IS NULL
GROUP BY DATE(et.created_at)
ORDER BY date DESC;

-- ============================================================================
-- QUERY 6: Detailed list for CSV export (for manual refunds)
-- ============================================================================
SELECT 
  et.id as task_id,
  et.user_id,
  up.email,
  up.display_name,
  et.enhancement_type,
  et.error_message,
  et.created_at as failed_at,
  1 as credits_to_refund,
  0.10 as value_usd,
  'manual_refund_batch_2025' as refund_batch,
  CONCAT('Refund for failed ', et.enhancement_type, ' enhancement on ', DATE(et.created_at)) as refund_reason
FROM enhancement_tasks et
LEFT JOIN users_profile up ON et.user_id = up.user_id
LEFT JOIN credit_transactions rt ON 
  rt.user_id = et.user_id 
  AND rt.api_request_id = et.id 
  AND rt.transaction_type = 'refund'
WHERE et.status = 'failed'
  AND rt.id IS NULL
ORDER BY et.created_at DESC;

-- ============================================================================
-- QUERY 7: Check current refund function exists
-- ============================================================================
SELECT 
  routine_name,
  routine_type,
  routine_definition
FROM information_schema.routines
WHERE routine_name = 'refund_user_credits'
  AND routine_schema = 'public';

-- ============================================================================
-- QUERY 8: Overall statistics
-- ============================================================================
WITH stats AS (
  SELECT 
    COUNT(*) FILTER (WHERE status = 'completed') as successful_tasks,
    COUNT(*) FILTER (WHERE status = 'failed') as failed_tasks,
    COUNT(*) FILTER (WHERE status = 'processing') as processing_tasks,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_tasks,
    COUNT(*) as total_tasks
  FROM enhancement_tasks
),
refunds AS (
  SELECT 
    COUNT(DISTINCT et.id) as failed_tasks_without_refund
  FROM enhancement_tasks et
  LEFT JOIN credit_transactions rt ON 
    rt.user_id = et.user_id 
    AND rt.api_request_id = et.id 
    AND rt.transaction_type = 'refund'
  WHERE et.status = 'failed'
    AND rt.id IS NULL
)
SELECT 
  stats.total_tasks,
  stats.successful_tasks,
  stats.failed_tasks,
  stats.processing_tasks,
  stats.pending_tasks,
  ROUND(stats.successful_tasks * 100.0 / NULLIF(stats.total_tasks, 0), 2) as success_rate_pct,
  ROUND(stats.failed_tasks * 100.0 / NULLIF(stats.total_tasks, 0), 2) as failure_rate_pct,
  refunds.failed_tasks_without_refund,
  ROUND(refunds.failed_tasks_without_refund * 100.0 / NULLIF(stats.failed_tasks, 0), 2) as pct_failures_without_refund
FROM stats, refunds;

-- ============================================================================
-- QUERY 9: Recent failures (last 24 hours) without refunds
-- ============================================================================
SELECT 
  et.id as task_id,
  et.user_id,
  up.display_name,
  up.email,
  et.enhancement_type,
  et.error_message,
  et.created_at,
  et.completed_at,
  EXTRACT(EPOCH FROM (et.completed_at - et.created_at)) / 60 as duration_minutes
FROM enhancement_tasks et
LEFT JOIN users_profile up ON et.user_id = up.user_id
LEFT JOIN credit_transactions rt ON 
  rt.user_id = et.user_id 
  AND rt.api_request_id = et.id 
  AND rt.transaction_type = 'refund'
WHERE et.status = 'failed'
  AND rt.id IS NULL
  AND et.created_at > NOW() - INTERVAL '24 hours'
ORDER BY et.created_at DESC;

-- ============================================================================
-- QUERY 10: Users with multiple failures (might need extra support)
-- ============================================================================
SELECT 
  et.user_id,
  up.display_name,
  up.email,
  up.subscription_tier,
  COUNT(et.id) as failure_count,
  MIN(et.created_at) as first_failure,
  MAX(et.created_at) as last_failure,
  COUNT(et.id) as credits_to_refund,
  ARRAY_AGG(DISTINCT et.error_message) as error_types
FROM enhancement_tasks et
LEFT JOIN users_profile up ON et.user_id = up.user_id
LEFT JOIN credit_transactions rt ON 
  rt.user_id = et.user_id 
  AND rt.api_request_id = et.id 
  AND rt.transaction_type = 'refund'
WHERE et.status = 'failed'
  AND rt.id IS NULL
GROUP BY et.user_id, up.display_name, up.email, up.subscription_tier
HAVING COUNT(et.id) >= 3  -- Users with 3 or more failures
ORDER BY failure_count DESC;

-- ============================================================================
-- BATCH REFUND SCRIPT (RUN AFTER CONFIRMING QUERY 1-10)
-- ============================================================================
-- WARNING: This will refund ALL users with failed tasks
-- Review the output of Query 1-10 first before running this!

/*
DO $$
DECLARE
  task_record RECORD;
  refund_count INTEGER := 0;
BEGIN
  -- Loop through all failed tasks without refunds
  FOR task_record IN (
    SELECT 
      et.id as task_id,
      et.user_id,
      et.enhancement_type
    FROM enhancement_tasks et
    LEFT JOIN credit_transactions rt ON 
      rt.user_id = et.user_id 
      AND rt.api_request_id = et.id 
      AND rt.transaction_type = 'refund'
    WHERE et.status = 'failed'
      AND rt.id IS NULL
  )
  LOOP
    -- Call refund function for each failed task
    PERFORM refund_user_credits(
      task_record.user_id,
      1,  -- 1 credit
      task_record.enhancement_type
    );
    
    refund_count := refund_count + 1;
    
    -- Log progress every 10 refunds
    IF refund_count % 10 = 0 THEN
      RAISE NOTICE 'Processed % refunds...', refund_count;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Batch refund complete. Total refunds: %', refund_count;
  
  -- Create system alert for this batch refund
  INSERT INTO system_alerts (type, level, message, metadata)
  VALUES (
    'batch_refund_completed',
    'info',
    'Batch refund processed for failed enhancement tasks',
    jsonb_build_object(
      'refund_count', refund_count,
      'processed_at', NOW(),
      'reason', 'Historical failed tasks without refunds'
    )
  );
END $$;
*/

-- ============================================================================
-- NOTES:
-- ============================================================================
-- 1. Run Query 1-10 first to understand the scope
-- 2. Export Query 6 to CSV for records
-- 3. Only run the batch refund script after review
-- 4. Monitor the system_alerts table after running batch refund
-- 5. Notify affected users about the refunds
-- 6. Update your refund policy documentation


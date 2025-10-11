-- ============================================================================
-- SIMPLIFIED MONITORING DASHBOARD
-- For Pay-Per-Generation Model (WaveSpeed API)
-- ============================================================================

-- Query 1: Overview Stats (Last 30 Days)
-- Shows high-level usage and cost summary
SELECT 
  COUNT(DISTINCT et.user_id) as active_users,
  COUNT(et.id) as total_generations,
  COUNT(et.id) FILTER (WHERE et.status = 'completed') as successful,
  COUNT(et.id) FILTER (WHERE et.status = 'failed') as failed,
  COUNT(ct.id) FILTER (WHERE ct.transaction_type = 'refund') as refunds_issued,
  COALESCE(SUM(ct.cost_usd) FILTER (WHERE ct.transaction_type = 'deduction' AND ct.status = 'completed'), 0) as total_wavespeed_cost,
  ROUND(
    COUNT(et.id) FILTER (WHERE et.status = 'completed') * 100.0 / 
    NULLIF(COUNT(et.id), 0), 
    2
  ) as success_rate_pct
FROM enhancement_tasks et
LEFT JOIN credit_transactions ct ON ct.api_request_id = et.id::text
WHERE et.created_at > NOW() - INTERVAL '30 days';

-- ============================================================================
-- Query 2: Provider Breakdown (Last 30 Days)
-- Shows which AI models/providers are being used
SELECT 
  et.provider,
  COUNT(et.id) as total_calls,
  COUNT(et.id) FILTER (WHERE et.status = 'completed') as successful,
  COUNT(et.id) FILTER (WHERE et.status = 'failed') as failed,
  ROUND(
    COUNT(et.id) FILTER (WHERE et.status = 'completed') * 100.0 / 
    NULLIF(COUNT(et.id), 0), 
    2
  ) as success_rate_pct,
  COALESCE(SUM(ct.cost_usd) FILTER (WHERE et.status = 'completed'), 0) as total_cost_usd,
  MAX(et.created_at) as last_used
FROM enhancement_tasks et
LEFT JOIN credit_transactions ct ON ct.api_request_id = et.id::text AND ct.transaction_type = 'deduction'
WHERE et.created_at > NOW() - INTERVAL '30 days'
GROUP BY et.provider
ORDER BY total_calls DESC;

-- ============================================================================
-- Query 3: Function/Enhancement Type Breakdown
-- Shows what features are being used (image gen, video gen, etc.)
SELECT 
  et.enhancement_type,
  et.provider,
  COUNT(et.id) as total_calls,
  COUNT(et.id) FILTER (WHERE et.status = 'completed') as successful,
  COUNT(et.id) FILTER (WHERE et.status = 'failed') as failed,
  COALESCE(SUM(ct.cost_usd) FILTER (WHERE et.status = 'completed'), 0) as total_cost_usd,
  ROUND(AVG(ct.cost_usd) FILTER (WHERE et.status = 'completed'), 4) as avg_cost_per_call
FROM enhancement_tasks et
LEFT JOIN credit_transactions ct ON ct.api_request_id = et.id::text AND ct.transaction_type = 'deduction'
WHERE et.created_at > NOW() - INTERVAL '30 days'
GROUP BY et.enhancement_type, et.provider
ORDER BY total_calls DESC;

-- ============================================================================
-- Query 4: Daily Usage & Cost Trends
-- Shows usage patterns over time
SELECT 
  DATE(et.created_at) as date,
  COUNT(et.id) as total_calls,
  COUNT(et.id) FILTER (WHERE et.status = 'completed') as successful,
  COUNT(et.id) FILTER (WHERE et.status = 'failed') as failed,
  COALESCE(SUM(ct.cost_usd) FILTER (WHERE et.status = 'completed'), 0) as daily_cost_usd,
  COUNT(DISTINCT et.user_id) as active_users
FROM enhancement_tasks et
LEFT JOIN credit_transactions ct ON ct.api_request_id = et.id::text AND ct.transaction_type = 'deduction'
WHERE et.created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(et.created_at)
ORDER BY date DESC;

-- ============================================================================
-- Query 5: User Credit Stats
-- Shows current state of user credits
SELECT 
  uc.subscription_tier,
  COUNT(uc.user_id) as user_count,
  SUM(uc.current_balance) as total_credits_available,
  ROUND(AVG(uc.current_balance), 1) as avg_credits_per_user,
  SUM(uc.consumed_this_month) as credits_consumed_this_month,
  SUM(uc.monthly_allowance) as total_monthly_allowance
FROM user_credits uc
GROUP BY uc.subscription_tier
ORDER BY 
  CASE uc.subscription_tier
    WHEN 'pro' THEN 1
    WHEN 'plus' THEN 2
    WHEN 'free' THEN 3
    ELSE 4
  END;

-- ============================================================================
-- Query 6: Top Users by Usage
-- Who's using the platform most
SELECT 
  et.user_id,
  up.display_name,
  up.email,
  uc.subscription_tier,
  COUNT(et.id) as total_generations,
  COUNT(et.id) FILTER (WHERE et.status = 'completed') as successful,
  COUNT(et.id) FILTER (WHERE et.status = 'failed') as failed,
  uc.current_balance as credits_remaining,
  COALESCE(SUM(ct.cost_usd) FILTER (WHERE et.status = 'completed'), 0) as cost_generated_usd
FROM enhancement_tasks et
LEFT JOIN users_profile up ON et.user_id = up.user_id
LEFT JOIN user_credits uc ON et.user_id = uc.user_id
LEFT JOIN credit_transactions ct ON ct.api_request_id = et.id::text AND ct.transaction_type = 'deduction'
WHERE et.created_at > NOW() - INTERVAL '30 days'
GROUP BY et.user_id, up.display_name, up.email, uc.subscription_tier, uc.current_balance
ORDER BY total_generations DESC
LIMIT 10;

-- ============================================================================
-- Query 7: Recent Failures (For Debugging)
-- Shows recent failed attempts with error messages
SELECT 
  et.id,
  et.user_id,
  up.display_name,
  et.provider,
  et.enhancement_type,
  ct_failed.error_message,
  et.created_at,
  CASE 
    WHEN ct_refund.transaction_type = 'refund' THEN '✅ Refunded'
    ELSE '❌ NOT Refunded'
  END as refund_status
FROM enhancement_tasks et
LEFT JOIN users_profile up ON et.user_id = up.user_id
LEFT JOIN credit_transactions ct_failed ON ct_failed.api_request_id = et.id::text AND ct_failed.transaction_type = 'deduction'
LEFT JOIN credit_transactions ct_refund ON ct_refund.api_request_id = et.id::text AND ct_refund.transaction_type = 'refund'
WHERE et.status = 'failed'
  AND et.created_at > NOW() - INTERVAL '7 days'
ORDER BY et.created_at DESC
LIMIT 20;

-- ============================================================================
-- Query 8: WaveSpeed Cost Analysis
-- Your actual costs from WaveSpeed by provider
SELECT 
  DATE_TRUNC('day', ct.created_at) as date,
  ct.provider,
  COUNT(*) as successful_calls,
  SUM(ct.cost_usd) as total_cost_usd,
  ROUND(AVG(ct.cost_usd), 4) as avg_cost_per_call,
  MIN(ct.cost_usd) as min_cost,
  MAX(ct.cost_usd) as max_cost
FROM credit_transactions ct
WHERE ct.transaction_type = 'deduction'
  AND ct.status = 'completed'
  AND ct.created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', ct.created_at), ct.provider
ORDER BY date DESC, provider;

-- ============================================================================
-- Query 9: Refund Analysis
-- Track how many refunds are being issued
SELECT 
  DATE(ct.created_at) as date,
  COUNT(*) as refunds_issued,
  SUM(ct.credits_used) as credits_refunded,
  ct.enhancement_type,
  COUNT(DISTINCT ct.user_id) as affected_users
FROM credit_transactions ct
WHERE ct.transaction_type = 'refund'
  AND ct.created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(ct.created_at), ct.enhancement_type
ORDER BY date DESC;

-- ============================================================================
-- Query 10: System Health Check
-- Quick overview of system status
SELECT 
  -- Overall stats
  (SELECT COUNT(*) FROM enhancement_tasks WHERE created_at > NOW() - INTERVAL '24 hours') as tasks_last_24h,
  (SELECT COUNT(*) FROM enhancement_tasks WHERE status = 'processing') as tasks_in_progress,
  (SELECT COUNT(*) FROM enhancement_tasks WHERE status = 'failed' AND created_at > NOW() - INTERVAL '24 hours') as failures_last_24h,
  
  -- User stats
  (SELECT COUNT(*) FROM user_credits WHERE current_balance > 0) as users_with_credits,
  (SELECT COUNT(DISTINCT user_id) FROM enhancement_tasks WHERE created_at > NOW() - INTERVAL '24 hours') as active_users_24h,
  
  -- Cost stats
  (SELECT COALESCE(SUM(cost_usd), 0) FROM credit_transactions WHERE transaction_type = 'deduction' AND created_at > NOW() - INTERVAL '24 hours') as cost_last_24h,
  
  -- Health indicators
  CASE 
    WHEN (SELECT COUNT(*) FROM enhancement_tasks WHERE status = 'failed' AND created_at > NOW() - INTERVAL '1 hour') > 5
    THEN '⚠️ High failure rate'
    WHEN (SELECT COUNT(*) FROM enhancement_tasks WHERE status = 'processing' AND created_at < NOW() - INTERVAL '10 minutes') > 0
    THEN '⚠️ Stuck tasks detected'
    ELSE '✅ Healthy'
  END as system_status;

-- ============================================================================
-- SUMMARY QUERIES FOR ADMIN DASHBOARD
-- ============================================================================

-- Single query for dashboard overview
SELECT 
  -- Today's stats
  COUNT(DISTINCT et.user_id) FILTER (WHERE et.created_at > NOW() - INTERVAL '24 hours') as active_users_today,
  COUNT(et.id) FILTER (WHERE et.created_at > NOW() - INTERVAL '24 hours') as generations_today,
  COALESCE(SUM(ct.cost_usd) FILTER (WHERE et.created_at > NOW() - INTERVAL '24 hours' AND et.status = 'completed'), 0) as cost_today_usd,
  
  -- This month's stats
  COUNT(et.id) FILTER (WHERE et.created_at > DATE_TRUNC('month', NOW())) as generations_this_month,
  COALESCE(SUM(ct.cost_usd) FILTER (WHERE et.created_at > DATE_TRUNC('month', NOW()) AND et.status = 'completed'), 0) as cost_this_month_usd,
  
  -- Success/failure rates
  ROUND(
    COUNT(et.id) FILTER (WHERE et.status = 'completed' AND et.created_at > NOW() - INTERVAL '7 days') * 100.0 / 
    NULLIF(COUNT(et.id) FILTER (WHERE et.created_at > NOW() - INTERVAL '7 days'), 0), 
    1
  ) as success_rate_7days_pct,
  
  -- Refund stats
  (SELECT COUNT(*) FROM credit_transactions WHERE transaction_type = 'refund' AND created_at > NOW() - INTERVAL '7 days') as refunds_last_7days,
  
  -- User credit stats
  (SELECT COUNT(*) FROM user_credits WHERE current_balance > 0) as users_with_credits,
  (SELECT SUM(current_balance) FROM user_credits) as total_credits_in_circulation,
  
  -- Provider breakdown (JSON)
  (
    SELECT jsonb_object_agg(provider, call_count)
    FROM (
      SELECT provider, COUNT(*) as call_count
      FROM enhancement_tasks
      WHERE created_at > NOW() - INTERVAL '30 days'
      GROUP BY provider
    ) provider_stats
  ) as provider_usage_json

FROM enhancement_tasks et
LEFT JOIN credit_transactions ct ON ct.api_request_id = et.id::text AND ct.transaction_type = 'deduction';

-- ============================================================================
-- NOTES:
-- ============================================================================
/*
These queries are designed for your pay-per-generation model:
- No credit_pools tracking
- Focus on actual usage and WaveSpeed costs
- Track success/failure rates
- Monitor refunds
- Analyze user patterns

Usage:
1. Query 1: Dashboard overview
2. Query 2-3: Detailed breakdowns
3. Query 4: Trends over time
4. Query 7: Debug failures
5. Query 10: Quick health check

For Admin Dashboard API:
- Use "SUMMARY QUERIES" section
- Returns everything in one query
- Fast and efficient
*/


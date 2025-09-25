-- OAuth Diagnostics - Run these queries to monitor OAuth health
-- Use these in your Supabase dashboard or pgAdmin

-- === QUICK HEALTH CHECK ===
-- Run this first to get an overview
SELECT 'OAuth System Health Check' as status;

-- Check recent OAuth activity (last 24 hours)
SELECT 
  'Recent Activity (24h)' as metric,
  COUNT(*) as count,
  event_type
FROM oauth_logs 
WHERE timestamp > NOW() - INTERVAL '24 hours'
GROUP BY event_type
ORDER BY count DESC;

-- === USER CREATION ISSUES ===
-- Check for users without profiles (potential OAuth failures)
SELECT 'Users without profiles' as issue;
SELECT 
  COUNT(*) as orphaned_users_count,
  array_agg(au.email) as sample_emails
FROM auth.users au 
LEFT JOIN users_profile up ON au.id = up.user_id
WHERE up.user_id IS NULL;

-- Show recent users and their profile status
SELECT 
  'Recent Users (Last 48h)' as section,
  au.email,
  au.created_at,
  au.raw_app_meta_data->>'provider' as provider,
  au.raw_user_meta_data->>'full_name' as full_name,
  CASE WHEN up.user_id IS NOT NULL THEN 'HAS_PROFILE' ELSE 'NO_PROFILE' END as profile_status
FROM auth.users au
LEFT JOIN users_profile up ON au.id = up.user_id
WHERE au.created_at > NOW() - INTERVAL '48 hours'
ORDER BY au.created_at DESC;

-- === ERROR ANALYSIS ===
-- Recent OAuth errors
SELECT 'Recent OAuth Errors' as section;
SELECT 
  timestamp,
  provider,
  step,
  error_message,
  error_code,
  ip_address
FROM oauth_logs 
WHERE event_type = 'oauth_error'
  AND timestamp > NOW() - INTERVAL '24 hours'
ORDER BY timestamp DESC
LIMIT 10;

-- Error frequency by type
SELECT 
  'Error Frequency Analysis' as section,
  error_code,
  step,
  COUNT(*) as error_count,
  MAX(timestamp) as last_occurrence
FROM oauth_logs
WHERE event_type = 'oauth_error'
  AND timestamp > NOW() - INTERVAL '7 days'
GROUP BY error_code, step
ORDER BY error_count DESC;

-- === OAUTH FLOW ANALYSIS ===
-- Success rate by provider
SELECT 
  'Success Rate Analysis' as section,
  provider,
  COUNT(*) FILTER (WHERE event_type = 'oauth_start') as attempts,
  COUNT(*) FILTER (WHERE event_type = 'oauth_success') as successes,
  COUNT(*) FILTER (WHERE event_type = 'oauth_error') as errors,
  CASE 
    WHEN COUNT(*) FILTER (WHERE event_type = 'oauth_start') > 0 
    THEN ROUND(
      COUNT(*) FILTER (WHERE event_type = 'oauth_success')::NUMERIC / 
      COUNT(*) FILTER (WHERE event_type = 'oauth_start')::NUMERIC * 100, 2
    )
    ELSE 0 
  END as success_rate_percent
FROM oauth_logs
WHERE timestamp > NOW() - INTERVAL '24 hours'
GROUP BY provider;

-- Average completion time
SELECT 
  'Performance Analysis' as section,
  provider,
  COUNT(*) as completed_flows,
  ROUND(AVG(duration_ms)::NUMERIC, 2) as avg_duration_ms,
  ROUND(AVG(duration_ms)::NUMERIC / 1000, 2) as avg_duration_seconds
FROM oauth_logs
WHERE duration_ms IS NOT NULL
  AND timestamp > NOW() - INTERVAL '24 hours'
GROUP BY provider;

-- === SYSTEM HEALTH ===
-- Check auth triggers are enabled
SELECT 'Auth Triggers Status' as section;
SELECT 
  t.tgname as trigger_name,
  CASE t.tgenabled 
    WHEN 'O' THEN 'DISABLED' 
    WHEN 'D' THEN 'DISABLED' 
    WHEN 'R' THEN 'ENABLED' 
    WHEN 'A' THEN 'ENABLED' 
    ELSE 'UNKNOWN' 
  END as status,
  c.relname as table_name
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'auth' 
  AND c.relname = 'users'
  AND t.tgname LIKE '%auth%';

-- Check RLS policies
SELECT 'RLS Status' as section;
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname IN ('auth', 'public')
  AND tablename IN ('users', 'users_profile', 'oauth_logs');

-- === RECENT FLOW STATES ===
-- Check auth.flow_state for stuck flows
SELECT 'Recent Flow States' as section;
SELECT 
  id,
  created_at,
  updated_at,
  auth_code_issued_at,
  EXTRACT(EPOCH FROM (NOW() - created_at)) as age_seconds
FROM auth.flow_state 
WHERE created_at > NOW() - INTERVAL '2 hours'
ORDER BY created_at DESC 
LIMIT 5;

-- === GOOGLE OAUTH SPECIFIC ===
-- Check Google OAuth configuration
SELECT 'Google OAuth Users' as section;
SELECT 
  COUNT(*) as total_google_users,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as google_users_24h,
  MAX(created_at) as last_google_signup
FROM auth.users 
WHERE raw_app_meta_data->>'provider' = 'google';

-- === SESSION ANALYSIS ===
-- Incomplete OAuth sessions (started but not completed)
SELECT 'Incomplete Sessions Analysis' as section;
SELECT 
  session_id,
  provider,
  MIN(timestamp) as started_at,
  MAX(timestamp) as last_activity,
  array_agg(DISTINCT event_type ORDER BY event_type) as events,
  CASE 
    WHEN 'oauth_success' = ANY(array_agg(event_type)) THEN 'COMPLETED'
    WHEN 'oauth_error' = ANY(array_agg(event_type)) THEN 'FAILED'
    ELSE 'INCOMPLETE'
  END as session_status
FROM oauth_logs
WHERE timestamp > NOW() - INTERVAL '2 hours'
  AND session_id IS NOT NULL
GROUP BY session_id, provider
HAVING NOT ('oauth_success' = ANY(array_agg(event_type)) OR 'oauth_error' = ANY(array_agg(event_type)))
ORDER BY started_at DESC;

-- === SUMMARY REPORT ===
SELECT '=== OAUTH SYSTEM SUMMARY ===' as report;

-- Overall system health
WITH health_check AS (
  SELECT 
    (SELECT COUNT(*) FROM auth.users) as total_users,
    (SELECT COUNT(*) FROM auth.users WHERE raw_app_meta_data->>'provider' = 'google') as google_users,
    (SELECT COUNT(*) FROM users_profile) as total_profiles,
    (SELECT COUNT(*) FROM auth.users au LEFT JOIN users_profile up ON au.id = up.user_id WHERE up.user_id IS NULL) as orphaned_users,
    (SELECT COUNT(*) FROM oauth_logs WHERE timestamp > NOW() - INTERVAL '1 hour') as recent_activity
)
SELECT 
  'SYSTEM STATUS' as metric,
  jsonb_build_object(
    'total_users', total_users,
    'google_users', google_users,
    'total_profiles', total_profiles,
    'orphaned_users', orphaned_users,
    'recent_oauth_activity', recent_activity,
    'profile_coverage_percent', 
      CASE WHEN total_users > 0 
        THEN ROUND((total_profiles::NUMERIC / total_users::NUMERIC) * 100, 2)
        ELSE 0 
      END
  ) as status_data
FROM health_check;

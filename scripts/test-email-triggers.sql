-- =====================================================
-- Email Triggers Test Script
-- Run this to verify all triggers are installed
-- =====================================================

\echo '🧪 Testing Email Triggers Setup...'
\echo ''

-- =====================================================
-- 1. CHECK CORE INFRASTRUCTURE
-- =====================================================

\echo '1️⃣  Checking core functions...'
SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ call_email_api function exists'
    ELSE '❌ call_email_api function MISSING'
  END as status
FROM information_schema.routines 
WHERE routine_name = 'call_email_api';

\echo ''

-- =====================================================
-- 2. CHECK EMAIL_LOGS TABLE
-- =====================================================

\echo '2️⃣  Checking email_logs table...'
SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ email_logs table exists'
    ELSE '❌ email_logs table MISSING'
  END as status
FROM information_schema.tables 
WHERE table_name = 'email_logs';

\echo ''

-- =====================================================
-- 3. CHECK TRIGGERS
-- =====================================================

\echo '3️⃣  Checking email triggers...'
SELECT 
  trigger_name,
  event_object_table as "table",
  action_timing || ' ' || event_manipulation as "when"
FROM information_schema.triggers 
WHERE trigger_name LIKE '%email%'
ORDER BY trigger_name;

\echo ''

-- =====================================================
-- 4. COUNT TRIGGERS
-- =====================================================

\echo '4️⃣  Total email triggers installed:'
SELECT COUNT(*) as total_triggers
FROM information_schema.triggers 
WHERE trigger_name LIKE '%email%';

\echo ''

-- =====================================================
-- 5. CHECK SCHEDULED FUNCTIONS
-- =====================================================

\echo '5️⃣  Checking scheduled email functions...'
SELECT 
  routine_name
FROM information_schema.routines 
WHERE routine_name IN (
  'send_shoot_reminders',
  'send_deadline_reminders',
  'send_profile_completion_reminders',
  'send_subscription_expiring_reminders',
  'send_gig_match_notifications',
  'send_weekly_digest',
  'send_unread_messages_digest',
  'send_marketplace_milestones'
)
ORDER BY routine_name;

\echo ''

-- =====================================================
-- 6. CHECK BASE URL CONFIGURATION
-- =====================================================

\echo '6️⃣  Checking base URL configuration...'
SELECT 
  COALESCE(
    current_setting('app.base_url', true),
    '❌ NOT SET - Run: ALTER DATABASE postgres SET app.base_url = ''http://localhost:3000'';'
  ) as base_url;

\echo ''

-- =====================================================
-- 7. TEST TRIGGER MANUALLY
-- =====================================================

\echo '7️⃣  Testing trigger manually (dry run)...'
\echo 'Simulating API call to /api/emails/test...'

-- This will log the attempt
SELECT call_email_api(
  '/api/emails/test',
  jsonb_build_object(
    'test', true,
    'message', 'Manual trigger test',
    'timestamp', NOW()
  )
);

\echo ''

-- =====================================================
-- 8. CHECK EMAIL LOGS
-- =====================================================

\echo '8️⃣  Recent email logs (last 5):'
SELECT 
  endpoint,
  payload->>'authUserId' as user_id,
  created_at,
  status
FROM email_logs
ORDER BY created_at DESC
LIMIT 5;

\echo ''

-- =====================================================
-- 9. SUMMARY
-- =====================================================

\echo '📊 SUMMARY:'
\echo ''

WITH trigger_count AS (
  SELECT COUNT(*) as total
  FROM information_schema.triggers 
  WHERE trigger_name LIKE '%email%'
),
function_count AS (
  SELECT COUNT(*) as total
  FROM information_schema.routines 
  WHERE routine_name IN (
    'call_email_api',
    'trigger_welcome_email',
    'trigger_gig_published_email',
    'trigger_new_application_email',
    'trigger_application_status_email',
    'trigger_application_withdrawn_email',
    'trigger_applications_closed_email',
    'trigger_gig_completed_email',
    'trigger_gig_cancelled_email',
    'trigger_subscription_change_email',
    'trigger_preset_sold_email',
    'trigger_message_received_email'
  )
)
SELECT 
  '✅ Triggers installed: ' || tc.total::text || '/30' as triggers,
  '✅ Functions installed: ' || fc.total::text || '/12+' as functions,
  '✅ Email logs entries: ' || (SELECT COUNT(*)::text FROM email_logs) as logs
FROM trigger_count tc, function_count fc;

\echo ''
\echo '✅ Setup check complete!'
\echo ''
\echo 'Next steps:'
\echo '1. Start your dev server: npm run dev'
\echo '2. Test signup: Create a new user account'
\echo '3. Check email_logs: SELECT * FROM email_logs ORDER BY created_at DESC;'
\echo '4. Check Plunk dashboard: https://app.useplunk.com'


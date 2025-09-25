-- Test the OAuth monitoring migration
-- Run this after applying the migration to verify it works

-- Test 1: Check if tables were created
SELECT 'Testing table creation...' as test;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('oauth_logs', 'oauth_health_check');

-- Test 2: Insert a test log entry
SELECT 'Testing oauth_logs insert...' as test;
INSERT INTO oauth_logs (
  event_type,
  provider,
  session_id,
  step,
  metadata
) VALUES (
  'oauth_start',
  'google',
  'test_migration_session',
  'migration_test',
  '{"test": true}'::jsonb
);

-- Test 3: Test the get_oauth_metrics function
SELECT 'Testing get_oauth_metrics function...' as test;
SELECT * FROM get_oauth_metrics(24);

-- Test 4: Test the get_recent_oauth_errors function
SELECT 'Testing get_recent_oauth_errors function...' as test;
-- First insert a test error
INSERT INTO oauth_logs (
  event_type,
  provider,
  session_id,
  step,
  error_message,
  error_code
) VALUES (
  'oauth_error',
  'google',
  'test_error_session',
  'migration_test',
  'Test error for migration verification',
  'TEST_ERROR'
);

-- Now test the function
SELECT * FROM get_recent_oauth_errors(5);

-- Test 5: Test the diagnose_oauth_system function
SELECT 'Testing diagnose_oauth_system function...' as test;
SELECT * FROM diagnose_oauth_system();

-- Clean up test data
DELETE FROM oauth_logs WHERE session_id IN ('test_migration_session', 'test_error_session');

SELECT '✅ All migration tests completed successfully!' as result;

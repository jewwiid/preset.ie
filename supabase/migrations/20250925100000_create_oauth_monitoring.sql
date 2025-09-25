-- Create OAuth monitoring tables and functions

-- Create oauth_logs table for detailed tracking
CREATE TABLE IF NOT EXISTS oauth_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL CHECK (event_type IN ('oauth_start', 'oauth_callback', 'oauth_success', 'oauth_error', 'profile_creation', 'profile_error')),
  user_id UUID REFERENCES auth.users(id),
  session_id TEXT,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'email')),
  step TEXT,
  error_message TEXT,
  error_code TEXT,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  duration_ms INTEGER,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  environment TEXT DEFAULT 'production'
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_oauth_logs_timestamp ON oauth_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_oauth_logs_event_type ON oauth_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_oauth_logs_user_id ON oauth_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_oauth_logs_session_id ON oauth_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_oauth_logs_provider ON oauth_logs(provider);

-- Create oauth_health_check table for system status
CREATE TABLE IF NOT EXISTS oauth_health_check (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  check_time TIMESTAMPTZ DEFAULT NOW(),
  provider TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('healthy', 'degraded', 'unhealthy')),
  response_time_ms INTEGER,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_oauth_health_check_time ON oauth_health_check(check_time DESC);
CREATE INDEX IF NOT EXISTS idx_oauth_health_check_provider ON oauth_health_check(provider);

-- Function to get OAuth metrics for a time period
CREATE OR REPLACE FUNCTION get_oauth_metrics(hours_back INTEGER DEFAULT 24)
RETURNS TABLE (
  total_attempts BIGINT,
  successful_attempts BIGINT,
  failed_attempts BIGINT,
  success_rate NUMERIC,
  avg_duration_ms NUMERIC,
  google_attempts BIGINT,
  email_attempts BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH time_window AS (
    SELECT NOW() - INTERVAL '1 hour' * hours_back AS start_time
  ),
  stats AS (
    SELECT 
      COUNT(*) FILTER (WHERE event_type = 'oauth_start') as total_attempts,
      COUNT(*) FILTER (WHERE event_type = 'oauth_success') as successful_attempts,
      COUNT(*) FILTER (WHERE event_type = 'oauth_error') as failed_attempts,
      AVG(duration_ms) FILTER (WHERE duration_ms IS NOT NULL) as avg_duration_ms,
      COUNT(*) FILTER (WHERE event_type = 'oauth_start' AND provider = 'google') as google_attempts,
      COUNT(*) FILTER (WHERE event_type = 'oauth_start' AND provider = 'email') as email_attempts
    FROM oauth_logs, time_window
    WHERE timestamp >= time_window.start_time
  )
  SELECT 
    s.total_attempts,
    s.successful_attempts,
    s.failed_attempts,
    CASE 
      WHEN s.total_attempts > 0 THEN (s.successful_attempts::NUMERIC / s.total_attempts::NUMERIC * 100)
      ELSE 0 
    END as success_rate,
    s.avg_duration_ms,
    s.google_attempts,
    s.email_attempts
  FROM stats s;
END;
$$ LANGUAGE plpgsql;

-- Function to get recent OAuth errors with details
CREATE OR REPLACE FUNCTION get_recent_oauth_errors(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  id UUID,
  logged_at TIMESTAMPTZ,
  provider TEXT,
  step TEXT,
  error_message TEXT,
  error_code TEXT,
  ip_address INET,
  user_id UUID,
  session_id TEXT,
  metadata JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ol.id,
    ol.timestamp,
    ol.provider,
    ol.step,
    ol.error_message,
    ol.error_code,
    ol.ip_address,
    ol.user_id,
    ol.session_id,
    ol.metadata
  FROM oauth_logs ol
  WHERE ol.event_type = 'oauth_error'
  ORDER BY ol.timestamp DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get user OAuth journey
CREATE OR REPLACE FUNCTION get_user_oauth_journey(target_user_id UUID)
RETURNS TABLE (
  id UUID,
  logged_at TIMESTAMPTZ,
  event_type TEXT,
  provider TEXT,
  step TEXT,
  error_message TEXT,
  duration_ms INTEGER,
  metadata JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ol.id,
    ol.timestamp,
    ol.event_type,
    ol.provider,
    ol.step,
    ol.error_message,
    ol.duration_ms,
    ol.metadata
  FROM oauth_logs ol
  WHERE ol.user_id = target_user_id
  ORDER BY ol.timestamp ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to diagnose OAuth system health
CREATE OR REPLACE FUNCTION diagnose_oauth_system()
RETURNS TABLE (
  component TEXT,
  status TEXT,
  details JSONB
) AS $$
BEGIN
  -- Check auth.users table
  RETURN QUERY
  SELECT 
    'auth_users' as component,
    'healthy' as status,
    jsonb_build_object(
      'total_users', (SELECT COUNT(*) FROM auth.users),
      'google_users', (SELECT COUNT(*) FROM auth.users WHERE raw_app_meta_data->>'provider' = 'google'),
      'recent_users_24h', (SELECT COUNT(*) FROM auth.users WHERE created_at > NOW() - INTERVAL '24 hours')
    ) as details;

  -- Check trigger status
  RETURN QUERY
  SELECT 
    'auth_triggers' as component,
    CASE 
      WHEN COUNT(*) > 0 THEN 'healthy'
      ELSE 'unhealthy'
    END as status,
    jsonb_build_object(
      'triggers_found', COUNT(*),
      'triggers', jsonb_agg(jsonb_build_object('name', tgname, 'enabled', tgenabled))
    ) as details
  FROM pg_trigger t
  JOIN pg_class c ON t.tgrelid = c.oid
  JOIN pg_namespace n ON c.relnamespace = n.oid
  WHERE n.nspname = 'auth' 
    AND c.relname = 'users'
    AND t.tgname LIKE '%auth_user%';

  -- Check users_profile table connectivity
  RETURN QUERY
  SELECT 
    'users_profile' as component,
    'healthy' as status,
    jsonb_build_object(
      'total_profiles', (SELECT COUNT(*) FROM users_profile),
      'orphaned_users', (
        SELECT COUNT(*) 
        FROM auth.users au 
        WHERE au.id NOT IN (SELECT user_id FROM users_profile WHERE user_id IS NOT NULL)
      ),
      'recent_profiles_24h', (SELECT COUNT(*) FROM users_profile WHERE created_at > NOW() - INTERVAL '24 hours')
    ) as details;

  -- Check recent OAuth activity
  RETURN QUERY
  SELECT 
    'oauth_activity' as component,
    CASE 
      WHEN (SELECT COUNT(*) FROM oauth_logs WHERE timestamp > NOW() - INTERVAL '1 hour') > 0 THEN 'active'
      WHEN (SELECT COUNT(*) FROM oauth_logs WHERE timestamp > NOW() - INTERVAL '24 hours') > 0 THEN 'quiet'
      ELSE 'silent'
    END as status,
    jsonb_build_object(
      'last_hour_events', (SELECT COUNT(*) FROM oauth_logs WHERE timestamp > NOW() - INTERVAL '1 hour'),
      'last_24h_events', (SELECT COUNT(*) FROM oauth_logs WHERE timestamp > NOW() - INTERVAL '24 hours'),
      'error_rate_24h', (
        CASE 
          WHEN (SELECT COUNT(*) FROM oauth_logs WHERE timestamp > NOW() - INTERVAL '24 hours' AND event_type = 'oauth_start') > 0
          THEN (
            SELECT COUNT(*) FROM oauth_logs 
            WHERE timestamp > NOW() - INTERVAL '24 hours' 
              AND event_type = 'oauth_error'
          )::NUMERIC / (
            SELECT COUNT(*) FROM oauth_logs 
            WHERE timestamp > NOW() - INTERVAL '24 hours' 
              AND event_type = 'oauth_start'
          )::NUMERIC * 100
          ELSE 0
        END
      )
    ) as details;
END;
$$ LANGUAGE plpgsql;

-- Create RLS policies for oauth_logs
ALTER TABLE oauth_logs ENABLE ROW LEVEL SECURITY;

-- Allow service role to read/write all logs
CREATE POLICY "Service role can manage oauth_logs" ON oauth_logs
  FOR ALL USING (auth.role() = 'service_role');

-- Allow authenticated users to read their own logs
CREATE POLICY "Users can read own oauth_logs" ON oauth_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Create RLS policies for oauth_health_check
ALTER TABLE oauth_health_check ENABLE ROW LEVEL SECURITY;

-- Allow service role to read/write all health checks
CREATE POLICY "Service role can manage oauth_health_check" ON oauth_health_check
  FOR ALL USING (auth.role() = 'service_role');

-- Allow authenticated users to read health status
CREATE POLICY "Users can read oauth_health_check" ON oauth_health_check
  FOR SELECT USING (auth.role() = 'authenticated');

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON oauth_logs TO authenticated;
GRANT SELECT ON oauth_health_check TO authenticated;
GRANT EXECUTE ON FUNCTION get_oauth_metrics(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_recent_oauth_errors(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_oauth_journey(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION diagnose_oauth_system() TO authenticated;

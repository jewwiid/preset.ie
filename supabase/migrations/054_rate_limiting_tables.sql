-- Rate Limiting Infrastructure
-- This migration creates comprehensive rate limiting tables and functions

-- Create rate limiting configuration table
CREATE TABLE rate_limits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resource_type VARCHAR(50) NOT NULL, -- 'messages', 'applications', 'gigs', 'reports'
    subscription_tier subscription_tier NOT NULL,
    time_window_minutes INTEGER NOT NULL, -- Time window in minutes
    max_actions INTEGER NOT NULL, -- Maximum actions allowed in window
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unique constraint for each resource-tier combination
    UNIQUE(resource_type, subscription_tier)
);

-- Insert default rate limits for messaging
INSERT INTO rate_limits (resource_type, subscription_tier, time_window_minutes, max_actions) VALUES
-- Messages per minute
('messages', 'FREE', 1, 10),
('messages', 'PLUS', 1, 25),
('messages', 'PRO', 1, 50),
-- Messages per hour (additional limit)
('messages_hourly', 'FREE', 60, 100),
('messages_hourly', 'PLUS', 60, 300),
('messages_hourly', 'PRO', 60, 1000),
-- Applications per day
('applications', 'FREE', 1440, 3),
('applications', 'PLUS', 1440, -1), -- -1 means unlimited
('applications', 'PRO', 1440, -1),
-- Gigs per month
('gigs', 'FREE', 43200, 2), -- 30 days * 24 hours * 60 minutes
('gigs', 'PLUS', 43200, -1),
('gigs', 'PRO', 43200, -1),
-- Reports per day
('reports', 'FREE', 1440, 5),
('reports', 'PLUS', 1440, 10),
('reports', 'PRO', 1440, 15);

-- Create rate limit tracking table
CREATE TABLE user_rate_limits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_profile_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
    resource_type VARCHAR(50) NOT NULL,
    action_count INTEGER NOT NULL DEFAULT 1,
    window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_action TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Index for efficient lookups
    CONSTRAINT unique_user_resource_window UNIQUE(user_profile_id, resource_type, window_start)
);

-- Indexes for performance
CREATE INDEX idx_user_rate_limits_user_resource ON user_rate_limits(user_profile_id, resource_type);
CREATE INDEX idx_user_rate_limits_window_start ON user_rate_limits(window_start);
CREATE INDEX idx_user_rate_limits_last_action ON user_rate_limits(last_action);
CREATE INDEX idx_rate_limits_resource_tier ON rate_limits(resource_type, subscription_tier);

-- Enable RLS
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_rate_limits ENABLE ROW LEVEL SECURITY;

-- RLS Policies for rate_limits (read-only for all authenticated users)
CREATE POLICY "Anyone can view rate limits" ON rate_limits
FOR SELECT TO authenticated USING (true);

-- RLS Policies for user_rate_limits (users can only see their own)
CREATE POLICY "Users can view their rate limit data" ON user_rate_limits
FOR SELECT USING (
    user_profile_id = (SELECT id FROM users_profile WHERE user_id = auth.uid())
);

CREATE POLICY "System can manage rate limit data" ON user_rate_limits
FOR ALL USING (true) WITH CHECK (true);

-- Enhanced rate limit check function with subscription awareness
CREATE OR REPLACE FUNCTION check_user_rate_limit(
    checking_user_profile_id UUID,
    resource VARCHAR(50),
    action_count INTEGER DEFAULT 1
)
RETURNS TABLE(
    allowed BOOLEAN,
    remaining INTEGER,
    reset_at TIMESTAMPTZ,
    current_tier subscription_tier
) AS $$
DECLARE
    user_tier subscription_tier;
    limit_config RECORD;
    current_window_start TIMESTAMPTZ;
    current_usage INTEGER := 0;
    remaining_count INTEGER;
BEGIN
    -- Get user's subscription tier
    SELECT subscription_tier INTO user_tier
    FROM users_profile
    WHERE id = checking_user_profile_id;
    
    -- Get rate limit configuration
    SELECT * INTO limit_config
    FROM rate_limits
    WHERE resource_type = resource 
    AND subscription_tier = user_tier;
    
    -- If no config found or unlimited (-1), allow
    IF limit_config IS NULL OR limit_config.max_actions = -1 THEN
        RETURN QUERY SELECT true, 999999, NOW() + INTERVAL '1 year', user_tier;
        RETURN;
    END IF;
    
    -- Calculate current time window start
    current_window_start := DATE_TRUNC('minute', NOW()) - 
                           ((EXTRACT(MINUTE FROM NOW())::INTEGER % limit_config.time_window_minutes) * INTERVAL '1 minute');
    
    -- Get current usage in this window
    SELECT COALESCE(SUM(action_count), 0) INTO current_usage
    FROM user_rate_limits
    WHERE user_profile_id = checking_user_profile_id
    AND resource_type = resource
    AND window_start >= current_window_start
    AND window_start < current_window_start + (limit_config.time_window_minutes * INTERVAL '1 minute');
    
    -- Calculate remaining actions
    remaining_count := limit_config.max_actions - current_usage - action_count;
    
    -- Return result
    RETURN QUERY SELECT 
        remaining_count >= 0,
        GREATEST(0, remaining_count + action_count),
        current_window_start + (limit_config.time_window_minutes * INTERVAL '1 minute'),
        user_tier;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record rate limit usage
CREATE OR REPLACE FUNCTION record_rate_limit_usage(
    using_user_profile_id UUID,
    resource VARCHAR(50),
    action_count INTEGER DEFAULT 1
)
RETURNS BOOLEAN AS $$
DECLARE
    user_tier subscription_tier;
    limit_config RECORD;
    current_window_start TIMESTAMPTZ;
    existing_record RECORD;
BEGIN
    -- Get user's subscription tier
    SELECT subscription_tier INTO user_tier
    FROM users_profile
    WHERE id = using_user_profile_id;
    
    -- Get rate limit configuration
    SELECT * INTO limit_config
    FROM rate_limits
    WHERE resource_type = resource 
    AND subscription_tier = user_tier;
    
    -- If no config or unlimited, don't track
    IF limit_config IS NULL OR limit_config.max_actions = -1 THEN
        RETURN true;
    END IF;
    
    -- Calculate current time window start
    current_window_start := DATE_TRUNC('minute', NOW()) - 
                           ((EXTRACT(MINUTE FROM NOW())::INTEGER % limit_config.time_window_minutes) * INTERVAL '1 minute');
    
    -- Try to find existing record for this window
    SELECT * INTO existing_record
    FROM user_rate_limits
    WHERE user_profile_id = using_user_profile_id
    AND resource_type = resource
    AND window_start = current_window_start;
    
    IF existing_record IS NOT NULL THEN
        -- Update existing record
        UPDATE user_rate_limits
        SET action_count = action_count + record_rate_limit_usage.action_count,
            last_action = NOW(),
            updated_at = NOW()
        WHERE id = existing_record.id;
    ELSE
        -- Create new record
        INSERT INTO user_rate_limits (
            user_profile_id,
            resource_type,
            action_count,
            window_start,
            last_action
        ) VALUES (
            using_user_profile_id,
            resource,
            action_count,
            current_window_start,
            NOW()
        );
    END IF;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's current rate limit status for all resources
CREATE OR REPLACE FUNCTION get_user_rate_limit_status(requesting_user_profile_id UUID)
RETURNS TABLE(
    resource_type VARCHAR(50),
    subscription_tier subscription_tier,
    max_actions INTEGER,
    time_window_minutes INTEGER,
    current_usage INTEGER,
    remaining INTEGER,
    reset_at TIMESTAMPTZ
) AS $$
DECLARE
    user_tier subscription_tier;
    limit_record RECORD;
    current_window_start TIMESTAMPTZ;
    usage_count INTEGER;
BEGIN
    -- Get user's subscription tier
    SELECT up.subscription_tier INTO user_tier
    FROM users_profile up
    WHERE up.id = requesting_user_profile_id;
    
    -- Loop through all rate limits for this user's tier
    FOR limit_record IN 
        SELECT * FROM rate_limits WHERE subscription_tier = user_tier
    LOOP
        -- Calculate current window start
        current_window_start := DATE_TRUNC('minute', NOW()) - 
                               ((EXTRACT(MINUTE FROM NOW())::INTEGER % limit_record.time_window_minutes) * INTERVAL '1 minute');
        
        -- Get current usage
        SELECT COALESCE(SUM(url.action_count), 0) INTO usage_count
        FROM user_rate_limits url
        WHERE url.user_profile_id = requesting_user_profile_id
        AND url.resource_type = limit_record.resource_type
        AND url.window_start >= current_window_start
        AND url.window_start < current_window_start + (limit_record.time_window_minutes * INTERVAL '1 minute');
        
        -- Return row
        RETURN QUERY SELECT 
            limit_record.resource_type,
            user_tier,
            limit_record.max_actions,
            limit_record.time_window_minutes,
            usage_count,
            CASE 
                WHEN limit_record.max_actions = -1 THEN 999999
                ELSE GREATEST(0, limit_record.max_actions - usage_count)
            END,
            current_window_start + (limit_record.time_window_minutes * INTERVAL '1 minute');
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old rate limit records
CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete records older than 7 days
    DELETE FROM user_rate_limits
    WHERE last_action < NOW() - INTERVAL '7 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the message validation function to use the new rate limiting
CREATE OR REPLACE FUNCTION validate_message_before_insert()
RETURNS TRIGGER AS $$
DECLARE
  user_profile_id UUID;
  sanitized_body TEXT;
  rate_check RECORD;
BEGIN
  -- Get the user's profile ID
  SELECT id INTO user_profile_id
  FROM users_profile
  WHERE user_id = auth.uid();
  
  -- Verify the user is sending as themselves
  IF NEW.from_user_id != user_profile_id THEN
    RAISE EXCEPTION 'Users can only send messages as themselves';
  END IF;
  
  -- Check if users can message each other (blocking check)
  IF NOT can_users_message(NEW.from_user_id, NEW.to_user_id) THEN
    -- Log the blocked message attempt
    PERFORM log_security_event(
      'blocked_message_attempt',
      auth.uid(),
      jsonb_build_object(
        'from_user_id', NEW.from_user_id,
        'to_user_id', NEW.to_user_id,
        'gig_id', NEW.gig_id
      )
    );
    RAISE EXCEPTION 'Cannot send message: user relationship blocked';
  END IF;
  
  -- Check rate limiting (both minute and hourly limits)
  SELECT * INTO rate_check FROM check_user_rate_limit(user_profile_id, 'messages', 1);
  IF NOT rate_check.allowed THEN
    PERFORM log_security_event(
      'rate_limit_exceeded',
      auth.uid(),
      jsonb_build_object(
        'resource_type', 'messages',
        'subscription_tier', rate_check.current_tier,
        'reset_at', rate_check.reset_at
      )
    );
    RAISE EXCEPTION 'Rate limit exceeded. You can send % more messages. Limit resets at %', 
      rate_check.remaining, rate_check.reset_at;
  END IF;
  
  -- Check hourly limit as well
  SELECT * INTO rate_check FROM check_user_rate_limit(user_profile_id, 'messages_hourly', 1);
  IF NOT rate_check.allowed THEN
    PERFORM log_security_event(
      'hourly_rate_limit_exceeded',
      auth.uid(),
      jsonb_build_object(
        'resource_type', 'messages_hourly',
        'subscription_tier', rate_check.current_tier,
        'reset_at', rate_check.reset_at
      )
    );
    RAISE EXCEPTION 'Hourly message limit exceeded. Limit resets at %', rate_check.reset_at;
  END IF;
  
  -- Sanitize message content
  sanitized_body := sanitize_message_content(NEW.body);
  
  -- Check if message is empty after sanitization
  IF length(trim(sanitized_body)) = 0 THEN
    RAISE EXCEPTION 'Message cannot be empty';
  END IF;
  
  -- Check for spam
  IF is_spam_message(sanitized_body) THEN
    -- Log spam attempt
    PERFORM log_security_event(
      'spam_message_blocked',
      auth.uid(),
      jsonb_build_object(
        'original_body', NEW.body,
        'sanitized_body', sanitized_body,
        'to_user_id', NEW.to_user_id
      )
    );
    RAISE EXCEPTION 'Message flagged as potential spam';
  END IF;
  
  -- Check message length
  IF length(sanitized_body) > 2000 THEN
    RAISE EXCEPTION 'Message cannot exceed 2000 characters';
  END IF;
  
  -- Update the message body with sanitized content
  NEW.body := sanitized_body;
  
  -- Set default status if not provided
  IF NEW.status IS NULL THEN
    NEW.status := 'sent';
  END IF;
  
  -- Set conversation_id if not provided
  IF NEW.conversation_id IS NULL THEN
    NEW.conversation_id := generate_conversation_id(NEW.gig_id, NEW.from_user_id, NEW.to_user_id);
  END IF;
  
  -- Record rate limit usage after all checks pass
  PERFORM record_rate_limit_usage(user_profile_id, 'messages', 1);
  PERFORM record_rate_limit_usage(user_profile_id, 'messages_hourly', 1);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for updating updated_at timestamp on rate_limits
CREATE TRIGGER update_rate_limits_updated_at_trigger
    BEFORE UPDATE ON rate_limits
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_user_rate_limits_updated_at_trigger
    BEFORE UPDATE ON user_rate_limits
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Add comments for documentation
COMMENT ON TABLE rate_limits IS 'Configuration table for rate limits per subscription tier and resource type';
COMMENT ON TABLE user_rate_limits IS 'Tracking table for user rate limit usage across time windows';
COMMENT ON FUNCTION check_user_rate_limit(UUID, VARCHAR, INTEGER) IS 'Check if user can perform action within rate limits';
COMMENT ON FUNCTION record_rate_limit_usage(UUID, VARCHAR, INTEGER) IS 'Record usage of rate-limited resource';
COMMENT ON FUNCTION get_user_rate_limit_status(UUID) IS 'Get current rate limit status for all resources for a user';
COMMENT ON FUNCTION cleanup_old_rate_limits() IS 'Cleanup old rate limit records (run via cron job)';
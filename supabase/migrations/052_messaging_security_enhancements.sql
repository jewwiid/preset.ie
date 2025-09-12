-- Messaging Security Enhancements
-- This migration strengthens Row Level Security and adds security infrastructure

-- Drop existing message policies to recreate them with enhanced security
DROP POLICY IF EXISTS "Users can view messages in their gigs" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;

-- Create enhanced RLS policies for messages
CREATE POLICY "Enhanced message viewing policy" ON messages
FOR SELECT USING (
  -- User can view messages where they are sender or recipient
  (from_user_id = (SELECT id FROM users_profile WHERE user_id = auth.uid()))
  OR 
  (to_user_id = (SELECT id FROM users_profile WHERE user_id = auth.uid()))
  -- AND conversation is not blocked (will be added after user_blocks table is created)
);

CREATE POLICY "Enhanced message sending policy" ON messages
FOR INSERT WITH CHECK (
  -- User can only send messages as themselves
  from_user_id = (SELECT id FROM users_profile WHERE user_id = auth.uid())
  -- Recipient must exist and not be blocking the sender (will be enhanced later)
  AND to_user_id IN (SELECT id FROM users_profile)
  -- User must have valid subscription for messaging
  AND EXISTS (
    SELECT 1 FROM users_profile 
    WHERE user_id = auth.uid() 
    AND subscription_tier IN ('FREE', 'PLUS', 'PRO')
  )
);

-- Enhanced message updating policy (for read receipts and status)
CREATE POLICY "Enhanced message update policy" ON messages
FOR UPDATE USING (
  -- Users can update messages they received (for read receipts)
  to_user_id = (SELECT id FROM users_profile WHERE user_id = auth.uid())
  -- Or messages they sent (for status updates)
  OR from_user_id = (SELECT id FROM users_profile WHERE user_id = auth.uid())
);

-- Create function to check if user is rate limited
CREATE OR REPLACE FUNCTION check_message_rate_limit(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  message_count INTEGER;
  time_window INTERVAL := '1 minute';
  max_messages INTEGER := 100; -- 100 messages per minute
BEGIN
  SELECT COUNT(*)
  INTO message_count
  FROM messages
  WHERE from_user_id = user_uuid
    AND created_at > NOW() - time_window;
  
  RETURN message_count < max_messages;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to sanitize message content
CREATE OR REPLACE FUNCTION sanitize_message_content(content TEXT)
RETURNS TEXT AS $$
DECLARE
  sanitized TEXT;
BEGIN
  -- Remove HTML tags
  sanitized := regexp_replace(content, '<[^>]*>', '', 'gi');
  
  -- Remove script tags and javascript
  sanitized := regexp_replace(sanitized, 'javascript:|data:|vbscript:', '', 'gi');
  
  -- Limit excessive whitespace
  sanitized := regexp_replace(sanitized, '\s+', ' ', 'g');
  
  -- Trim whitespace
  sanitized := trim(sanitized);
  
  RETURN sanitized;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create function to detect spam patterns
CREATE OR REPLACE FUNCTION is_spam_message(content TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check for excessive repetition (same character repeated 20+ times)
  IF content ~ '(.)\1{19,}' THEN
    RETURN TRUE;
  END IF;
  
  -- Check for excessive URLs
  IF (length(content) - length(replace(lower(content), 'http', ''))) / 4 > 3 THEN
    RETURN TRUE;
  END IF;
  
  -- Check for excessive caps (more than 70% uppercase)
  IF length(regexp_replace(content, '[^A-Z]', '', 'g'))::float / length(content) > 0.7 
     AND length(content) > 10 THEN
    RETURN TRUE;
  END IF;
  
  -- Check for excessive punctuation
  IF length(regexp_replace(content, '[^!?.]', '', 'g'))::float / length(content) > 0.3 
     AND length(content) > 10 THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create trigger to validate messages before insert
CREATE OR REPLACE FUNCTION validate_message_before_insert()
RETURNS TRIGGER AS $$
DECLARE
  user_profile_id UUID;
  sanitized_body TEXT;
BEGIN
  -- Get the user's profile ID
  SELECT id INTO user_profile_id
  FROM users_profile
  WHERE user_id = auth.uid();
  
  -- Verify the user is sending as themselves
  IF NEW.from_user_id != user_profile_id THEN
    RAISE EXCEPTION 'Users can only send messages as themselves';
  END IF;
  
  -- Check rate limiting
  IF NOT check_message_rate_limit(user_profile_id) THEN
    RAISE EXCEPTION 'Rate limit exceeded. Please wait before sending another message.';
  END IF;
  
  -- Sanitize message content
  sanitized_body := sanitize_message_content(NEW.body);
  
  -- Check if message is empty after sanitization
  IF length(trim(sanitized_body)) = 0 THEN
    RAISE EXCEPTION 'Message cannot be empty';
  END IF;
  
  -- Check for spam
  IF is_spam_message(sanitized_body) THEN
    RAISE EXCEPTION 'Message flagged as potential spam';
  END IF;
  
  -- Check message length (already handled by domain layer, but adding DB constraint)
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
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_validate_message ON messages;
CREATE TRIGGER trigger_validate_message
  BEFORE INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION validate_message_before_insert();

-- Create function to log security events
CREATE OR REPLACE FUNCTION log_security_event(
  event_type TEXT,
  user_id UUID,
  details JSONB DEFAULT '{}'::JSONB
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO system_logs (
    event_type,
    user_id,
    details,
    created_at
  ) VALUES (
    event_type,
    user_id,
    details,
    NOW()
  );
EXCEPTION
  WHEN OTHERS THEN
    -- Don't fail if logging fails
    NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create system logs table for security events
CREATE TABLE IF NOT EXISTS system_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type VARCHAR(100) NOT NULL,
  user_id UUID,
  details JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_logs_event_type ON system_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_system_logs_user_id ON system_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at);

-- Enable RLS on system_logs (admin only access)
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin only access to system logs" ON system_logs
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users_profile 
    WHERE user_id = auth.uid() 
    AND 'ADMIN' = ANY(role_flags)
  )
);

-- Create function to check conversation permissions
CREATE OR REPLACE FUNCTION can_access_conversation(
  conversation_uuid UUID,
  requesting_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  has_access BOOLEAN := FALSE;
BEGIN
  -- Check if user is participant in any message in this conversation
  SELECT EXISTS (
    SELECT 1 FROM messages
    WHERE conversation_id = conversation_uuid
    AND (from_user_id = requesting_user_id OR to_user_id = requesting_user_id)
  ) INTO has_access;
  
  RETURN has_access;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get conversation participants
CREATE OR REPLACE FUNCTION get_conversation_participants(conversation_uuid UUID)
RETURNS TABLE(user_id UUID, display_name VARCHAR(255), handle VARCHAR(50)) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT 
    up.user_id,
    up.display_name,
    up.handle
  FROM messages m
  JOIN users_profile up ON (up.id = m.from_user_id OR up.id = m.to_user_id)
  WHERE m.conversation_id = conversation_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add constraint to ensure message integrity
ALTER TABLE messages ADD CONSTRAINT check_message_participants 
CHECK (from_user_id != to_user_id);

-- Add constraint to ensure conversation_id is present for new messages
-- (We'll make this NOT NULL after migrating existing data)
-- ALTER TABLE messages ADD CONSTRAINT check_conversation_id_present 
-- CHECK (conversation_id IS NOT NULL);

-- Create index for security-related queries
CREATE INDEX IF NOT EXISTS idx_messages_security_lookup ON messages(from_user_id, to_user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_security ON messages(conversation_id, created_at) WHERE conversation_id IS NOT NULL;

-- Add comment explaining the security model
COMMENT ON TABLE messages IS 'Messages table with enhanced RLS policies. Users can only access messages they sent or received, with rate limiting and content validation.';
COMMENT ON FUNCTION check_message_rate_limit(UUID) IS 'Checks if user has exceeded the rate limit of 100 messages per minute';
COMMENT ON FUNCTION sanitize_message_content(TEXT) IS 'Sanitizes message content by removing HTML, scripts, and excessive whitespace';
COMMENT ON FUNCTION is_spam_message(TEXT) IS 'Detects potential spam based on repetition, URLs, caps, and punctuation patterns';
COMMENT ON FUNCTION validate_message_before_insert() IS 'Validates and sanitizes messages before insertion, enforcing security policies';
COMMENT ON TABLE system_logs IS 'Security event logging table with admin-only access';
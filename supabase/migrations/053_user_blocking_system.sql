-- User Blocking System
-- This migration creates the infrastructure for users to block other users

-- Create user blocks table
CREATE TABLE user_blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    blocker_user_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
    blocked_user_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
    reason VARCHAR(255), -- Optional reason for blocking
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure users can't block themselves
    CONSTRAINT check_no_self_block CHECK (blocker_user_id != blocked_user_id),
    
    -- Unique constraint to prevent duplicate blocks
    UNIQUE(blocker_user_id, blocked_user_id)
);

-- Create indexes for efficient blocking queries
CREATE INDEX idx_user_blocks_blocker ON user_blocks(blocker_user_id);
CREATE INDEX idx_user_blocks_blocked ON user_blocks(blocked_user_id);
CREATE INDEX idx_user_blocks_created_at ON user_blocks(created_at);

-- Enable Row Level Security
ALTER TABLE user_blocks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_blocks
CREATE POLICY "Users can view blocks they created" ON user_blocks
FOR SELECT USING (
    blocker_user_id = (SELECT id FROM users_profile WHERE user_id = auth.uid())
);

CREATE POLICY "Users can create blocks" ON user_blocks
FOR INSERT WITH CHECK (
    blocker_user_id = (SELECT id FROM users_profile WHERE user_id = auth.uid())
);

CREATE POLICY "Users can delete their blocks (unblock)" ON user_blocks
FOR DELETE USING (
    blocker_user_id = (SELECT id FROM users_profile WHERE user_id = auth.uid())
);

-- Create function to check if a user is blocked
CREATE OR REPLACE FUNCTION is_user_blocked(
    blocker_profile_id UUID,
    blocked_profile_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_blocks
        WHERE blocker_user_id = blocker_profile_id
        AND blocked_user_id = blocked_profile_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if users can message each other
CREATE OR REPLACE FUNCTION can_users_message(
    sender_profile_id UUID,
    recipient_profile_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if recipient has blocked sender
    IF is_user_blocked(recipient_profile_id, sender_profile_id) THEN
        RETURN FALSE;
    END IF;
    
    -- Check if sender has blocked recipient (they might want to unblock first)
    IF is_user_blocked(sender_profile_id, recipient_profile_id) THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get all blocked users for a user
CREATE OR REPLACE FUNCTION get_blocked_users(requesting_user_profile_id UUID)
RETURNS TABLE(
    block_id UUID,
    blocked_user_id UUID,
    blocked_display_name VARCHAR(255),
    blocked_handle VARCHAR(50),
    blocked_avatar_url TEXT,
    blocked_at TIMESTAMPTZ,
    block_reason VARCHAR(255)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ub.id,
        up.id,
        up.display_name,
        up.handle,
        up.avatar_url,
        ub.created_at,
        ub.reason
    FROM user_blocks ub
    JOIN users_profile up ON up.id = ub.blocked_user_id
    WHERE ub.blocker_user_id = requesting_user_profile_id
    ORDER BY ub.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get users who blocked a user (for debugging/admin)
CREATE OR REPLACE FUNCTION get_users_blocking_user(blocked_user_profile_id UUID)
RETURNS TABLE(
    block_id UUID,
    blocker_user_id UUID,
    blocker_display_name VARCHAR(255),
    blocker_handle VARCHAR(50),
    blocked_at TIMESTAMPTZ
) AS $$
BEGIN
    -- Only allow admins or the blocked user themselves to see this
    IF NOT (
        EXISTS (
            SELECT 1 FROM users_profile 
            WHERE user_id = auth.uid() 
            AND 'ADMIN' = ANY(role_flags)
        )
        OR
        blocked_user_profile_id = (SELECT id FROM users_profile WHERE user_id = auth.uid())
    ) THEN
        RAISE EXCEPTION 'Unauthorized access to blocking information';
    END IF;

    RETURN QUERY
    SELECT 
        ub.id,
        up.id,
        up.display_name,
        up.handle,
        ub.created_at
    FROM user_blocks ub
    JOIN users_profile up ON up.id = ub.blocker_user_id
    WHERE ub.blocked_user_id = blocked_user_profile_id
    ORDER BY ub.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the message validation function to check for blocks
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
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the message viewing policy to respect blocks
DROP POLICY IF EXISTS "Enhanced message viewing policy" ON messages;
CREATE POLICY "Enhanced message viewing policy with blocks" ON messages
FOR SELECT USING (
  -- User can view messages where they are sender or recipient
  (from_user_id = (SELECT id FROM users_profile WHERE user_id = auth.uid())
   OR to_user_id = (SELECT id FROM users_profile WHERE user_id = auth.uid()))
  -- AND neither party has blocked the other
  AND can_users_message(from_user_id, to_user_id)
);

-- Create function to block a user
CREATE OR REPLACE FUNCTION block_user(
  blocked_profile_id UUID,
  block_reason VARCHAR(255) DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  blocker_profile_id UUID;
  block_id UUID;
BEGIN
  -- Get the current user's profile ID
  SELECT id INTO blocker_profile_id
  FROM users_profile
  WHERE user_id = auth.uid();
  
  IF blocker_profile_id IS NULL THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;
  
  -- Prevent self-blocking
  IF blocker_profile_id = blocked_profile_id THEN
    RAISE EXCEPTION 'Cannot block yourself';
  END IF;
  
  -- Check if target user exists
  IF NOT EXISTS (SELECT 1 FROM users_profile WHERE id = blocked_profile_id) THEN
    RAISE EXCEPTION 'Target user not found';
  END IF;
  
  -- Insert the block (ON CONFLICT DO NOTHING handles duplicates)
  INSERT INTO user_blocks (blocker_user_id, blocked_user_id, reason)
  VALUES (blocker_profile_id, blocked_profile_id, block_reason)
  ON CONFLICT (blocker_user_id, blocked_user_id) DO NOTHING
  RETURNING id INTO block_id;
  
  -- If no ID returned, block already exists
  IF block_id IS NULL THEN
    SELECT id INTO block_id
    FROM user_blocks
    WHERE blocker_user_id = blocker_profile_id
    AND blocked_user_id = blocked_profile_id;
  END IF;
  
  -- Log the blocking event
  PERFORM log_security_event(
    'user_blocked',
    auth.uid(),
    jsonb_build_object(
      'blocked_user_id', blocked_profile_id,
      'reason', block_reason,
      'block_id', block_id
    )
  );
  
  RETURN block_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to unblock a user
CREATE OR REPLACE FUNCTION unblock_user(blocked_profile_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  blocker_profile_id UUID;
  deleted_count INTEGER;
BEGIN
  -- Get the current user's profile ID
  SELECT id INTO blocker_profile_id
  FROM users_profile
  WHERE user_id = auth.uid();
  
  IF blocker_profile_id IS NULL THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;
  
  -- Delete the block
  DELETE FROM user_blocks
  WHERE blocker_user_id = blocker_profile_id
  AND blocked_user_id = blocked_profile_id;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Log the unblocking event if a block was removed
  IF deleted_count > 0 THEN
    PERFORM log_security_event(
      'user_unblocked',
      auth.uid(),
      jsonb_build_object(
        'unblocked_user_id', blocked_profile_id
      )
    );
  END IF;
  
  RETURN deleted_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_blocks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_blocks_updated_at_trigger
    BEFORE UPDATE ON user_blocks
    FOR EACH ROW
    EXECUTE FUNCTION update_user_blocks_updated_at();

-- Add indexes for conversation-level blocking checks
CREATE INDEX IF NOT EXISTS idx_messages_blocking_check ON messages(from_user_id, to_user_id);

-- Update typing indicators to respect blocks
DROP POLICY IF EXISTS "Users can view typing indicators in their conversations" ON typing_indicators;
CREATE POLICY "Users can view typing indicators with block check" ON typing_indicators
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM messages m 
    WHERE m.conversation_id = typing_indicators.conversation_id 
    AND (
      m.from_user_id = (SELECT id FROM users_profile WHERE user_id = auth.uid())
      OR m.to_user_id = (SELECT id FROM users_profile WHERE user_id = auth.uid())
    )
    AND can_users_message(m.from_user_id, m.to_user_id)
  )
);

-- Add comments for documentation
COMMENT ON TABLE user_blocks IS 'User blocking system - stores which users have blocked other users';
COMMENT ON FUNCTION is_user_blocked(UUID, UUID) IS 'Check if one user has blocked another user';
COMMENT ON FUNCTION can_users_message(UUID, UUID) IS 'Check if two users can send messages to each other (not blocked)';
COMMENT ON FUNCTION block_user(UUID, VARCHAR) IS 'Block a user with optional reason';
COMMENT ON FUNCTION unblock_user(UUID) IS 'Unblock a previously blocked user';
COMMENT ON FUNCTION get_blocked_users(UUID) IS 'Get list of users blocked by the requesting user';
COMMENT ON FUNCTION get_users_blocking_user(UUID) IS 'Get list of users who blocked the specified user (admin/self only)';
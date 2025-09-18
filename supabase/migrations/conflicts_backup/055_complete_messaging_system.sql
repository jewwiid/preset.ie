-- ================================================================
-- COMPLETE MESSAGING SYSTEM MIGRATION
-- Consolidates all messaging functionality for Preset.ie
-- ================================================================
-- This migration creates the complete messaging system including:
-- 1. Real-time messaging enhancements
-- 2. User blocking system
-- 3. Rate limiting infrastructure
-- 4. Content moderation queue
-- 5. Message reporting system
-- 6. Performance indexes and optimizations
-- 7. Enhanced security policies
-- ================================================================

-- Ensure required extensions are available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =======================
-- ENUMS AND TYPES
-- =======================

-- Message status enum for delivery tracking
DO $$ BEGIN
    CREATE TYPE message_status AS ENUM ('sent', 'delivered', 'read');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Subscription tier enum already exists from migration 011
-- Values: 'FREE', 'PLUS', 'PRO' (uppercase)

-- Application status enum (if not exists from other migrations)
DO $$ BEGIN
    CREATE TYPE application_status AS ENUM ('pending', 'shortlisted', 'selected', 'declined', 'completed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =======================
-- CORE MESSAGING TABLES
-- =======================

-- Ensure messages table has all required columns
-- Add new columns to existing messages table if they don't exist
DO $$ 
BEGIN
    -- Add conversation_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'conversation_id') THEN
        ALTER TABLE messages ADD COLUMN conversation_id UUID;
    END IF;
    
    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'updated_at') THEN
        ALTER TABLE messages ADD COLUMN updated_at TIMESTAMPTZ;
    END IF;
    
    -- Add status column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'status') THEN
        ALTER TABLE messages ADD COLUMN status message_status DEFAULT 'sent';
    END IF;
END $$;

-- =======================
-- TYPING INDICATORS TABLE
-- =======================

CREATE TABLE IF NOT EXISTS typing_indicators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
    gig_id UUID NOT NULL REFERENCES gigs(id) ON DELETE CASCADE,
    is_typing BOOLEAN DEFAULT false,
    last_activity TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure only one typing indicator per user per conversation
    UNIQUE(conversation_id, user_id)
);

-- =======================
-- USER BLOCKING SYSTEM
-- =======================

CREATE TABLE IF NOT EXISTS user_blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    blocker_user_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
    blocked_user_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
    reason VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure unique blocking relationship
    UNIQUE(blocker_user_id, blocked_user_id),
    
    -- Prevent self-blocking
    CHECK (blocker_user_id != blocked_user_id)
);

-- =======================
-- RATE LIMITING SYSTEM
-- =======================

CREATE TABLE IF NOT EXISTS rate_limits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resource_type VARCHAR(50) NOT NULL, -- 'message_send', 'report_submit', etc.
    subscription_tier subscription_tier NOT NULL,
    time_window_minutes INTEGER NOT NULL,
    max_actions INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(resource_type, subscription_tier)
);

CREATE TABLE IF NOT EXISTS rate_limit_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
    resource_type VARCHAR(50) NOT NULL,
    time_window_start TIMESTAMPTZ NOT NULL,
    action_count INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, resource_type, time_window_start)
);

-- =======================
-- CONTENT MODERATION QUEUE
-- =======================

CREATE TABLE IF NOT EXISTS moderation_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID NOT NULL,
    content_type TEXT NOT NULL CHECK (content_type IN ('message', 'gig', 'showcase', 'profile', 'image')),
    content_text TEXT,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    flagged_reason TEXT[] DEFAULT ARRAY[]::TEXT[],
    severity_score INTEGER DEFAULT 0 CHECK (severity_score BETWEEN 0 AND 100),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected', 'escalated')),
    reviewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    auto_flagged_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    resolution_notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =======================
-- MESSAGING FUNCTIONS
-- =======================

-- Function to generate conversation_id based on gig_id and participants
CREATE OR REPLACE FUNCTION generate_conversation_id(gig_uuid UUID, user1_uuid UUID, user2_uuid UUID)
RETURNS UUID AS $$
BEGIN
  -- Create deterministic conversation ID based on gig and sorted participant UUIDs
  -- This ensures the same conversation ID regardless of message direction
  RETURN uuid_generate_v5(
    gig_uuid,
    CASE 
      WHEN user1_uuid < user2_uuid THEN user1_uuid::text || user2_uuid::text
      ELSE user2_uuid::text || user1_uuid::text
    END
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update existing messages to have conversation_id if null
UPDATE messages 
SET conversation_id = generate_conversation_id(gig_id, from_user_id, to_user_id)
WHERE conversation_id IS NULL;

-- Make conversation_id NOT NULL after populating it
ALTER TABLE messages ALTER COLUMN conversation_id SET NOT NULL;

-- Function to automatically update message status and timestamps
CREATE OR REPLACE FUNCTION update_message_status()
RETURNS TRIGGER AS $$
BEGIN
    -- If read_at is being set and status is not already 'read', update to 'read'
    IF NEW.read_at IS NOT NULL AND OLD.read_at IS NULL THEN
        NEW.status = 'read';
    END IF;
    
    -- Update updated_at timestamp
    NEW.updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to check if users can communicate (not blocked)
CREATE OR REPLACE FUNCTION can_users_communicate(user1_id UUID, user2_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if either user has blocked the other
    RETURN NOT EXISTS (
        SELECT 1 FROM user_blocks 
        WHERE (blocker_user_id = user1_id AND blocked_user_id = user2_id)
           OR (blocker_user_id = user2_id AND blocked_user_id = user1_id)
    );
END;
$$ LANGUAGE plpgsql;

-- Function to check and update rate limits
CREATE OR REPLACE FUNCTION check_rate_limit(
    p_user_id UUID,
    p_resource_type VARCHAR(50),
    p_subscription_tier subscription_tier
)
RETURNS BOOLEAN AS $$
DECLARE
    v_limit_config RECORD;
    v_window_start TIMESTAMPTZ;
    v_current_usage INTEGER;
BEGIN
    -- Get rate limit configuration for this resource and subscription tier
    SELECT time_window_minutes, max_actions 
    INTO v_limit_config
    FROM rate_limits
    WHERE resource_type = p_resource_type 
    AND subscription_tier = p_subscription_tier;
    
    -- If no limit configured, allow action
    IF v_limit_config IS NULL THEN
        RETURN TRUE;
    END IF;
    
    -- Calculate time window start
    v_window_start := date_trunc('minute', NOW()) - 
                     (EXTRACT(minute FROM NOW())::INTEGER % v_limit_config.time_window_minutes) * INTERVAL '1 minute';
    
    -- Get current usage in this time window
    SELECT COALESCE(action_count, 0)
    INTO v_current_usage
    FROM rate_limit_usage
    WHERE user_id = p_user_id
    AND resource_type = p_resource_type
    AND time_window_start = v_window_start;
    
    -- Check if under limit
    IF v_current_usage < v_limit_config.max_actions THEN
        -- Update usage count
        INSERT INTO rate_limit_usage (user_id, resource_type, time_window_start, action_count)
        VALUES (p_user_id, p_resource_type, v_window_start, 1)
        ON CONFLICT (user_id, resource_type, time_window_start)
        DO UPDATE SET action_count = rate_limit_usage.action_count + 1;
        
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Content moderation functions
CREATE OR REPLACE FUNCTION check_content_moderation(
    p_content_id UUID,
    p_content_type TEXT,
    p_content_text TEXT,
    p_user_id UUID
) RETURNS TABLE (
    should_flag BOOLEAN,
    flagged_reasons TEXT[],
    severity_score INTEGER
) AS $$
DECLARE
    v_reasons TEXT[] := ARRAY[]::TEXT[];
    v_score INTEGER := 0;
    v_should_flag BOOLEAN := FALSE;
    v_word TEXT;
    v_inappropriate_words TEXT[] := ARRAY[
        'fuck', 'shit', 'damn', 'bitch', 'asshole', 'bastard', 'crap',
        'nude', 'naked', 'sex', 'porn', 'xxx', 'nsfw', 'adult',
        'hate', 'nazi', 'racist', 'sexist', 'homophobic', 'transphobic',
        'buy now', 'click here', 'free money', 'get rich', 'promotion',
        'follow me', 'like for like', 'sub4sub', 'follow4follow',
        'illegal', 'drugs', 'violence', 'weapon', 'blood', 'gore'
    ];
    v_spam_patterns TEXT[] := ARRAY[
        'visit my profile', 'check out my', 'dm me', 'message me',
        'whatsapp', 'instagram', 'telegram', 'snapchat', 'onlyfans'
    ];
BEGIN
    -- Check for inappropriate words
    FOREACH v_word IN ARRAY v_inappropriate_words
    LOOP
        IF LOWER(p_content_text) ~ ('\\m' || v_word || '\\M') THEN
            v_reasons := array_append(v_reasons, 'inappropriate_language');
            v_score := v_score + 20;
            v_should_flag := TRUE;
            EXIT; -- Only add reason once
        END IF;
    END LOOP;
    
    -- Check for spam patterns
    FOREACH v_word IN ARRAY v_spam_patterns
    LOOP
        IF LOWER(p_content_text) ~ v_word THEN
            v_reasons := array_append(v_reasons, 'potential_spam');
            v_score := v_score + 15;
            v_should_flag := TRUE;
            EXIT;
        END IF;
    END LOOP;
    
    -- Check for excessive caps (>50% of text)
    IF LENGTH(p_content_text) > 10 AND 
       (LENGTH(REGEXP_REPLACE(p_content_text, '[^A-Z]', '', 'g'))::FLOAT / LENGTH(p_content_text)::FLOAT) > 0.5 THEN
        v_reasons := array_append(v_reasons, 'excessive_caps');
        v_score := v_score + 10;
        v_should_flag := TRUE;
    END IF;
    
    -- Check for repeated characters (more than 4 in a row)
    IF p_content_text ~ '(.)\1{4,}' THEN
        v_reasons := array_append(v_reasons, 'spam_pattern');
        v_score := v_score + 10;
        v_should_flag := TRUE;
    END IF;
    
    -- Check for URL patterns (basic detection)
    IF p_content_text ~ '(https?://|www\.|\.com|\.org|\.net)' THEN
        v_reasons := array_append(v_reasons, 'external_links');
        v_score := v_score + 25;
        v_should_flag := TRUE;
    END IF;
    
    -- Cap the severity score
    v_score := LEAST(v_score, 100);
    
    RETURN QUERY SELECT v_should_flag, v_reasons, v_score;
END;
$$ LANGUAGE plpgsql;

-- Function to queue content for moderation
CREATE OR REPLACE FUNCTION queue_for_moderation(
    p_content_id UUID,
    p_content_type TEXT,
    p_content_text TEXT,
    p_user_id UUID
) RETURNS UUID AS $$
DECLARE
    v_queue_id UUID;
    v_moderation_check RECORD;
BEGIN
    -- Check if content should be flagged
    SELECT * FROM check_content_moderation(p_content_id, p_content_type, p_content_text, p_user_id)
    INTO v_moderation_check;
    
    -- Only queue if flagged
    IF v_moderation_check.should_flag THEN
        INSERT INTO moderation_queue (
            content_id,
            content_type,
            content_text,
            user_id,
            flagged_reason,
            severity_score
        ) VALUES (
            p_content_id,
            p_content_type,
            p_content_text,
            p_user_id,
            v_moderation_check.flagged_reasons,
            v_moderation_check.severity_score
        ) RETURNING id INTO v_queue_id;
    END IF;
    
    RETURN v_queue_id;
END;
$$ LANGUAGE plpgsql;

-- Optimized conversation functions
CREATE OR REPLACE FUNCTION get_conversation_summary(
    p_gig_id UUID,
    p_user1_id UUID,
    p_user2_id UUID
)
RETURNS TABLE (
    total_messages BIGINT,
    last_message_at TIMESTAMPTZ,
    unread_count_user1 BIGINT,
    unread_count_user2 BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_messages,
        MAX(created_at) as last_message_at,
        COUNT(*) FILTER (WHERE to_user_id = p_user1_id AND read_at IS NULL) as unread_count_user1,
        COUNT(*) FILTER (WHERE to_user_id = p_user2_id AND read_at IS NULL) as unread_count_user2
    FROM messages
    WHERE gig_id = p_gig_id
    AND ((from_user_id = p_user1_id AND to_user_id = p_user2_id)
         OR (from_user_id = p_user2_id AND to_user_id = p_user1_id));
END;
$$ LANGUAGE plpgsql;

-- Function for efficient user conversation list
CREATE OR REPLACE FUNCTION get_user_conversations(
    p_user_id UUID,
    p_limit INT DEFAULT 20,
    p_offset INT DEFAULT 0
)
RETURNS TABLE (
    gig_id UUID,
    other_user_id UUID,
    last_message_id UUID,
    last_message_content TEXT,
    last_message_at TIMESTAMPTZ,
    unread_count BIGINT,
    other_user_blocked BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    WITH conversation_summary AS (
        SELECT 
            m.gig_id,
            CASE 
                WHEN m.from_user_id = p_user_id THEN m.to_user_id
                ELSE m.from_user_id
            END as other_user_id,
            m.id as message_id,
            m.body,
            m.created_at,
            ROW_NUMBER() OVER (
                PARTITION BY m.gig_id, 
                CASE 
                    WHEN m.from_user_id = p_user_id THEN m.to_user_id
                    ELSE m.from_user_id
                END
                ORDER BY m.created_at DESC
            ) as rn
        FROM messages m
        WHERE m.from_user_id = p_user_id OR m.to_user_id = p_user_id
    ),
    unread_counts AS (
        SELECT 
            gig_id,
            CASE 
                WHEN from_user_id = p_user_id THEN to_user_id
                ELSE from_user_id
            END as other_user_id,
            COUNT(*) as unread_count
        FROM messages
        WHERE to_user_id = p_user_id 
        AND read_at IS NULL
        GROUP BY gig_id, CASE WHEN from_user_id = p_user_id THEN to_user_id ELSE from_user_id END
    ),
    blocking_status AS (
        SELECT 
            blocked_user_id,
            TRUE as is_blocked
        FROM user_blocks
        WHERE blocker_user_id = p_user_id
    )
    SELECT 
        cs.gig_id,
        cs.other_user_id,
        cs.message_id as last_message_id,
        cs.body as last_message_content,
        cs.created_at as last_message_at,
        COALESCE(uc.unread_count, 0) as unread_count,
        COALESCE(bs.is_blocked, FALSE) as other_user_blocked
    FROM conversation_summary cs
    LEFT JOIN unread_counts uc ON cs.gig_id = uc.gig_id AND cs.other_user_id = uc.other_user_id
    LEFT JOIN blocking_status bs ON cs.other_user_id = bs.blocked_user_id
    WHERE cs.rn = 1
    ORDER BY cs.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Cleanup functions
CREATE OR REPLACE FUNCTION cleanup_old_typing_indicators()
RETURNS void AS $$
BEGIN
    DELETE FROM typing_indicators 
    WHERE last_activity < NOW() - INTERVAL '10 seconds';
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION cleanup_old_rate_limit_usage()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM rate_limit_usage 
    WHERE created_at < NOW() - INTERVAL '24 hours';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =======================
-- TRIGGERS
-- =======================

-- Message status update trigger
DROP TRIGGER IF EXISTS trigger_update_message_status ON messages;
CREATE TRIGGER trigger_update_message_status
    BEFORE UPDATE ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_message_status();

-- Auto-update timestamp triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for moderation_queue
DROP TRIGGER IF EXISTS moderation_queue_updated_at_trigger ON moderation_queue;
CREATE TRIGGER moderation_queue_updated_at_trigger
    BEFORE UPDATE ON moderation_queue
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =======================
-- INDEXES FOR PERFORMANCE
-- =======================
-- Note: CREATE INDEX CONCURRENTLY cannot run in a transaction
-- These indexes will be created normally (non-concurrently) for compatibility

-- Messages table indexes
CREATE INDEX IF NOT EXISTS idx_messages_gig_participants_created 
ON messages(gig_id, from_user_id, to_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_gig_participants_reverse_created 
ON messages(gig_id, to_user_id, from_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_recipient_unread 
ON messages(to_user_id, read_at, created_at DESC) WHERE read_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_messages_sender_created 
ON messages(from_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_gig_created 
ON messages(gig_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id 
ON messages(conversation_id);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_created_at 
ON messages(conversation_id, created_at);

CREATE INDEX IF NOT EXISTS idx_messages_status 
ON messages(status);

-- User blocks indexes
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocker_blocked 
ON user_blocks(blocker_user_id, blocked_user_id);

CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked_blocker 
ON user_blocks(blocked_user_id, blocker_user_id);

CREATE INDEX IF NOT EXISTS idx_user_blocks_blocker_created 
ON user_blocks(blocker_user_id, created_at DESC);

-- Typing indicators indexes
CREATE INDEX IF NOT EXISTS idx_typing_indicators_conversation 
ON typing_indicators(conversation_id);

CREATE INDEX IF NOT EXISTS idx_typing_indicators_activity 
ON typing_indicators(last_activity);

-- Rate limiting indexes
CREATE INDEX IF NOT EXISTS idx_rate_limit_usage_user_resource_window 
ON rate_limit_usage(user_id, resource_type, time_window_start DESC);

-- Note: Cleanup index with NOW() removed due to IMMUTABLE requirement
-- The cleanup function will use sequential scan for old records

-- Moderation queue indexes
CREATE INDEX IF NOT EXISTS idx_moderation_queue_priority_status 
ON moderation_queue(severity_score DESC, status, created_at DESC) 
WHERE status IN ('pending', 'reviewing');

CREATE INDEX IF NOT EXISTS idx_moderation_queue_user_created 
ON moderation_queue(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_moderation_queue_content 
ON moderation_queue(content_type, content_id) WHERE content_type = 'message';

-- Reports table indexes (for message reports)
CREATE INDEX IF NOT EXISTS idx_reports_message_content 
ON reports(reported_content_id, content_type) WHERE content_type = 'message';

CREATE INDEX IF NOT EXISTS idx_reports_message_reporter 
ON reports(reporter_user_id, reported_content_id, content_type) WHERE content_type = 'message';

CREATE INDEX IF NOT EXISTS idx_reports_message_priority_status 
ON reports(priority, status, created_at DESC) WHERE content_type = 'message';

-- =======================
-- ROW LEVEL SECURITY (RLS)
-- =======================

-- Enable RLS on all new tables
ALTER TABLE user_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limit_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_queue ENABLE ROW LEVEL SECURITY;

-- Clean up existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view blocks they created" ON user_blocks;
DROP POLICY IF EXISTS "Users can create blocks" ON user_blocks;
DROP POLICY IF EXISTS "Users can delete their own blocks" ON user_blocks;
DROP POLICY IF EXISTS "enhanced_messages_select" ON messages;
DROP POLICY IF EXISTS "enhanced_messages_insert" ON messages;
DROP POLICY IF EXISTS "enhanced_messages_update" ON messages;
DROP POLICY IF EXISTS "Users can view typing indicators in their conversations" ON typing_indicators;
DROP POLICY IF EXISTS "Users can manage their own typing indicators" ON typing_indicators;
DROP POLICY IF EXISTS "Users can view their own rate limit usage" ON rate_limit_usage;
DROP POLICY IF EXISTS "Admins can view all moderation items" ON moderation_queue;
DROP POLICY IF EXISTS "Admins can update moderation items" ON moderation_queue;
DROP POLICY IF EXISTS "System can insert moderation items" ON moderation_queue;

-- User blocks policies
CREATE POLICY "Users can view blocks they created" ON user_blocks
    FOR SELECT USING (blocker_user_id = (SELECT id FROM users_profile WHERE user_id = auth.uid()));

CREATE POLICY "Users can create blocks" ON user_blocks
    FOR INSERT WITH CHECK (blocker_user_id = (SELECT id FROM users_profile WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their own blocks" ON user_blocks
    FOR DELETE USING (blocker_user_id = (SELECT id FROM users_profile WHERE user_id = auth.uid()));

-- Enhanced messages policies (blocking integration)
DROP POLICY IF EXISTS "enhanced_messages_select" ON messages;
CREATE POLICY "enhanced_messages_select" ON messages
    FOR SELECT USING (
        -- User is participant in the conversation
        (from_user_id = (SELECT id FROM users_profile WHERE user_id = auth.uid()) OR 
         to_user_id = (SELECT id FROM users_profile WHERE user_id = auth.uid()))
        AND
        -- Neither user has blocked the other
        can_users_communicate(from_user_id, to_user_id)
    );

DROP POLICY IF EXISTS "enhanced_messages_insert" ON messages;
CREATE POLICY "enhanced_messages_insert" ON messages
    FOR INSERT WITH CHECK (
        -- User can only send messages as themselves
        from_user_id = (SELECT id FROM users_profile WHERE user_id = auth.uid())
        AND
        -- Users can communicate (not blocked)
        can_users_communicate(from_user_id, to_user_id)
        AND
        -- Must be part of gig (either owner or applicant)
        EXISTS (
            SELECT 1 FROM gigs g 
            WHERE g.id = gig_id 
            AND (g.owner_user_id = from_user_id OR g.owner_user_id = to_user_id)
        )
    );

DROP POLICY IF EXISTS "enhanced_messages_update" ON messages;
CREATE POLICY "enhanced_messages_update" ON messages
    FOR UPDATE USING (
        -- Only recipient can mark as read
        to_user_id = (SELECT id FROM users_profile WHERE user_id = auth.uid())
        AND
        -- Users can still communicate
        can_users_communicate(from_user_id, to_user_id)
    );

-- Typing indicators policies
CREATE POLICY "Users can view typing indicators in their conversations" ON typing_indicators
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM messages m 
            WHERE m.conversation_id = typing_indicators.conversation_id 
            AND (
                m.from_user_id = (SELECT id FROM users_profile WHERE user_id = auth.uid())
                OR m.to_user_id = (SELECT id FROM users_profile WHERE user_id = auth.uid())
            )
        )
    );

CREATE POLICY "Users can manage their own typing indicators" ON typing_indicators
    FOR ALL USING (
        user_id = (SELECT id FROM users_profile WHERE user_id = auth.uid())
    );

-- Rate limit usage policies
CREATE POLICY "Users can view their own rate limit usage" ON rate_limit_usage
    FOR SELECT USING (
        user_id = (SELECT id FROM users_profile WHERE user_id = auth.uid())
    );

-- Admin policies for moderation
CREATE POLICY "Admins can view all moderation items" ON moderation_queue
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users_profile 
            WHERE user_id = auth.uid()
            AND 'ADMIN' = ANY(role_flags)
        )
    );

CREATE POLICY "Admins can update moderation items" ON moderation_queue
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users_profile 
            WHERE user_id = auth.uid()
            AND 'ADMIN' = ANY(role_flags)
        )
    );

-- System can insert into moderation queue
CREATE POLICY "System can insert moderation items" ON moderation_queue
    FOR INSERT WITH CHECK (true);

-- =======================
-- DEFAULT RATE LIMITS
-- =======================

-- Insert default rate limits for different subscription tiers
INSERT INTO rate_limits (resource_type, subscription_tier, time_window_minutes, max_actions) VALUES
-- Message sending limits
('message_send', 'FREE', 5, 10),        -- 10 messages per 5 minutes for free users
('message_send', 'PLUS', 5, 30),        -- 30 messages per 5 minutes for plus users
('message_send', 'PRO', 5, 100),        -- 100 messages per 5 minutes for pro users

-- Report submission limits
('report_submit', 'FREE', 60, 5),       -- 5 reports per hour for free users
('report_submit', 'PLUS', 60, 10),      -- 10 reports per hour for plus users
('report_submit', 'PRO', 60, 20),       -- 20 reports per hour for pro users

-- User blocking limits
('user_block', 'FREE', 60, 5),          -- 5 blocks per hour for free users
('user_block', 'PLUS', 60, 10),         -- 10 blocks per hour for plus users
('user_block', 'PRO', 60, 20)           -- 20 blocks per hour for pro users

ON CONFLICT (resource_type, subscription_tier) DO NOTHING;

-- =======================
-- ADMIN DASHBOARD VIEWS
-- =======================

-- View for moderation dashboard
CREATE OR REPLACE VIEW admin_moderation_dashboard AS
SELECT 
    mq.*,
    up.display_name as user_name,
    up.handle as user_handle,
    reviewer.display_name as reviewer_name
FROM moderation_queue mq
LEFT JOIN users_profile up ON mq.user_id = up.user_id
LEFT JOIN users_profile reviewer ON mq.reviewer_id = reviewer.user_id
ORDER BY 
    CASE mq.status 
        WHEN 'pending' THEN 1
        WHEN 'reviewing' THEN 2
        WHEN 'escalated' THEN 3
        ELSE 4
    END,
    mq.severity_score DESC,
    mq.created_at DESC;

-- View for performance monitoring
CREATE OR REPLACE VIEW messaging_performance_stats AS
SELECT 
    schemaname,
    relname as tablename,
    indexrelname as indexname,
    idx_scan as num_scans,
    idx_tup_read as tup_read,
    idx_tup_fetch as tup_fetch
FROM pg_stat_user_indexes 
WHERE relname IN ('messages', 'user_blocks', 'reports', 'moderation_queue', 'rate_limit_usage', 'typing_indicators')
ORDER BY idx_scan DESC;

-- =======================
-- GRANTS AND PERMISSIONS
-- =======================

-- Grant permissions to authenticated users
GRANT SELECT, INSERT ON user_blocks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON typing_indicators TO authenticated;
GRANT SELECT ON rate_limit_usage TO authenticated;
GRANT SELECT ON moderation_queue TO authenticated;

-- Grant permissions to service role
GRANT ALL ON user_blocks TO service_role;
GRANT ALL ON typing_indicators TO service_role;
GRANT ALL ON rate_limit_usage TO service_role;
GRANT ALL ON moderation_queue TO service_role;
GRANT ALL ON rate_limits TO service_role;

-- Grant access to views
GRANT SELECT ON admin_moderation_dashboard TO authenticated;
GRANT SELECT ON messaging_performance_stats TO authenticated;

-- =======================
-- MANUAL SETUP INSTRUCTIONS
-- =======================

-- The following setup steps need to be done manually in Supabase Dashboard:
-- 1. Go to Database > Replication
-- 2. Enable replication for the following tables:
--    - messages
--    - typing_indicators
--    - user_blocks (optional, for real-time blocking updates)
--    - moderation_queue (for admin real-time updates)

-- Or via Supabase CLI:
/*
supabase sql -f - <<EOF
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE typing_indicators;
ALTER PUBLICATION supabase_realtime ADD TABLE user_blocks;
ALTER PUBLICATION supabase_realtime ADD TABLE moderation_queue;
EOF
*/

-- =======================
-- COMMENTS FOR DOCUMENTATION
-- =======================

COMMENT ON TABLE user_blocks IS 'User blocking system - prevents communication between blocked users';
COMMENT ON TABLE typing_indicators IS 'Real-time typing status for conversations';
COMMENT ON TABLE rate_limit_usage IS 'Tracks API usage per user per time window for rate limiting';
COMMENT ON TABLE moderation_queue IS 'Queue for content that needs manual moderation review';

COMMENT ON FUNCTION can_users_communicate(UUID, UUID) IS 'Checks if two users can communicate (not blocked)';
COMMENT ON FUNCTION check_rate_limit(UUID, VARCHAR, subscription_tier) IS 'Enforces rate limits based on subscription tier';
COMMENT ON FUNCTION get_user_conversations(UUID, INT, INT) IS 'Efficiently retrieves user conversation list with metadata';

-- =======================
-- SUCCESS MESSAGE
-- =======================

DO $$
BEGIN
    RAISE NOTICE '=================================================================';
    RAISE NOTICE 'MESSAGING SYSTEM SETUP COMPLETE!';
    RAISE NOTICE '=================================================================';
    RAISE NOTICE 'Created tables: user_blocks, typing_indicators, rate_limit_usage, moderation_queue';
    RAISE NOTICE 'Added columns: messages.conversation_id, messages.updated_at, messages.status';
    RAISE NOTICE 'Created indexes: 15+ performance optimization indexes';
    RAISE NOTICE 'Set up RLS policies: Enhanced security with blocking integration';
    RAISE NOTICE 'Added functions: Conversation helpers, rate limiting, moderation';
    RAISE NOTICE '';
    RAISE NOTICE 'MANUAL STEPS REQUIRED:';
    RAISE NOTICE '1. Enable real-time replication in Supabase Dashboard for:';
    RAISE NOTICE '   - messages, typing_indicators, user_blocks, moderation_queue';
    RAISE NOTICE '2. Test the messaging functionality';
    RAISE NOTICE '=================================================================';
END $$;
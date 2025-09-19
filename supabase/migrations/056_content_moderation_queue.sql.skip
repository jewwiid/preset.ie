-- Content Moderation Queue System
-- Handles automated flagging and manual review of messages

-- Create moderation_queue table for flagged content
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

-- Create indexes for efficient querying
CREATE INDEX idx_moderation_queue_status ON moderation_queue(status) WHERE status IN ('pending', 'reviewing');
CREATE INDEX idx_moderation_queue_severity ON moderation_queue(severity_score DESC, created_at DESC) WHERE status IN ('pending', 'reviewing');
CREATE INDEX idx_moderation_queue_user ON moderation_queue(user_id);
CREATE INDEX idx_moderation_queue_content ON moderation_queue(content_type, content_id);
CREATE INDEX idx_moderation_queue_created ON moderation_queue(created_at DESC);

-- Function to automatically flag content based on keywords
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

-- Function to add content to moderation queue
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

-- Function to resolve moderation queue item
CREATE OR REPLACE FUNCTION resolve_moderation_item(
    p_queue_id UUID,
    p_reviewer_id UUID,
    p_status TEXT,
    p_resolution_notes TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
    UPDATE moderation_queue
    SET status = p_status,
        reviewer_id = p_reviewer_id,
        reviewed_at = NOW(),
        resolution_notes = p_resolution_notes,
        updated_at = NOW()
    WHERE id = p_queue_id
    AND status IN ('pending', 'reviewing');
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to get user moderation stats
CREATE OR REPLACE FUNCTION get_user_moderation_stats(p_user_id UUID)
RETURNS TABLE (
    total_flagged INTEGER,
    flagged_last_30_days INTEGER,
    resolved_violations INTEGER,
    current_risk_score INTEGER
) AS $$
DECLARE
    v_total INTEGER;
    v_recent INTEGER;
    v_violations INTEGER;
    v_risk INTEGER;
BEGIN
    -- Total flagged content
    SELECT COUNT(*) INTO v_total
    FROM moderation_queue
    WHERE user_id = p_user_id;
    
    -- Recent flagged content (last 30 days)
    SELECT COUNT(*) INTO v_recent
    FROM moderation_queue
    WHERE user_id = p_user_id
    AND created_at > NOW() - INTERVAL '30 days';
    
    -- Resolved violations
    SELECT COUNT(*) INTO v_violations
    FROM moderation_queue
    WHERE user_id = p_user_id
    AND status = 'rejected';
    
    -- Calculate risk score (0-100)
    v_risk := LEAST(100, 
        (v_recent * 15) + 
        (v_total * 5) + 
        (v_violations * 25)
    );
    
    RETURN QUERY SELECT v_total, v_recent, v_violations, v_risk;
END;
$$ LANGUAGE plpgsql;

-- Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION update_moderation_queue_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER moderation_queue_updated_at_trigger
    BEFORE UPDATE ON moderation_queue
    FOR EACH ROW
    EXECUTE FUNCTION update_moderation_queue_updated_at();

-- RLS Policies
ALTER TABLE moderation_queue ENABLE ROW LEVEL SECURITY;

-- Admins can view all moderation queue items
CREATE POLICY admin_view_all_moderation ON moderation_queue
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users_profile 
            WHERE user_id = auth.uid()
            AND 'ADMIN' = ANY(role_flags)
        )
    );

-- Admins can update moderation queue items
CREATE POLICY admin_update_moderation ON moderation_queue
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users_profile 
            WHERE user_id = auth.uid()
            AND 'ADMIN' = ANY(role_flags)
        )
    );

-- System can insert into moderation queue
CREATE POLICY system_insert_moderation ON moderation_queue
    FOR INSERT
    WITH CHECK (true); -- Will be called by authenticated functions

-- Users can view their own moderation items (limited info)
CREATE POLICY user_view_own_moderation ON moderation_queue
    FOR SELECT
    USING (user_id = auth.uid());

-- Grant permissions
GRANT SELECT ON moderation_queue TO authenticated;
GRANT ALL ON moderation_queue TO service_role;

-- Create view for admin moderation dashboard
CREATE OR REPLACE VIEW admin_moderation_dashboard AS
SELECT 
    mq.*,
    up.display_name as user_name,
    up.handle as user_handle,
    reviewer.display_name as reviewer_name,
    get_user_moderation_stats(mq.user_id) as user_stats
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

-- Grant view access
GRANT SELECT ON admin_moderation_dashboard TO authenticated;
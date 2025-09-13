-- Create content_moderation_queue view/table if it doesn't exist
-- This ensures compatibility with the updated API endpoints

-- Create the content_moderation_queue table directly
-- This ensures compatibility with the API endpoints

CREATE TABLE IF NOT EXISTS content_moderation_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id UUID NOT NULL,
    content_type VARCHAR(50) NOT NULL,
    content_text TEXT,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    flagged_reason TEXT[] DEFAULT '{}',
    severity_score INTEGER DEFAULT 0 CHECK (severity_score >= 0 AND severity_score <= 100),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected', 'escalated')),
    resolved_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    admin_notes TEXT,
    metadata JSONB DEFAULT '{}',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on the table
ALTER TABLE content_moderation_queue ENABLE ROW LEVEL SECURITY;

-- Create policies for the table
CREATE POLICY "Admins can view all moderation queue items" ON content_moderation_queue
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users_profile 
            WHERE user_id = auth.uid() 
            AND 'ADMIN' = ANY(role_flags)
        )
    );

CREATE POLICY "Admins can update moderation queue items" ON content_moderation_queue
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users_profile 
            WHERE user_id = auth.uid() 
            AND 'ADMIN' = ANY(role_flags)
        )
    );

CREATE POLICY "System can insert moderation queue items" ON content_moderation_queue
    FOR INSERT WITH CHECK (true);

-- Grant permissions on the table
GRANT SELECT, INSERT, UPDATE ON content_moderation_queue TO authenticated;
GRANT ALL ON content_moderation_queue TO service_role;

-- Create helper functions for statistics
CREATE OR REPLACE FUNCTION get_average_severity()
RETURNS NUMERIC AS $$
BEGIN
    RETURN (
        SELECT COALESCE(AVG(severity_score), 0)
        FROM content_moderation_queue 
        WHERE severity_score IS NOT NULL
    );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_top_violation_flags()
RETURNS TABLE (flag TEXT, count BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        unnest(flagged_reason) as flag,
        COUNT(*)::BIGINT as count
    FROM content_moderation_queue 
    WHERE flagged_reason IS NOT NULL 
    GROUP BY unnest(flagged_reason)
    ORDER BY count DESC
    LIMIT 10;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_average_resolution_time()
RETURNS NUMERIC AS $$
BEGIN
    RETURN (
        SELECT COALESCE(
            AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600), 
            0
        )
        FROM content_moderation_queue 
        WHERE resolved_at IS NOT NULL 
        AND created_at IS NOT NULL
    );
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_average_severity() TO authenticated;
GRANT EXECUTE ON FUNCTION get_top_violation_flags() TO authenticated;  
GRANT EXECUTE ON FUNCTION get_average_resolution_time() TO authenticated;
-- Matchmaking Analytics Tables
-- Creates tables for tracking matchmaking performance and analytics

-- Matchmaking interactions tracking
CREATE TABLE IF NOT EXISTS matchmaking_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    interaction_type VARCHAR(50) NOT NULL CHECK (interaction_type IN (
        'view_recommendation', 'click_recommendation', 'apply_to_gig', 
        'view_profile', 'send_message', 'feedback_like', 'feedback_dislike'
    )),
    target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('gig', 'user')),
    target_id UUID NOT NULL,
    compatibility_score DECIMAL(5,2),
    match_factors JSONB,
    context_data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Compatibility score history for trend analysis
CREATE TABLE IF NOT EXISTS compatibility_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('gig', 'user')),
    target_id UUID NOT NULL,
    compatibility_score DECIMAL(5,2) NOT NULL,
    match_factors JSONB NOT NULL,
    calculated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Matchmaking performance metrics
CREATE TABLE IF NOT EXISTS matchmaking_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    metric_type VARCHAR(50) NOT NULL CHECK (metric_type IN (
        'avg_compatibility', 'total_matches_viewed', 'applications_sent',
        'successful_matches', 'response_rate', 'engagement_score'
    )),
    metric_value DECIMAL(10,4) NOT NULL,
    time_period VARCHAR(20) NOT NULL CHECK (time_period IN ('daily', 'weekly', 'monthly')),
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Saved search preferences
CREATE TABLE IF NOT EXISTS saved_search_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    search_type VARCHAR(20) NOT NULL CHECK (search_type IN ('gig', 'user')),
    filters JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Matchmaking feedback for algorithm improvement
CREATE TABLE IF NOT EXISTS matchmaking_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recommendation_id UUID NOT NULL,
    feedback_type VARCHAR(20) NOT NULL CHECK (feedback_type IN ('like', 'dislike', 'irrelevant', 'perfect')),
    reason TEXT,
    context_data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_matchmaking_interactions_user_id ON matchmaking_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_matchmaking_interactions_type ON matchmaking_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_matchmaking_interactions_created_at ON matchmaking_interactions(created_at);
CREATE INDEX IF NOT EXISTS idx_matchmaking_interactions_target ON matchmaking_interactions(target_type, target_id);

CREATE INDEX IF NOT EXISTS idx_compatibility_history_user_id ON compatibility_history(user_id);
CREATE INDEX IF NOT EXISTS idx_compatibility_history_target ON compatibility_history(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_compatibility_history_calculated_at ON compatibility_history(calculated_at);

CREATE INDEX IF NOT EXISTS idx_matchmaking_metrics_user_id ON matchmaking_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_matchmaking_metrics_type ON matchmaking_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_matchmaking_metrics_period ON matchmaking_metrics(time_period, period_start);

CREATE INDEX IF NOT EXISTS idx_saved_search_user_id ON saved_search_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_search_active ON saved_search_preferences(user_id, is_active);

CREATE INDEX IF NOT EXISTS idx_matchmaking_feedback_user_id ON matchmaking_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_matchmaking_feedback_type ON matchmaking_feedback(feedback_type);

-- Enable RLS
ALTER TABLE matchmaking_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE compatibility_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE matchmaking_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_search_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE matchmaking_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only see their own data
CREATE POLICY "Users can view own interactions" ON matchmaking_interactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own interactions" ON matchmaking_interactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own compatibility history" ON compatibility_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own compatibility history" ON compatibility_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own metrics" ON matchmaking_metrics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own metrics" ON matchmaking_metrics
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own search preferences" ON saved_search_preferences
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own feedback" ON matchmaking_feedback
    FOR ALL USING (auth.uid() = user_id);

-- Admin can see everything
CREATE POLICY "Admin can view all interactions" ON matchmaking_interactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users_profile 
            WHERE user_id = auth.uid() 
            AND 'ADMIN' = ANY(role_flags)
        )
    );

CREATE POLICY "Admin can view all compatibility history" ON compatibility_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users_profile 
            WHERE user_id = auth.uid() 
            AND 'ADMIN' = ANY(role_flags)
        )
    );

CREATE POLICY "Admin can view all metrics" ON matchmaking_metrics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users_profile 
            WHERE user_id = auth.uid() 
            AND 'ADMIN' = ANY(role_flags)
        )
    );

CREATE POLICY "Admin can view all search preferences" ON saved_search_preferences
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users_profile 
            WHERE user_id = auth.uid() 
            AND 'ADMIN' = ANY(role_flags)
        )
    );

CREATE POLICY "Admin can view all feedback" ON matchmaking_feedback
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users_profile 
            WHERE user_id = auth.uid() 
            AND 'ADMIN' = ANY(role_flags)
        )
    );

-- Functions for analytics
CREATE OR REPLACE FUNCTION calculate_user_matchmaking_metrics(p_user_id UUID, p_period VARCHAR(20))
RETURNS TABLE (
    avg_compatibility DECIMAL(5,2),
    total_interactions INTEGER,
    applications_sent INTEGER,
    successful_matches INTEGER,
    engagement_score DECIMAL(5,2)
) AS $$
DECLARE
    period_start TIMESTAMPTZ;
    period_end TIMESTAMPTZ := NOW();
BEGIN
    -- Calculate period boundaries
    CASE p_period
        WHEN 'daily' THEN period_start := NOW() - INTERVAL '1 day';
        WHEN 'weekly' THEN period_start := NOW() - INTERVAL '1 week';
        WHEN 'monthly' THEN period_start := NOW() - INTERVAL '1 month';
        ELSE period_start := NOW() - INTERVAL '1 week';
    END CASE;

    RETURN QUERY
    SELECT 
        COALESCE(AVG(compatibility_score), 0)::DECIMAL(5,2) as avg_compatibility,
        COUNT(*)::INTEGER as total_interactions,
        COUNT(*) FILTER (WHERE interaction_type = 'apply_to_gig')::INTEGER as applications_sent,
        COUNT(*) FILTER (WHERE interaction_type = 'apply_to_gig' AND context_data->>'success' = 'true')::INTEGER as successful_matches,
        (COUNT(*) FILTER (WHERE interaction_type IN ('click_recommendation', 'apply_to_gig', 'send_message')) * 100.0 / GREATEST(COUNT(*), 1))::DECIMAL(5,2) as engagement_score
    FROM matchmaking_interactions
    WHERE user_id = p_user_id
    AND created_at >= period_start
    AND created_at <= period_end;
END;
$$ LANGUAGE plpgsql;

-- Function to get compatibility trends
CREATE OR REPLACE FUNCTION get_compatibility_trends(p_user_id UUID, p_days INTEGER DEFAULT 30)
RETURNS TABLE (
    date DATE,
    avg_compatibility DECIMAL(5,2),
    total_calculations INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        calculated_at::DATE as date,
        AVG(compatibility_score)::DECIMAL(5,2) as avg_compatibility,
        COUNT(*)::INTEGER as total_calculations
    FROM compatibility_history
    WHERE user_id = p_user_id
    AND calculated_at >= NOW() - (p_days || ' days')::INTERVAL
    GROUP BY calculated_at::DATE
    ORDER BY date DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to log matchmaking interaction
CREATE OR REPLACE FUNCTION log_matchmaking_interaction(
    p_user_id UUID,
    p_interaction_type VARCHAR(50),
    p_target_type VARCHAR(20),
    p_target_id UUID,
    p_compatibility_score DECIMAL(5,2) DEFAULT NULL,
    p_match_factors JSONB DEFAULT NULL,
    p_context_data JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    interaction_id UUID;
BEGIN
    INSERT INTO matchmaking_interactions (
        user_id, interaction_type, target_type, target_id,
        compatibility_score, match_factors, context_data
    ) VALUES (
        p_user_id, p_interaction_type, p_target_type, p_target_id,
        p_compatibility_score, p_match_factors, p_context_data
    ) RETURNING id INTO interaction_id;
    
    RETURN interaction_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE matchmaking_interactions IS 'Tracks user interactions with matchmaking recommendations';
COMMENT ON TABLE compatibility_history IS 'Stores historical compatibility scores for trend analysis';
COMMENT ON TABLE matchmaking_metrics IS 'Aggregated matchmaking performance metrics';
COMMENT ON TABLE saved_search_preferences IS 'User saved search preferences for quick access';
COMMENT ON TABLE matchmaking_feedback IS 'User feedback on matchmaking recommendations for algorithm improvement';

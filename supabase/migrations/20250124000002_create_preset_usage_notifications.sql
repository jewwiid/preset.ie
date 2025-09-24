-- Create preset usage tracking and notification system
-- This allows preset creators to be notified when their presets are used

-- Create preset_usage table to track when presets are used
CREATE TABLE IF NOT EXISTS preset_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    preset_id UUID NOT NULL REFERENCES presets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    usage_type TEXT NOT NULL CHECK (usage_type IN ('playground_generation', 'showcase_creation', 'sample_verification')),
    usage_data JSONB, -- Store additional context like prompt, image URL, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create preset_notifications table for creator notifications
CREATE TABLE IF NOT EXISTS preset_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    preset_id UUID NOT NULL REFERENCES presets(id) ON DELETE CASCADE,
    creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL CHECK (notification_type IN ('preset_used', 'sample_created', 'verification_requested')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB, -- Store additional context
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_preset_usage_preset_id ON preset_usage(preset_id);
CREATE INDEX IF NOT EXISTS idx_preset_usage_user_id ON preset_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_preset_usage_created_at ON preset_usage(created_at);
CREATE INDEX IF NOT EXISTS idx_preset_notifications_creator_id ON preset_notifications(creator_id);
CREATE INDEX IF NOT EXISTS idx_preset_notifications_preset_id ON preset_notifications(preset_id);
CREATE INDEX IF NOT EXISTS idx_preset_notifications_is_read ON preset_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_preset_notifications_created_at ON preset_notifications(created_at);

-- Create unique index to prevent duplicate daily usage tracking
CREATE UNIQUE INDEX IF NOT EXISTS idx_preset_usage_daily_unique 
ON preset_usage(preset_id, user_id, usage_type, DATE(created_at));

-- Enable RLS
ALTER TABLE preset_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE preset_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for preset_usage
CREATE POLICY "Users can view their own usage" ON preset_usage
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Preset creators can view usage of their presets" ON preset_usage
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM presets 
            WHERE id = preset_id 
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Authenticated users can insert usage" ON preset_usage
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- RLS Policies for preset_notifications
CREATE POLICY "Users can view their own notifications" ON preset_notifications
    FOR SELECT USING (creator_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON preset_notifications
    FOR UPDATE USING (creator_id = auth.uid());

CREATE POLICY "System can insert notifications" ON preset_notifications
    FOR INSERT WITH CHECK (true); -- Allow system to create notifications

-- Function to track preset usage and create notifications
CREATE OR REPLACE FUNCTION track_preset_usage(
    preset_uuid UUID,
    usage_type_param TEXT,
    usage_data_param JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_usage_id UUID;
    preset_creator_id UUID;
    usage_count INTEGER;
    notification_title TEXT;
    notification_message TEXT;
BEGIN
    -- Get current user
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated';
    END IF;

    -- Get preset creator
    SELECT user_id INTO preset_creator_id FROM presets WHERE id = preset_uuid;
    
    -- Insert usage record (ignore if duplicate daily usage)
    INSERT INTO preset_usage (preset_id, user_id, usage_type, usage_data)
    VALUES (preset_uuid, auth.uid(), usage_type_param, usage_data_param)
    ON CONFLICT (preset_id, user_id, usage_type, DATE(created_at)) DO NOTHING
    RETURNING id INTO new_usage_id;

    -- Only create notification if preset has a creator (not system presets)
    IF preset_creator_id IS NOT NULL AND preset_creator_id != auth.uid() THEN
        -- Count total usage for this preset
        SELECT COUNT(*) INTO usage_count 
        FROM preset_usage 
        WHERE preset_id = preset_uuid 
        AND created_at >= NOW() - INTERVAL '24 hours';

        -- Create notification based on usage type
        CASE usage_type_param
            WHEN 'playground_generation' THEN
                notification_title := 'Your preset was used in playground';
                notification_message := 'Someone used your preset to generate an image. Click to view and verify if needed.';
            WHEN 'showcase_creation' THEN
                notification_title := 'Your preset was featured in a showcase';
                notification_message := 'Your preset was used to create a showcase. Check it out!';
            WHEN 'sample_verification' THEN
                notification_title := 'New sample created for your preset';
                notification_message := 'A new sample was created for your preset. Review and verify if needed.';
            ELSE
                notification_title := 'Your preset was used';
                notification_message := 'Someone used your preset. Check it out!';
        END CASE;

        -- Insert notification
        INSERT INTO preset_notifications (
            preset_id,
            creator_id,
            notification_type,
            title,
            message,
            data
        ) VALUES (
            preset_uuid,
            preset_creator_id,
            usage_type_param,
            notification_title,
            notification_message,
            jsonb_build_object(
                'usage_count_24h', usage_count,
                'usage_data', usage_data_param
            )
        );
    END IF;

    RETURN COALESCE(new_usage_id, gen_random_uuid());
END;
$$;

-- Function to get preset usage stats
CREATE OR REPLACE FUNCTION get_preset_usage_stats(preset_uuid UUID)
RETURNS TABLE (
    total_uses BIGINT,
    uses_24h BIGINT,
    uses_7d BIGINT,
    uses_30d BIGINT,
    unique_users BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_uses,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') as uses_24h,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as uses_7d,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as uses_30d,
        COUNT(DISTINCT user_id) as unique_users
    FROM preset_usage
    WHERE preset_id = preset_uuid;
END;
$$;

-- Function to get user notifications
CREATE OR REPLACE FUNCTION get_user_notifications(
    limit_count INTEGER DEFAULT 20,
    offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    preset_id UUID,
    preset_name TEXT,
    notification_type TEXT,
    title TEXT,
    message TEXT,
    data JSONB,
    is_read BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if user is authenticated
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated';
    END IF;

    RETURN QUERY
    SELECT 
        n.id,
        n.preset_id,
        p.name as preset_name,
        n.notification_type,
        n.title,
        n.message,
        n.data,
        n.is_read,
        n.created_at,
        n.read_at
    FROM preset_notifications n
    JOIN presets p ON p.id = n.preset_id
    WHERE n.creator_id = auth.uid()
    ORDER BY n.created_at DESC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$;

-- Add comments for documentation
COMMENT ON TABLE preset_usage IS 'Tracks when presets are used by users';
COMMENT ON TABLE preset_notifications IS 'Notifications for preset creators when their presets are used';
COMMENT ON FUNCTION track_preset_usage IS 'Tracks preset usage and creates notifications for creators';
COMMENT ON FUNCTION get_preset_usage_stats IS 'Returns usage statistics for a preset';
COMMENT ON FUNCTION get_user_notifications IS 'Returns notifications for the authenticated user';

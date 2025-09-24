-- Add unique view tracking for showcases
-- This migration adds the ability to track unique views per user per showcase

-- Create showcase_views table to track unique views
CREATE TABLE IF NOT EXISTS showcase_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    showcase_id UUID NOT NULL REFERENCES showcases(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    ip_address INET, -- Track IP for anonymous users
    user_agent TEXT, -- Track user agent for additional uniqueness
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_showcase_views_showcase_id ON showcase_views(showcase_id);
CREATE INDEX IF NOT EXISTS idx_showcase_views_user_id ON showcase_views(user_id);
CREATE INDEX IF NOT EXISTS idx_showcase_views_created_at ON showcase_views(created_at);

-- Create partial unique indexes to handle NULL values properly
-- Ensure a user can only view a showcase once (when user_id is not NULL)
CREATE UNIQUE INDEX IF NOT EXISTS unique_user_view 
ON showcase_views(showcase_id, user_id) 
WHERE user_id IS NOT NULL;

-- Ensure an IP can only view a showcase once (when ip_address is not NULL)
CREATE UNIQUE INDEX IF NOT EXISTS unique_ip_view 
ON showcase_views(showcase_id, ip_address) 
WHERE ip_address IS NOT NULL;

-- Enable RLS
ALTER TABLE showcase_views ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own view records
CREATE POLICY "Users can view their own view records" ON showcase_views
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own view records
CREATE POLICY "Users can insert their own view records" ON showcase_views
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Service role can do everything (for API operations)
CREATE POLICY "Service role can do everything" ON showcase_views
    FOR ALL USING (auth.role() = 'service_role');

-- Function to get unique view count for a showcase
CREATE OR REPLACE FUNCTION get_showcase_unique_views(showcase_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(DISTINCT COALESCE(user_id::text, ip_address::text))
        FROM showcase_views 
        WHERE showcase_id = showcase_uuid
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to track a unique view
CREATE OR REPLACE FUNCTION track_showcase_view(
    showcase_uuid UUID,
    viewer_user_id UUID DEFAULT NULL,
    viewer_ip INET DEFAULT NULL,
    viewer_user_agent TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    view_exists BOOLEAN := FALSE;
    inserted_count INTEGER := 0;
BEGIN
    -- Check if view already exists
    IF viewer_user_id IS NOT NULL THEN
        SELECT EXISTS(
            SELECT 1 FROM showcase_views 
            WHERE showcase_id = showcase_uuid AND user_id = viewer_user_id
        ) INTO view_exists;
    ELSIF viewer_ip IS NOT NULL THEN
        SELECT EXISTS(
            SELECT 1 FROM showcase_views 
            WHERE showcase_id = showcase_uuid AND ip_address = viewer_ip
        ) INTO view_exists;
    END IF;
    
    -- If view doesn't exist, try to insert it
    IF NOT view_exists THEN
        BEGIN
            INSERT INTO showcase_views (showcase_id, user_id, ip_address, user_agent)
            VALUES (showcase_uuid, viewer_user_id, viewer_ip, viewer_user_agent);
            
            GET DIAGNOSTICS inserted_count = ROW_COUNT;
            
            -- If insertion was successful, update the views_count
            IF inserted_count > 0 THEN
                UPDATE showcases 
                SET views_count = get_showcase_unique_views(showcase_uuid),
                    updated_at = NOW()
                WHERE id = showcase_uuid;
                
                RETURN TRUE;
            END IF;
            
        EXCEPTION WHEN unique_violation THEN
            -- Handle unique constraint violations gracefully
            RETURN FALSE;
        END;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_showcase_unique_views(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION track_showcase_view(UUID, UUID, INET, TEXT) TO authenticated, anon;

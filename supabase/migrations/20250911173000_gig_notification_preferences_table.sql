-- Create gig notification preferences table for personalized gig notifications
CREATE TABLE IF NOT EXISTS gig_notification_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Location preferences
    location_radius INTEGER NOT NULL DEFAULT 25 CHECK (location_radius >= 5 AND location_radius <= 100),
    
    -- Budget preferences
    min_budget INTEGER CHECK (min_budget >= 0),
    max_budget INTEGER CHECK (max_budget >= 0),
    
    -- Content preferences
    preferred_purposes TEXT[] DEFAULT '{}', -- Array of purpose types (PORTFOLIO, FASHION, etc.)
    preferred_vibes TEXT[] DEFAULT '{}',    -- Array of vibe names (ethereal, moody, etc.)
    preferred_styles TEXT[] DEFAULT '{}',   -- Array of style tags
    
    -- Notification control
    notify_on_match BOOLEAN NOT NULL DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(user_id),
    CONSTRAINT check_budget_range CHECK (
        (min_budget IS NULL OR max_budget IS NULL) OR 
        (min_budget <= max_budget)
    )
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_gig_notification_preferences_user_id ON gig_notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_gig_notification_preferences_notify_on_match ON gig_notification_preferences(notify_on_match) WHERE notify_on_match = true;

-- Enable Row Level Security
ALTER TABLE gig_notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only see their own notification preferences
CREATE POLICY "Users can view own gig notification preferences" 
ON gig_notification_preferences 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can create their own notification preferences
CREATE POLICY "Users can create own gig notification preferences" 
ON gig_notification_preferences 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can update their own notification preferences
CREATE POLICY "Users can update own gig notification preferences" 
ON gig_notification_preferences 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Users can delete their own notification preferences
CREATE POLICY "Users can delete own gig notification preferences" 
ON gig_notification_preferences 
FOR DELETE 
USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_gig_notification_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_gig_notification_preferences_updated_at
    BEFORE UPDATE ON gig_notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_gig_notification_preferences_updated_at();

-- Add helpful comments
COMMENT ON TABLE gig_notification_preferences IS 'User preferences for personalized gig notifications based on location, budget, purpose, and style preferences';
COMMENT ON COLUMN gig_notification_preferences.location_radius IS 'Radius in miles for location-based gig notifications (5-100)';
COMMENT ON COLUMN gig_notification_preferences.min_budget IS 'Minimum budget threshold for gig notifications (null = no minimum)';
COMMENT ON COLUMN gig_notification_preferences.max_budget IS 'Maximum budget threshold for gig notifications (null = no maximum)';
COMMENT ON COLUMN gig_notification_preferences.preferred_purposes IS 'Array of preferred gig purposes (PORTFOLIO, FASHION, etc.)';
COMMENT ON COLUMN gig_notification_preferences.preferred_vibes IS 'Array of preferred vibe names (ethereal, moody, etc.)';
COMMENT ON COLUMN gig_notification_preferences.preferred_styles IS 'Array of preferred style tags';
COMMENT ON COLUMN gig_notification_preferences.notify_on_match IS 'Whether to send notifications when gigs match preferences';
COMMENT ON COLUMN notification_preferences.notify_on_match IS 'Whether to send notifications when gigs match preferences';
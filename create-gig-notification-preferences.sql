-- Create gig_notification_preferences table
-- This creates the missing gig_notification_preferences table

CREATE TABLE IF NOT EXISTS gig_notification_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    location_radius INTEGER DEFAULT 25 CHECK (location_radius BETWEEN 5 AND 100),
    min_budget DECIMAL(10,2),
    max_budget DECIMAL(10,2),
    preferred_purposes TEXT[] DEFAULT '{}',
    preferred_vibes TEXT[] DEFAULT '{}',
    preferred_styles TEXT[] DEFAULT '{}',
    notify_on_match BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_gig_notification_preferences_user_id ON gig_notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_gig_notification_preferences_notify_on_match ON gig_notification_preferences(notify_on_match) WHERE notify_on_match = true;

-- Enable Row Level Security
ALTER TABLE gig_notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own gig notification preferences" 
ON gig_notification_preferences 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own gig notification preferences" 
ON gig_notification_preferences 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own gig notification preferences" 
ON gig_notification_preferences 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own gig notification preferences" 
ON gig_notification_preferences 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_gig_notification_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_gig_notification_preferences_updated_at
    BEFORE UPDATE ON gig_notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_gig_notification_preferences_updated_at();

-- Grant permissions
GRANT ALL ON gig_notification_preferences TO authenticated;

SELECT 'gig_notification_preferences table created successfully!' as status;

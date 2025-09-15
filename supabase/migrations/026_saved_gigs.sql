-- Create saved_gigs table for users to bookmark gigs
CREATE TABLE IF NOT EXISTS saved_gigs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gig_id UUID NOT NULL REFERENCES gigs(id) ON DELETE CASCADE,
  saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure a user can only save a gig once
  UNIQUE(user_id, gig_id)
);

-- Add indexes for performance
CREATE INDEX idx_saved_gigs_user_id ON saved_gigs(user_id);
CREATE INDEX idx_saved_gigs_gig_id ON saved_gigs(gig_id);
CREATE INDEX idx_saved_gigs_saved_at ON saved_gigs(saved_at DESC);

-- Enable RLS
ALTER TABLE saved_gigs ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view their own saved gigs
CREATE POLICY "Users can view own saved gigs"
  ON saved_gigs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can save gigs
CREATE POLICY "Users can save gigs"
  ON saved_gigs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can unsave their own saved gigs
CREATE POLICY "Users can delete own saved gigs"
  ON saved_gigs
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add a function to get saved gigs count for a gig
CREATE OR REPLACE FUNCTION get_saved_count(gig_id_param UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM saved_gigs
    WHERE gig_id = gig_id_param
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add a function to check if a user has saved a gig
CREATE OR REPLACE FUNCTION is_gig_saved_by_user(gig_id_param UUID, user_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM saved_gigs
    WHERE gig_id = gig_id_param
    AND user_id = user_id_param
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT ALL ON saved_gigs TO authenticated;
GRANT EXECUTE ON FUNCTION get_saved_count TO authenticated;
GRANT EXECUTE ON FUNCTION is_gig_saved_by_user TO authenticated;
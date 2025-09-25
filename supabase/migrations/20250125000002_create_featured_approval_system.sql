-- Create featured preset approval requests table
CREATE TABLE IF NOT EXISTS featured_preset_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  preset_id UUID NOT NULL REFERENCES presets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_featured_requests_preset_id ON featured_preset_requests(preset_id);
CREATE INDEX IF NOT EXISTS idx_featured_requests_user_id ON featured_preset_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_featured_requests_status ON featured_preset_requests(status);
CREATE INDEX IF NOT EXISTS idx_featured_requests_created_at ON featured_preset_requests(created_at DESC);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_featured_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER trigger_update_featured_requests_updated_at
  BEFORE UPDATE ON featured_preset_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_featured_requests_updated_at();

-- Create function to handle featured preset approval
CREATE OR REPLACE FUNCTION approve_featured_preset_request(
  request_id UUID,
  admin_user_id UUID,
  admin_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  preset_uuid UUID;
BEGIN
  -- Get the preset_id from the request
  SELECT preset_id INTO preset_uuid
  FROM featured_preset_requests
  WHERE id = request_id AND status = 'pending';
  
  IF preset_uuid IS NULL THEN
    RAISE EXCEPTION 'Featured preset request not found or already processed';
  END IF;
  
  -- Update the request status
  UPDATE featured_preset_requests
  SET 
    status = 'approved',
    reviewed_by = admin_user_id,
    reviewed_at = NOW(),
    admin_notes = COALESCE(admin_notes, 'Approved for featured status')
  WHERE id = request_id;
  
  -- Update the preset to be featured
  UPDATE presets
  SET is_featured = true
  WHERE id = preset_uuid;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to handle featured preset rejection
CREATE OR REPLACE FUNCTION reject_featured_preset_request(
  request_id UUID,
  admin_user_id UUID,
  admin_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  preset_uuid UUID;
BEGIN
  -- Get the preset_id from the request
  SELECT preset_id INTO preset_uuid
  FROM featured_preset_requests
  WHERE id = request_id AND status = 'pending';
  
  IF preset_uuid IS NULL THEN
    RAISE EXCEPTION 'Featured preset request not found or already processed';
  END IF;
  
  -- Update the request status
  UPDATE featured_preset_requests
  SET 
    status = 'rejected',
    reviewed_by = admin_user_id,
    reviewed_at = NOW(),
    admin_notes = COALESCE(admin_notes, 'Request rejected')
  WHERE id = request_id;
  
  -- Ensure the preset is not featured
  UPDATE presets
  SET is_featured = false
  WHERE id = preset_uuid;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get pending featured requests with preset details
CREATE OR REPLACE FUNCTION get_pending_featured_requests()
RETURNS TABLE (
  request_id UUID,
  preset_id UUID,
  preset_name VARCHAR,
  preset_description TEXT,
  preset_category VARCHAR,
  user_id UUID,
  user_display_name VARCHAR,
  user_handle VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE,
  preset_usage_count INTEGER,
  preset_likes_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    fpr.id as request_id,
    fpr.preset_id,
    p.name as preset_name,
    p.description as preset_description,
    p.category as preset_category,
    fpr.user_id,
    up.display_name as user_display_name,
    up.handle as user_handle,
    fpr.created_at,
    p.usage_count as preset_usage_count,
    p.likes_count as preset_likes_count
  FROM featured_preset_requests fpr
  JOIN presets p ON fpr.preset_id = p.id
  LEFT JOIN user_profiles up ON fpr.user_id = up.user_id
  WHERE fpr.status = 'pending'
  ORDER BY fpr.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS
ALTER TABLE featured_preset_requests ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can view their own requests
CREATE POLICY "Users can view their own featured requests" ON featured_preset_requests
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create requests for their own presets
CREATE POLICY "Users can create featured requests for their presets" ON featured_preset_requests
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM presets 
      WHERE id = preset_id AND user_id = auth.uid()
    )
  );

-- Admins can view all requests
CREATE POLICY "Admins can view all featured requests" ON featured_preset_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND 'ADMIN' = ANY(role_flags)
    )
  );

-- Admins can update request status
CREATE POLICY "Admins can update featured request status" ON featured_preset_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND 'ADMIN' = ANY(role_flags)
    )
  );

-- Insert some sample pending requests for testing (if any presets exist)
DO $$
DECLARE
  sample_preset_id UUID;
  sample_user_id UUID;
BEGIN
  -- Get a sample preset and user for testing
  SELECT id INTO sample_preset_id FROM presets WHERE is_featured = false LIMIT 1;
  SELECT user_id INTO sample_user_id FROM user_profiles LIMIT 1;
  
  -- Only insert if we have both a preset and user
  IF sample_preset_id IS NOT NULL AND sample_user_id IS NOT NULL THEN
    INSERT INTO featured_preset_requests (preset_id, user_id, status)
    VALUES (sample_preset_id, sample_user_id, 'pending')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Add comment explaining the system
COMMENT ON TABLE featured_preset_requests IS 'Tracks requests for presets to be featured, with admin approval workflow';
COMMENT ON FUNCTION approve_featured_preset_request IS 'Approves a featured preset request and marks the preset as featured';
COMMENT ON FUNCTION reject_featured_preset_request IS 'Rejects a featured preset request and ensures preset is not featured';
COMMENT ON FUNCTION get_pending_featured_requests IS 'Returns all pending featured preset requests with preset and user details';

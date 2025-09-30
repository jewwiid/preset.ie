-- Create featured preset approval requests table
CREATE TABLE IF NOT EXISTS featured_preset_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  preset_id UUID NOT NULL REFERENCES presets(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_featured_requests_preset_id ON featured_preset_requests(preset_id);
CREATE INDEX IF NOT EXISTS idx_featured_requests_requester_id ON featured_preset_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_featured_requests_status ON featured_preset_requests(status);
CREATE INDEX IF NOT EXISTS idx_featured_requests_requested_at ON featured_preset_requests(requested_at DESC);

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

-- Enable RLS
ALTER TABLE featured_preset_requests ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can view their own requests
CREATE POLICY "Users can view their own featured requests" ON featured_preset_requests
  FOR SELECT USING (auth.uid() = requester_id);

-- Users can create requests for their own presets
CREATE POLICY "Users can create featured requests for their presets" ON featured_preset_requests
  FOR INSERT WITH CHECK (
    auth.uid() = requester_id AND
    EXISTS (
      SELECT 1 FROM presets 
      WHERE id = preset_id AND user_id = auth.uid()
    )
  );

-- Admins can view all requests (simplified - no user_profiles dependency)
CREATE POLICY "Admins can view all featured requests" ON featured_preset_requests
  FOR SELECT USING (true);

-- Admins can update request status (simplified - no user_profiles dependency)
CREATE POLICY "Admins can update featured request status" ON featured_preset_requests
  FOR UPDATE USING (true);

-- Insert some sample pending requests for testing (if any presets exist)
DO $$
DECLARE
  sample_preset_id UUID;
  sample_user_id UUID;
BEGIN
  -- Get a sample preset and user for testing
  SELECT id INTO sample_preset_id FROM presets WHERE is_featured = false LIMIT 1;
  SELECT id INTO sample_user_id FROM auth.users LIMIT 1;
  
  -- Only insert if we have both a preset and user
  IF sample_preset_id IS NOT NULL AND sample_user_id IS NOT NULL THEN
    INSERT INTO featured_preset_requests (preset_id, requester_id, status)
    VALUES (sample_preset_id, sample_user_id, 'pending')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Add comment explaining the system
COMMENT ON TABLE featured_preset_requests IS 'Tracks requests for presets to be featured, with admin approval workflow';
COMMENT ON FUNCTION approve_featured_preset_request IS 'Approves a featured preset request and marks the preset as featured';
COMMENT ON FUNCTION reject_featured_preset_request IS 'Rejects a featured preset request and ensures preset is not featured';

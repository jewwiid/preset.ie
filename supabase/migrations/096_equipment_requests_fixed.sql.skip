-- Equipment Request System Migration (Fixed Version)
-- This adds a reverse marketplace where users can request equipment they need
-- Handles existing policies gracefully

-- ==============================================
-- EQUIPMENT REQUESTS TABLE
-- ==============================================

CREATE TABLE IF NOT EXISTS equipment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT, -- e.g., camera, lens, lighting, audio
  equipment_type TEXT, -- e.g., Canon 5D Mark IV, Sony A7III
  condition_preference TEXT CHECK (condition_preference IN ('any', 'new', 'like_new', 'used', 'fair')),
  request_type TEXT CHECK (request_type IN ('rent', 'buy', 'both')) NOT NULL DEFAULT 'rent',
  
  -- Rental specific fields
  rental_start_date DATE,
  rental_end_date DATE,
  max_daily_rate_cents INTEGER,
  max_total_cents INTEGER,
  
  -- Purchase specific fields
  max_purchase_price_cents INTEGER,
  
  -- Location and logistics
  location_city TEXT,
  location_country TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  pickup_preferred BOOLEAN DEFAULT TRUE,
  delivery_acceptable BOOLEAN DEFAULT FALSE,
  max_distance_km INTEGER DEFAULT 50,
  
  -- Request preferences
  verified_users_only BOOLEAN DEFAULT FALSE,
  min_rating DECIMAL(3,2) DEFAULT 0.0,
  urgent BOOLEAN DEFAULT FALSE,
  
  -- Status and metadata
  status TEXT CHECK (status IN ('active', 'fulfilled', 'expired', 'cancelled')) DEFAULT 'active',
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================
-- REQUEST RESPONSES TABLE
-- ==============================================

CREATE TABLE IF NOT EXISTS request_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES equipment_requests(id) ON DELETE CASCADE,
  responder_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES listings(id) ON DELETE SET NULL, -- Optional: link to existing listing
  
  -- Response details
  response_type TEXT CHECK (response_type IN ('offer', 'inquiry', 'available')) NOT NULL DEFAULT 'offer',
  message TEXT,
  
  -- Offer terms (if response_type = 'offer')
  offered_price_cents INTEGER,
  offered_daily_rate_cents INTEGER,
  offered_total_cents INTEGER,
  available_start_date DATE,
  available_end_date DATE,
  condition TEXT,
  
  -- Response status
  status TEXT CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'converted')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one response per user per request
  UNIQUE(request_id, responder_id)
);

-- ==============================================
-- REQUEST CONVERSATIONS TABLE
-- ==============================================

CREATE TABLE IF NOT EXISTS request_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES equipment_requests(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
  responder_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
  response_id UUID REFERENCES request_responses(id) ON DELETE CASCADE,
  
  -- Conversation metadata
  status TEXT CHECK (status IN ('active', 'closed', 'converted_to_order')) DEFAULT 'active',
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one conversation per request-response pair
  UNIQUE(request_id, responder_id)
);

-- ==============================================
-- INDEXES FOR PERFORMANCE
-- ==============================================

-- Equipment requests indexes
CREATE INDEX IF NOT EXISTS idx_equipment_requests_requester_id ON equipment_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_equipment_requests_status ON equipment_requests(status);
CREATE INDEX IF NOT EXISTS idx_equipment_requests_expires_at ON equipment_requests(expires_at);
CREATE INDEX IF NOT EXISTS idx_equipment_requests_category ON equipment_requests(category);
CREATE INDEX IF NOT EXISTS idx_equipment_requests_location ON equipment_requests(location_city, location_country);
CREATE INDEX IF NOT EXISTS idx_equipment_requests_rental_dates ON equipment_requests(rental_start_date, rental_end_date);
CREATE INDEX IF NOT EXISTS idx_equipment_requests_urgent ON equipment_requests(urgent) WHERE urgent = TRUE;

-- Request responses indexes
CREATE INDEX IF NOT EXISTS idx_request_responses_request_id ON request_responses(request_id);
CREATE INDEX IF NOT EXISTS idx_request_responses_responder_id ON request_responses(responder_id);
CREATE INDEX IF NOT EXISTS idx_request_responses_status ON request_responses(status);
CREATE INDEX IF NOT EXISTS idx_request_responses_listing_id ON request_responses(listing_id);

-- Request conversations indexes
CREATE INDEX IF NOT EXISTS idx_request_conversations_request_id ON request_conversations(request_id);
CREATE INDEX IF NOT EXISTS idx_request_conversations_requester_id ON request_conversations(requester_id);
CREATE INDEX IF NOT EXISTS idx_request_conversations_responder_id ON request_conversations(responder_id);
CREATE INDEX IF NOT EXISTS idx_request_conversations_status ON request_conversations(status);

-- ==============================================
-- ROW LEVEL SECURITY POLICIES
-- ==============================================

-- Enable RLS
ALTER TABLE equipment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_conversations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view active equipment requests" ON equipment_requests;
DROP POLICY IF EXISTS "Users can view their own equipment requests" ON equipment_requests;
DROP POLICY IF EXISTS "Users can create equipment requests" ON equipment_requests;
DROP POLICY IF EXISTS "Users can update their own equipment requests" ON equipment_requests;
DROP POLICY IF EXISTS "Users can delete their own equipment requests" ON equipment_requests;

DROP POLICY IF EXISTS "Users can view responses to their requests" ON request_responses;
DROP POLICY IF EXISTS "Users can view their own responses" ON request_responses;
DROP POLICY IF EXISTS "Users can create responses to requests" ON request_responses;
DROP POLICY IF EXISTS "Users can update their own responses" ON request_responses;
DROP POLICY IF EXISTS "Request owners can update responses to their requests" ON request_responses;

DROP POLICY IF EXISTS "Users can view conversations they're part of" ON request_conversations;
DROP POLICY IF EXISTS "Users can create conversations for their requests" ON request_conversations;
DROP POLICY IF EXISTS "Users can update conversations they're part of" ON request_conversations;

-- Equipment requests policies
CREATE POLICY "Users can view active equipment requests" ON equipment_requests
  FOR SELECT USING (status = 'active');

CREATE POLICY "Users can view their own equipment requests" ON equipment_requests
  FOR ALL USING (auth.uid()::text = requester_id::text);

CREATE POLICY "Users can create equipment requests" ON equipment_requests
  FOR INSERT WITH CHECK (auth.uid()::text = requester_id::text);

CREATE POLICY "Users can update their own equipment requests" ON equipment_requests
  FOR UPDATE USING (auth.uid()::text = requester_id::text);

CREATE POLICY "Users can delete their own equipment requests" ON equipment_requests
  FOR DELETE USING (auth.uid()::text = requester_id::text);

-- Request responses policies
CREATE POLICY "Users can view responses to their requests" ON request_responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM equipment_requests 
      WHERE id = request_id 
      AND requester_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Users can view their own responses" ON request_responses
  FOR SELECT USING (auth.uid()::text = responder_id::text);

CREATE POLICY "Users can create responses to requests" ON request_responses
  FOR INSERT WITH CHECK (auth.uid()::text = responder_id::text);

CREATE POLICY "Users can update their own responses" ON request_responses
  FOR UPDATE USING (auth.uid()::text = responder_id::text);

CREATE POLICY "Request owners can update responses to their requests" ON request_responses
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM equipment_requests 
      WHERE id = request_id 
      AND requester_id::text = auth.uid()::text
    )
  );

-- Request conversations policies
CREATE POLICY "Users can view conversations they're part of" ON request_conversations
  FOR SELECT USING (
    auth.uid()::text = requester_id::text OR 
    auth.uid()::text = responder_id::text
  );

CREATE POLICY "Users can create conversations for their requests" ON request_conversations
  FOR INSERT WITH CHECK (auth.uid()::text = requester_id::text);

CREATE POLICY "Users can update conversations they're part of" ON request_conversations
  FOR UPDATE USING (
    auth.uid()::text = requester_id::text OR 
    auth.uid()::text = responder_id::text
  );

-- ==============================================
-- HELPER FUNCTIONS
-- ==============================================

-- Function to automatically expire old requests
CREATE OR REPLACE FUNCTION expire_equipment_requests()
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  UPDATE equipment_requests 
  SET status = 'expired', updated_at = NOW()
  WHERE status = 'active' 
  AND expires_at < NOW();
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  
  -- Also expire related responses
  UPDATE request_responses 
  SET status = 'expired', updated_at = NOW()
  WHERE status = 'pending'
  AND request_id IN (
    SELECT id FROM equipment_requests WHERE status = 'expired'
  );
  
  RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get request statistics
CREATE OR REPLACE FUNCTION get_request_stats(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  stats JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_requests', COUNT(*),
    'active_requests', COUNT(*) FILTER (WHERE status = 'active'),
    'fulfilled_requests', COUNT(*) FILTER (WHERE status = 'fulfilled'),
    'total_responses', (
      SELECT COUNT(*) FROM request_responses 
      WHERE responder_id = p_user_id
    ),
    'accepted_responses', (
      SELECT COUNT(*) FROM request_responses 
      WHERE responder_id = p_user_id AND status = 'accepted'
    )
  ) INTO stats
  FROM equipment_requests
  WHERE requester_id = p_user_id;
  
  RETURN COALESCE(stats, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- TRIGGERS
-- ==============================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_equipment_requests_updated_at ON equipment_requests;
DROP TRIGGER IF EXISTS update_request_responses_updated_at ON request_responses;
DROP TRIGGER IF EXISTS update_request_conversations_updated_at ON request_conversations;

CREATE TRIGGER update_equipment_requests_updated_at
  BEFORE UPDATE ON equipment_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_request_responses_updated_at
  BEFORE UPDATE ON request_responses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_request_conversations_updated_at
  BEFORE UPDATE ON request_conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- PERMISSIONS
-- ==============================================

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON equipment_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON request_responses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON request_conversations TO authenticated;

-- ==============================================
-- COMMENTS
-- ==============================================

COMMENT ON TABLE equipment_requests IS 'Equipment requests posted by users looking for specific gear';
COMMENT ON TABLE request_responses IS 'Responses from equipment owners to requests';
COMMENT ON TABLE request_conversations IS 'Conversations between requesters and responders';

COMMENT ON COLUMN equipment_requests.condition_preference IS 'Preferred condition of equipment (any, new, like_new, used, fair)';
COMMENT ON COLUMN equipment_requests.request_type IS 'Type of request: rent, buy, or both';
COMMENT ON COLUMN equipment_requests.urgent IS 'Whether this is an urgent request that should be prioritized';
COMMENT ON COLUMN request_responses.response_type IS 'Type of response: offer, inquiry, or just availability notification';
COMMENT ON COLUMN request_responses.listing_id IS 'Optional link to existing listing if responder has one';

-- Create domain events table for event sourcing and audit trail
CREATE TABLE IF NOT EXISTS domain_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aggregate_id VARCHAR(255) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  metadata JSONB,
  occurred_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for querying
CREATE INDEX idx_domain_events_aggregate_id ON domain_events(aggregate_id);
CREATE INDEX idx_domain_events_event_type ON domain_events(event_type);
CREATE INDEX idx_domain_events_occurred_at ON domain_events(occurred_at);

-- Enable RLS
ALTER TABLE domain_events ENABLE ROW LEVEL SECURITY;

-- Policy: Service role can insert events (from backend)
CREATE POLICY "Service role can insert domain events" ON domain_events
  FOR INSERT
  TO service_role
  USING (true);

-- Policy: Service role can read all events
CREATE POLICY "Service role can read domain events" ON domain_events
  FOR SELECT
  TO service_role
  USING (true);

-- Policy: Authenticated users can read their own events
CREATE POLICY "Users can read their own domain events" ON domain_events
  FOR SELECT
  TO authenticated
  USING (
    metadata->>'userId' = auth.uid()::text
    OR
    aggregate_id IN (
      SELECT id::text FROM moodboards WHERE owner_user_id = auth.uid()
    )
  );

-- Create function to clean up old events (older than 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_domain_events()
RETURNS void AS $$
BEGIN
  DELETE FROM domain_events
  WHERE occurred_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Optional: Set up a cron job to run cleanup daily (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-domain-events', '0 2 * * *', 'SELECT cleanup_old_domain_events();');
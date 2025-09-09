-- Migration: Create domain_events table for event sourcing
-- Description: Stores all domain events for audit trail and event-driven architecture

-- Create domain_events table
CREATE TABLE IF NOT EXISTS domain_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aggregate_id VARCHAR(255) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  event_version INTEGER DEFAULT 1,
  payload JSONB NOT NULL,
  metadata JSONB,
  occurred_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX idx_domain_events_aggregate_id ON domain_events(aggregate_id);
CREATE INDEX idx_domain_events_event_type ON domain_events(event_type);
CREATE INDEX idx_domain_events_occurred_at ON domain_events(occurred_at DESC);
CREATE INDEX idx_domain_events_created_at ON domain_events(created_at DESC);

-- Add composite index for aggregate event history
CREATE INDEX idx_domain_events_aggregate_history 
  ON domain_events(aggregate_id, occurred_at DESC);

-- Enable Row Level Security
ALTER TABLE domain_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Only service role can insert events
CREATE POLICY "Service role can insert domain events"
  ON domain_events
  FOR INSERT
  TO service_role
  USING (true);

-- Authenticated users can read their own events
CREATE POLICY "Users can read their own domain events"
  ON domain_events
  FOR SELECT
  TO authenticated
  USING (
    -- User can see events related to their aggregates
    aggregate_id IN (
      SELECT id::text FROM users WHERE auth.uid() = id
      UNION
      SELECT id FROM gigs WHERE owner_id = auth.uid()::text
      UNION
      SELECT id FROM applications WHERE applicant_id = auth.uid()::text
      UNION
      SELECT g.id FROM applications a 
        JOIN gigs g ON a.gig_id = g.id 
        WHERE g.owner_id = auth.uid()::text
    )
  );

-- Service role can read all events
CREATE POLICY "Service role can read all domain events"
  ON domain_events
  FOR SELECT
  TO service_role
  USING (true);

-- Add comment
COMMENT ON TABLE domain_events IS 'Stores all domain events for event sourcing and audit trail';
COMMENT ON COLUMN domain_events.aggregate_id IS 'ID of the aggregate root that emitted this event';
COMMENT ON COLUMN domain_events.event_type IS 'Type of domain event (e.g., UserRegistered, GigCreated)';
COMMENT ON COLUMN domain_events.event_version IS 'Version of the event schema';
COMMENT ON COLUMN domain_events.payload IS 'Event-specific data';
COMMENT ON COLUMN domain_events.metadata IS 'Additional metadata (user agent, IP, etc.)';
COMMENT ON COLUMN domain_events.occurred_at IS 'When the event occurred in the domain';
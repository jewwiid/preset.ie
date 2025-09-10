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
CREATE INDEX IF NOT EXISTS idx_domain_events_aggregate_id ON domain_events(aggregate_id);
CREATE INDEX IF NOT EXISTS idx_domain_events_event_type ON domain_events(event_type);
CREATE INDEX IF NOT EXISTS idx_domain_events_occurred_at ON domain_events(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_domain_events_created_at ON domain_events(created_at DESC);

-- Add composite index for aggregate event history
CREATE INDEX IF NOT EXISTS idx_domain_events_aggregate_history 
  ON domain_events(aggregate_id, occurred_at DESC);

-- Enable Row Level Security
ALTER TABLE domain_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies (commented out as they may already exist)
-- These policies have been created in earlier migrations

-- Add comment
COMMENT ON TABLE domain_events IS 'Stores all domain events for event sourcing and audit trail';
-- Note: Some columns may not exist if table was already created
-- Commenting out column comments to avoid errors
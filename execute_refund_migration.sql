-- Credit Refund System Migration
-- Execute this in Supabase SQL Editor

-- Add refund tracking columns to enhancement_tasks
ALTER TABLE enhancement_tasks 
ADD COLUMN IF NOT EXISTS error_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS failed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS refunded BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS refund_processed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS moodboard_item_index INTEGER;

-- Create refund policies table
CREATE TABLE IF NOT EXISTS refund_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  error_type VARCHAR(50) UNIQUE NOT NULL,
  should_refund BOOLEAN NOT NULL DEFAULT true,
  refund_percentage DECIMAL(5, 2) DEFAULT 100.00,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create refund audit log
CREATE TABLE IF NOT EXISTS refund_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES enhancement_tasks(id),
  user_id UUID REFERENCES auth.users(id),
  credits_refunded INTEGER NOT NULL,
  refund_reason VARCHAR(100),
  error_message TEXT,
  previous_balance INTEGER,
  new_balance INTEGER,
  platform_loss INTEGER DEFAULT 0,
  processed_by VARCHAR(50) DEFAULT 'system',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default refund policies
INSERT INTO refund_policies (error_type, should_refund, refund_percentage, description) VALUES
  ('content_policy_violation', true, 100.00, 'Full refund for content policy violations'),
  ('internal_error', true, 100.00, 'Full refund for platform internal errors'),
  ('generation_failed', true, 100.00, 'Full refund for generation failures'),
  ('storage_error', true, 100.00, 'Full refund if we cannot save the result'),
  ('timeout', true, 100.00, 'Full refund for timeouts'),
  ('user_cancelled', false, 0.00, 'No refund for user cancellations'),
  ('invalid_input', false, 0.00, 'No refund for invalid user input')
ON CONFLICT (error_type) DO NOTHING;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_enhancement_tasks_status_refunded 
  ON enhancement_tasks(status, refunded) 
  WHERE status = 'failed';
CREATE INDEX IF NOT EXISTS idx_refund_audit_log_user 
  ON refund_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_refund_audit_log_task 
  ON refund_audit_log(task_id);
CREATE INDEX IF NOT EXISTS idx_refund_audit_log_created 
  ON refund_audit_log(created_at DESC);

-- RLS Policies
ALTER TABLE refund_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE refund_audit_log ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (safe to do)
DROP POLICY IF EXISTS refund_policies_admin_all ON refund_policies;
DROP POLICY IF EXISTS refund_audit_log_own_read ON refund_audit_log;
DROP POLICY IF EXISTS refund_audit_log_admin_all ON refund_audit_log;

-- Only admins can manage refund policies
CREATE POLICY refund_policies_admin_all ON refund_policies
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

-- Users can view their own refunds
CREATE POLICY refund_audit_log_own_read ON refund_audit_log
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Admins can view all refunds
CREATE POLICY refund_audit_log_admin_all ON refund_audit_log
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

-- Return success
SELECT 'Refund system tables created successfully!' as status;
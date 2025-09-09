-- Credit Refund System
-- Tracks refunds for failed enhancements and maintains audit trail

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

-- Function to process credit refund
CREATE OR REPLACE FUNCTION process_credit_refund(
  p_task_id UUID,
  p_user_id UUID,
  p_credits INTEGER DEFAULT 1,
  p_reason VARCHAR DEFAULT 'generation_failed'
) RETURNS BOOLEAN AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
  v_refund_policy RECORD;
  v_credits_to_refund INTEGER;
BEGIN
  -- Get refund policy
  SELECT * INTO v_refund_policy
  FROM refund_policies
  WHERE error_type = p_reason;
  
  -- Check if should refund
  IF NOT FOUND OR NOT v_refund_policy.should_refund THEN
    RETURN FALSE;
  END IF;
  
  -- Calculate refund amount
  v_credits_to_refund := ROUND(p_credits * v_refund_policy.refund_percentage / 100);
  
  IF v_credits_to_refund = 0 THEN
    RETURN FALSE;
  END IF;
  
  -- Get current balance
  SELECT current_balance INTO v_current_balance
  FROM user_credits
  WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  v_new_balance := v_current_balance + v_credits_to_refund;
  
  -- Update user balance
  UPDATE user_credits
  SET 
    current_balance = v_new_balance,
    consumed_this_month = GREATEST(0, consumed_this_month - v_credits_to_refund),
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Mark task as refunded
  UPDATE enhancement_tasks
  SET 
    refunded = true,
    refund_processed_at = NOW()
  WHERE id = p_task_id;
  
  -- Log refund
  INSERT INTO refund_audit_log (
    task_id,
    user_id,
    credits_refunded,
    refund_reason,
    previous_balance,
    new_balance,
    platform_loss
  ) VALUES (
    p_task_id,
    p_user_id,
    v_credits_to_refund,
    p_reason,
    v_current_balance,
    v_new_balance,
    4 -- Platform loses 4 NanoBanana credits
  );
  
  -- Create refund transaction
  INSERT INTO credit_transactions (
    user_id,
    transaction_type,
    credits_used,
    provider,
    api_request_id,
    status,
    metadata
  ) VALUES (
    p_user_id,
    'refund',
    -v_credits_to_refund,
    'nanobanana',
    p_task_id::VARCHAR,
    'completed',
    jsonb_build_object(
      'refund_reason', p_reason,
      'original_task_id', p_task_id,
      'refund_policy', v_refund_policy.error_type
    )
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to check if task needs refund
CREATE OR REPLACE FUNCTION check_refund_eligibility(
  p_task_id UUID
) RETURNS TABLE(
  eligible BOOLEAN,
  reason VARCHAR,
  credits_to_refund INTEGER
) AS $$
DECLARE
  v_task RECORD;
  v_policy RECORD;
BEGIN
  -- Get task details
  SELECT * INTO v_task
  FROM enhancement_tasks
  WHERE id = p_task_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'Task not found'::VARCHAR, 0;
    RETURN;
  END IF;
  
  -- Check if already refunded
  IF v_task.refunded THEN
    RETURN QUERY SELECT FALSE, 'Already refunded'::VARCHAR, 0;
    RETURN;
  END IF;
  
  -- Check if failed
  IF v_task.status != 'failed' THEN
    RETURN QUERY SELECT FALSE, 'Task not failed'::VARCHAR, 0;
    RETURN;
  END IF;
  
  -- Get refund policy
  SELECT * INTO v_policy
  FROM refund_policies
  WHERE error_type = v_task.error_type;
  
  IF NOT FOUND THEN
    -- Default to refund if no policy
    RETURN QUERY SELECT TRUE, v_task.error_type::VARCHAR, 1;
    RETURN;
  END IF;
  
  IF v_policy.should_refund THEN
    RETURN QUERY SELECT TRUE, v_task.error_type::VARCHAR, ROUND(1 * v_policy.refund_percentage / 100)::INTEGER;
  ELSE
    RETURN QUERY SELECT FALSE, 'No refund for ' || v_task.error_type::VARCHAR, 0;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-process refunds for failed tasks
CREATE OR REPLACE FUNCTION auto_refund_trigger() RETURNS TRIGGER AS $$
DECLARE
  v_should_refund BOOLEAN;
BEGIN
  -- Only process if status changed to 'failed'
  IF NEW.status = 'failed' AND OLD.status != 'failed' THEN
    -- Check if error type warrants refund
    SELECT should_refund INTO v_should_refund
    FROM refund_policies
    WHERE error_type = NEW.error_type;
    
    IF v_should_refund IS NULL OR v_should_refund = TRUE THEN
      -- Process refund asynchronously (would be handled by callback in practice)
      PERFORM process_credit_refund(NEW.id, NEW.user_id, 1, COALESCE(NEW.error_type, 'generation_failed'));
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto refunds
CREATE TRIGGER auto_refund_on_failure
  AFTER UPDATE ON enhancement_tasks
  FOR EACH ROW
  EXECUTE FUNCTION auto_refund_trigger();

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
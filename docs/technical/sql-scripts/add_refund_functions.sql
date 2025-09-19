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
    status
  ) VALUES (
    p_user_id,
    'refund',
    -v_credits_to_refund,
    'nanobanana',
    p_task_id::VARCHAR,
    'completed'
  );
  
  RETURN TRUE;
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
DROP TRIGGER IF EXISTS auto_refund_on_failure ON enhancement_tasks;
CREATE TRIGGER auto_refund_on_failure
  AFTER UPDATE ON enhancement_tasks
  FOR EACH ROW
  EXECUTE FUNCTION auto_refund_trigger();

-- Test the function exists
SELECT 'Refund functions created successfully!' as status;
-- Fix the refund function to remove metadata column reference
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
  
  -- Create refund transaction (without metadata column)
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

-- Test the function directly
SELECT process_credit_refund(
  '772ee103-943b-4210-86f0-d58ecd2b3203'::UUID,  -- Your test task ID
  '2fec88bc-7a12-4a9f-ab33-fcb393cb38cc'::UUID,  -- Your test user ID
  1,
  'internal_error'
) as refund_result;
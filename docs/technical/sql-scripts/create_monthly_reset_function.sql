-- Create monthly reset function for user credits
-- Run this in Supabase SQL Editor

-- Create or replace the monthly reset function
CREATE OR REPLACE FUNCTION reset_monthly_credits()
RETURNS TABLE(
  user_id UUID,
  subscription_tier TEXT,
  old_balance DECIMAL,
  new_balance DECIMAL,
  monthly_allowance INTEGER,
  reset_date TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  reset_date TIMESTAMPTZ := NOW();
  user_record RECORD;
  new_balance DECIMAL;
BEGIN
  -- Loop through all users who need a reset
  FOR user_record IN 
    SELECT 
      uc.user_id,
      uc.subscription_tier,
      uc.current_balance,
      uc.monthly_allowance,
      uc.consumed_this_month,
      uc.last_reset_at
    FROM user_credits uc
    WHERE 
      -- Reset if last_reset_at is null (new users)
      uc.last_reset_at IS NULL
      OR 
      -- Reset if it's been more than 30 days since last reset
      uc.last_reset_at < (NOW() - INTERVAL '30 days')
      OR
      -- Reset if it's a new month (different month/year)
      DATE_TRUNC('month', uc.last_reset_at) < DATE_TRUNC('month', NOW())
  LOOP
    -- Calculate new balance (current + monthly allowance)
    new_balance := user_record.current_balance + user_record.monthly_allowance;
    
    -- Update user credits
    UPDATE user_credits 
    SET 
      current_balance = new_balance,
      consumed_this_month = 0,
      last_reset_at = reset_date,
      updated_at = NOW()
    WHERE user_id = user_record.user_id;
    
    -- Log the transaction
    INSERT INTO credit_transactions (
      user_id,
      transaction_type,
      credits_used,
      balance_before,
      balance_after,
      description,
      reference_id,
      status
    ) VALUES (
      user_record.user_id,
      'monthly_reset',
      user_record.monthly_allowance,
      user_record.current_balance,
      new_balance,
      'Monthly credit allowance reset',
      'monthly_reset_' || EXTRACT(YEAR FROM reset_date) || '_' || EXTRACT(MONTH FROM reset_date),
      'completed'
    );
    
    -- Return the result
    user_id := user_record.user_id;
    subscription_tier := user_record.subscription_tier;
    old_balance := user_record.current_balance;
    new_balance := new_balance;
    monthly_allowance := user_record.monthly_allowance;
    reset_date := reset_date;
    
    RETURN NEXT;
  END LOOP;
  
  RETURN;
END;
$$;

-- Create a function to manually trigger the reset for testing
CREATE OR REPLACE FUNCTION trigger_monthly_reset()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
  reset_count INTEGER;
BEGIN
  -- Get count of users who will be reset
  SELECT COUNT(*) INTO reset_count
  FROM user_credits uc
  WHERE 
    uc.last_reset_at IS NULL
    OR 
    uc.last_reset_at < (NOW() - INTERVAL '30 days')
    OR
    DATE_TRUNC('month', uc.last_reset_at) < DATE_TRUNC('month', NOW());
  
  -- Execute the reset
  PERFORM reset_monthly_credits();
  
  -- Return summary
  result := json_build_object(
    'success', true,
    'users_reset', reset_count,
    'reset_date', NOW(),
    'message', 'Monthly credit reset completed successfully'
  );
  
  RETURN result;
END;
$$;

-- Create a function to check which users need a reset
CREATE OR REPLACE FUNCTION check_reset_status()
RETURNS TABLE(
  user_id UUID,
  subscription_tier TEXT,
  current_balance DECIMAL,
  monthly_allowance INTEGER,
  consumed_this_month INTEGER,
  last_reset_at TIMESTAMPTZ,
  days_since_reset INTEGER,
  needs_reset BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    uc.user_id,
    uc.subscription_tier,
    uc.current_balance,
    uc.monthly_allowance,
    uc.consumed_this_month,
    uc.last_reset_at,
    CASE 
      WHEN uc.last_reset_at IS NULL THEN NULL
      ELSE EXTRACT(DAY FROM (NOW() - uc.last_reset_at))::INTEGER
    END as days_since_reset,
    CASE 
      WHEN uc.last_reset_at IS NULL THEN true
      WHEN uc.last_reset_at < (NOW() - INTERVAL '30 days') THEN true
      WHEN DATE_TRUNC('month', uc.last_reset_at) < DATE_TRUNC('month', NOW()) THEN true
      ELSE false
    END as needs_reset
  FROM user_credits uc
  ORDER BY needs_reset DESC, uc.last_reset_at ASC;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION reset_monthly_credits() TO authenticated;
GRANT EXECUTE ON FUNCTION trigger_monthly_reset() TO authenticated;
GRANT EXECUTE ON FUNCTION check_reset_status() TO authenticated;

-- Show current reset status
SELECT * FROM check_reset_status();

-- Show summary
SELECT 
  'Reset Status Check' as operation,
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE needs_reset = true) as users_needing_reset,
  COUNT(*) FILTER (WHERE needs_reset = false) as users_up_to_date
FROM check_reset_status();

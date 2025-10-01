-- Fix: Purchased credits should roll over, subscription credits should reset
-- 
-- Problem: Current reset function overwrites ALL credits with monthly_allowance
-- Solution: Track purchased credits separately and preserve them during reset
--
-- Strategy: 
-- - current_balance = subscription credits + purchased credits
-- - Only reset the subscription portion, keep purchased credits

-- Step 1: Add a column to track purchased credits separately
ALTER TABLE public.user_credits 
ADD COLUMN IF NOT EXISTS purchased_credits_balance INTEGER DEFAULT 0;

-- Step 2: Migrate existing data (assume all current credits are from subscription)
-- In production, you might want to be more careful here
UPDATE public.user_credits 
SET purchased_credits_balance = 0
WHERE purchased_credits_balance IS NULL;

-- Step 3: Create improved reset function that preserves purchased credits
CREATE OR REPLACE FUNCTION reset_monthly_subscription_benefits()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    reset_count INTEGER := 0;
    user_record RECORD;
BEGIN
    -- Reset credits for all users based on their subscription tier
    FOR user_record IN 
        SELECT 
            uc.user_id,
            uc.subscription_tier,
            uc.monthly_allowance,
            uc.current_balance,
            uc.purchased_credits_balance,
            uc.consumed_this_month
        FROM user_credits uc
        WHERE uc.last_reset_at < date_trunc('month', NOW())
    LOOP
        -- IMPORTANT: Reset subscription credits but KEEP purchased credits
        -- New balance = monthly_allowance (subscription) + purchased_credits_balance (never expires)
        UPDATE user_credits 
        SET 
            current_balance = user_record.monthly_allowance + user_record.purchased_credits_balance,
            consumed_this_month = 0,
            last_reset_at = NOW(),
            updated_at = NOW()
        WHERE user_id = user_record.user_id;
        
        -- Log the reset transaction
        INSERT INTO credit_transactions (
            user_id,
            transaction_type,
            credits_used,
            enhancement_type,
            status,
            created_at
        ) VALUES (
            user_record.user_id,
            'monthly_reset',
            user_record.monthly_allowance,
            'monthly_allowance',
            'completed',
            NOW()
        );
        
        reset_count := reset_count + 1;
    END LOOP;
    
    RETURN reset_count;
END;
$$;

-- Step 4: Create helper function to add purchased credits
CREATE OR REPLACE FUNCTION add_purchased_credits(
    p_user_id UUID,
    p_credits INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Add to both current_balance and purchased_credits_balance
    UPDATE user_credits
    SET 
        current_balance = current_balance + p_credits,
        purchased_credits_balance = purchased_credits_balance + p_credits,
        updated_at = NOW()
    WHERE user_id = p_user_id;
END;
$$;

-- Step 5: Create helper function to consume credits (deducts from purchased first, then subscription)
CREATE OR REPLACE FUNCTION consume_user_credits(
    p_user_id UUID,
    p_credits INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_credits RECORD;
    v_purchased_consumed INTEGER := 0;
    v_subscription_consumed INTEGER := 0;
BEGIN
    -- Get current credit state
    SELECT * INTO v_user_credits
    FROM user_credits
    WHERE user_id = p_user_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User credits not found';
    END IF;
    
    -- Check if user has enough credits
    IF v_user_credits.current_balance < p_credits THEN
        RAISE EXCEPTION 'Insufficient credits';
    END IF;
    
    -- Strategy: Consume purchased credits first (they're already paid for)
    -- Then consume subscription credits
    
    IF v_user_credits.purchased_credits_balance >= p_credits THEN
        -- All credits come from purchased
        v_purchased_consumed := p_credits;
    ELSE
        -- Some from purchased, rest from subscription
        v_purchased_consumed := v_user_credits.purchased_credits_balance;
        v_subscription_consumed := p_credits - v_purchased_consumed;
    END IF;
    
    -- Update the balances
    UPDATE user_credits
    SET 
        current_balance = current_balance - p_credits,
        purchased_credits_balance = purchased_credits_balance - v_purchased_consumed,
        consumed_this_month = consumed_this_month + v_subscription_consumed,
        lifetime_consumed = lifetime_consumed + p_credits,
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    -- Return breakdown of what was consumed
    RETURN jsonb_build_object(
        'total_consumed', p_credits,
        'purchased_consumed', v_purchased_consumed,
        'subscription_consumed', v_subscription_consumed,
        'remaining_balance', v_user_credits.current_balance - p_credits,
        'remaining_purchased', v_user_credits.purchased_credits_balance - v_purchased_consumed
    );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION reset_monthly_subscription_benefits() TO service_role;
GRANT EXECUTE ON FUNCTION add_purchased_credits(UUID, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION consume_user_credits(UUID, INTEGER) TO service_role;

-- Add helpful comment
COMMENT ON COLUMN user_credits.purchased_credits_balance IS 
'Credits purchased via lootbox or credit packages. These NEVER expire and roll over indefinitely.';

COMMENT ON COLUMN user_credits.monthly_allowance IS 
'Subscription tier allowance. Resets to this value every month.';

COMMENT ON COLUMN user_credits.current_balance IS 
'Total available credits = monthly_allowance (resets) + purchased_credits_balance (persists)';


-- Create user_credits table for tracking user credit balances
CREATE TABLE IF NOT EXISTS user_credits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
    lifetime_earned INTEGER NOT NULL DEFAULT 0,
    lifetime_consumed INTEGER NOT NULL DEFAULT 0,
    last_purchase_at TIMESTAMPTZ,
    last_consumed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON user_credits(user_id);
-- Note: balance index created with table

-- Enable RLS
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;

-- Users can read their own credits
CREATE POLICY "Users can read own credits" ON user_credits
    FOR SELECT
    USING (user_id = auth.uid());

-- Users can update their own credits (for purchases)
CREATE POLICY "Users can update own credits" ON user_credits
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- System can manage all credits (via service role)
CREATE POLICY "System can manage credits" ON user_credits
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Create credit_transactions table for audit trail
CREATE TABLE IF NOT EXISTS credit_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('purchase', 'consume', 'refund', 'bonus', 'adjustment')),
    amount INTEGER NOT NULL,
    balance_before INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    description TEXT,
    reference_id TEXT, -- Can reference order_id, task_id, refund_id, etc
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance  
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
-- Note: Other indexes may already exist from previous migrations
-- CREATE INDEX IF NOT EXISTS idx_credit_transactions_type ON credit_transactions(type);
-- CREATE INDEX IF NOT EXISTS idx_credit_transactions_reference_id ON credit_transactions(reference_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at DESC);

-- Enable RLS
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- Users can read their own transactions
CREATE POLICY "Users can read own transactions" ON credit_transactions
    FOR SELECT
    USING (user_id = auth.uid());

-- System can create transactions (via service role)
CREATE POLICY "System can create transactions" ON credit_transactions
    FOR INSERT
    WITH CHECK (true);

-- Grant necessary permissions
GRANT SELECT ON user_credits TO authenticated;
GRANT SELECT ON credit_transactions TO authenticated;
GRANT ALL ON user_credits TO service_role;
GRANT ALL ON credit_transactions TO service_role;

-- Create function to update user credits with transaction logging
CREATE OR REPLACE FUNCTION update_user_credits(
    p_user_id UUID,
    p_amount INTEGER,
    p_type TEXT,
    p_description TEXT DEFAULT NULL,
    p_reference_id TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
) RETURNS user_credits AS $$
DECLARE
    v_current_balance INTEGER;
    v_new_balance INTEGER;
    v_user_credits user_credits;
BEGIN
    -- Get current balance (with lock)
    SELECT balance INTO v_current_balance
    FROM user_credits
    WHERE user_id = p_user_id
    FOR UPDATE;
    
    -- If no record exists, create one
    IF v_current_balance IS NULL THEN
        INSERT INTO user_credits (user_id, balance, lifetime_earned, lifetime_consumed)
        VALUES (p_user_id, 0, 0, 0)
        RETURNING balance INTO v_current_balance;
    END IF;
    
    -- Calculate new balance
    v_new_balance := v_current_balance + p_amount;
    
    -- Check for negative balance
    IF v_new_balance < 0 THEN
        RAISE EXCEPTION 'Insufficient credits. Current balance: %, Requested: %', v_current_balance, ABS(p_amount);
    END IF;
    
    -- Update user_credits
    UPDATE user_credits
    SET 
        balance = v_new_balance,
        lifetime_earned = CASE 
            WHEN p_type IN ('purchase', 'refund', 'bonus') 
            THEN lifetime_earned + p_amount 
            ELSE lifetime_earned 
        END,
        lifetime_consumed = CASE 
            WHEN p_type = 'consume' 
            THEN lifetime_consumed + ABS(p_amount) 
            ELSE lifetime_consumed 
        END,
        last_purchase_at = CASE 
            WHEN p_type = 'purchase' 
            THEN now() 
            ELSE last_purchase_at 
        END,
        last_consumed_at = CASE 
            WHEN p_type = 'consume' 
            THEN now() 
            ELSE last_consumed_at 
        END,
        updated_at = now()
    WHERE user_id = p_user_id
    RETURNING * INTO v_user_credits;
    
    -- Log transaction
    INSERT INTO credit_transactions (
        user_id, 
        type, 
        amount, 
        balance_before, 
        balance_after, 
        description, 
        reference_id, 
        metadata
    ) VALUES (
        p_user_id,
        p_type,
        p_amount,
        v_current_balance,
        v_new_balance,
        p_description,
        p_reference_id,
        p_metadata
    );
    
    RETURN v_user_credits;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_user_credits TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_credits TO service_role;
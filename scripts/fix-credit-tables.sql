-- Fix: Create missing credit tables immediately
-- Run this in Supabase SQL Editor to fix the user_credit_purchases error

-- Create user_credit_purchases table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_credit_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    package_id VARCHAR(50),
    credits_purchased INTEGER NOT NULL,
    amount_paid_usd DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'stripe',
    status VARCHAR(50) DEFAULT 'pending', -- pending, completed, failed, cancelled
    stripe_session_id VARCHAR(255),
    stripe_customer_id VARCHAR(255),
    error_message TEXT,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create user_credits table if it doesn't exist (for balance tracking)
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

-- Create credit_transactions table for transaction history
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

-- Create credit_packages table for available packages
CREATE TABLE IF NOT EXISTS credit_packages (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    credits INTEGER NOT NULL,
    price_usd DECIMAL(10,2) NOT NULL,
    stripe_price_id VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    is_popular BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create checkout_sessions table for Stripe integration
CREATE TABLE IF NOT EXISTS checkout_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    stripe_session_id VARCHAR(255) UNIQUE NOT NULL,
    package_id VARCHAR(50),
    credits INTEGER NOT NULL,
    amount_usd DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'created',
    expires_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_credit_purchases_user_id ON user_credit_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_user_credit_purchases_created_at ON user_credit_purchases(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_credit_purchases_stripe_session_id ON user_credit_purchases(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON user_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_user_id ON checkout_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_stripe_session_id ON checkout_sessions(stripe_session_id);

-- Enable RLS
ALTER TABLE user_credit_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkout_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view their own credit purchases
DROP POLICY IF EXISTS "Users can view own credit purchases" ON user_credit_purchases;
CREATE POLICY "Users can view own credit purchases" ON user_credit_purchases
    FOR SELECT USING (user_id = auth.uid());

-- Users can view their own credit balance
DROP POLICY IF EXISTS "Users can view own credits" ON user_credits;
CREATE POLICY "Users can view own credits" ON user_credits
    FOR SELECT USING (user_id = auth.uid());

-- Users can view their own transactions
DROP POLICY IF EXISTS "Users can view own transactions" ON credit_transactions;
CREATE POLICY "Users can view own transactions" ON credit_transactions
    FOR SELECT USING (user_id = auth.uid());

-- Users can view active credit packages
DROP POLICY IF EXISTS "Users can view active packages" ON credit_packages;
CREATE POLICY "Users can view active packages" ON credit_packages
    FOR SELECT USING (is_active = true);

-- Users can view their own checkout sessions
DROP POLICY IF EXISTS "Users can view own checkout sessions" ON checkout_sessions;
CREATE POLICY "Users can view own checkout sessions" ON checkout_sessions
    FOR SELECT USING (user_id = auth.uid());

-- Service role can manage all tables
DROP POLICY IF EXISTS "Service role manages credit purchases" ON user_credit_purchases;
CREATE POLICY "Service role manages credit purchases" ON user_credit_purchases
    FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role manages credits" ON user_credits;
CREATE POLICY "Service role manages credits" ON user_credits
    FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role manages transactions" ON credit_transactions;
CREATE POLICY "Service role manages transactions" ON credit_transactions
    FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role manages packages" ON credit_packages;
CREATE POLICY "Service role manages packages" ON credit_packages
    FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role manages checkout sessions" ON checkout_sessions;
CREATE POLICY "Service role manages checkout sessions" ON checkout_sessions
    FOR ALL USING (true) WITH CHECK (true);

-- Grant permissions
GRANT SELECT ON user_credit_purchases TO authenticated;
GRANT SELECT ON user_credits TO authenticated;
GRANT SELECT ON credit_transactions TO authenticated;
GRANT SELECT ON credit_packages TO authenticated;
GRANT SELECT ON checkout_sessions TO authenticated;

GRANT ALL ON user_credit_purchases TO service_role;
GRANT ALL ON user_credits TO service_role;
GRANT ALL ON credit_transactions TO service_role;
GRANT ALL ON credit_packages TO service_role;
GRANT ALL ON checkout_sessions TO service_role;

-- Create the credit management function
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION update_user_credits TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_credits TO service_role;

-- Insert default credit packages
INSERT INTO credit_packages (id, name, description, credits, price_usd, is_active, is_popular, sort_order) VALUES
('starter', 'Starter Pack', '10 credits for image enhancements', 10, 5.00, true, false, 1),
('creative', 'Creative Pack', '50 credits for image enhancements', 50, 20.00, true, true, 2),
('pro', 'Pro Pack', '100 credits for image enhancements', 100, 35.00, true, false, 3),
('studio', 'Studio Pack', '500 credits for image enhancements', 500, 150.00, true, false, 4)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    credits = EXCLUDED.credits,
    price_usd = EXCLUDED.price_usd,
    updated_at = now();

-- Success message
SELECT 'Credit tables created successfully!' as status;
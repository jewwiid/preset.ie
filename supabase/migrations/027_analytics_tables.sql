-- Analytics Tables for Admin Dashboard
-- Creates the tables expected by the analytics API

-- Platform credit consumption (analytics version)
CREATE TABLE IF NOT EXISTS platform_credit_consumption (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider VARCHAR(50) NOT NULL,
    provider_credits_consumed DECIMAL(12,4) NOT NULL,
    operation_type VARCHAR(50) NOT NULL,
    cost_usd DECIMAL(8,4),
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User credit purchases (analytics version)
CREATE TABLE IF NOT EXISTS user_credit_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    package_id VARCHAR(50),
    credits_purchased INTEGER NOT NULL,
    amount_paid_usd DECIMAL(10,4) NOT NULL,
    status VARCHAR(20) DEFAULT 'completed',
    payment_provider VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhancement tasks (analytics version)
CREATE TABLE IF NOT EXISTS enhancement_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    enhancement_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    credits_consumed INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Platform credits balance (analytics version)
CREATE TABLE IF NOT EXISTS platform_credits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider VARCHAR(50) NOT NULL UNIQUE,
    current_balance DECIMAL(12,4) DEFAULT 0,
    low_balance_threshold DECIMAL(12,4) DEFAULT 100,
    credit_ratio DECIMAL(8,4) DEFAULT 1, -- user credits to provider credits ratio
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Credit packages (analytics version)
CREATE TABLE IF NOT EXISTS credit_packages (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    credits INTEGER NOT NULL,
    price_usd DECIMAL(10,4) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_platform_credit_consumption_provider ON platform_credit_consumption(provider);
CREATE INDEX IF NOT EXISTS idx_platform_credit_consumption_created_at ON platform_credit_consumption(created_at);
CREATE INDEX IF NOT EXISTS idx_user_credit_purchases_user_id ON user_credit_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_user_credit_purchases_created_at ON user_credit_purchases(created_at);
CREATE INDEX IF NOT EXISTS idx_enhancement_tasks_user_id ON enhancement_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_enhancement_tasks_created_at ON enhancement_tasks(created_at);
CREATE INDEX IF NOT EXISTS idx_enhancement_tasks_status ON enhancement_tasks(status);

-- Insert sample data for platform credits
INSERT INTO platform_credits (provider, current_balance, low_balance_threshold, credit_ratio)
VALUES 
    ('nanobanan', 1000, 100, 4.0), -- 1 user credit = 4 nanobanan credits
    ('fal_ai', 500, 50, 2.0)       -- 1 user credit = 2 fal.ai credits
ON CONFLICT (provider) DO UPDATE SET
    current_balance = EXCLUDED.current_balance,
    low_balance_threshold = EXCLUDED.low_balance_threshold,
    credit_ratio = EXCLUDED.credit_ratio,
    updated_at = NOW();

-- Insert sample credit packages
INSERT INTO credit_packages (id, name, credits, price_usd, is_active)
VALUES 
    ('starter', 'Starter Pack', 10, 9.99, true),
    ('creative', 'Creative Bundle', 50, 39.99, true),
    ('pro', 'Pro Pack', 100, 69.99, true),
    ('studio', 'Studio Pack', 500, 299.99, true)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    credits = EXCLUDED.credits,
    price_usd = EXCLUDED.price_usd,
    is_active = EXCLUDED.is_active;

-- Add RLS policies
ALTER TABLE platform_credit_consumption ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_credit_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE enhancement_tasks ENABLE ROW LEVEL SECURITY;

-- Admin can see everything
CREATE POLICY "Admin can view all analytics" ON platform_credit_consumption
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users_profile 
            WHERE user_id = auth.uid() 
            AND role_flags && ARRAY['admin']
        )
    );

CREATE POLICY "Admin can view all purchases" ON user_credit_purchases
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users_profile 
            WHERE user_id = auth.uid() 
            AND role_flags && ARRAY['admin']
        )
    );

CREATE POLICY "Admin can view all tasks" ON enhancement_tasks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users_profile 
            WHERE user_id = auth.uid() 
            AND role_flags && ARRAY['admin']
        )
    );

-- Users can see their own data
CREATE POLICY "Users can view own purchases" ON user_credit_purchases
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own tasks" ON enhancement_tasks
    FOR SELECT USING (auth.uid() = user_id);

-- Function to sync data from existing credit system to analytics tables
CREATE OR REPLACE FUNCTION sync_analytics_data()
RETURNS VOID AS $$
BEGIN
    -- Sync credit pools to platform_credits
    INSERT INTO platform_credits (provider, current_balance, low_balance_threshold)
    SELECT 
        provider,
        available_balance,
        auto_refill_threshold
    FROM credit_pools
    ON CONFLICT (provider) DO UPDATE SET
        current_balance = EXCLUDED.current_balance,
        low_balance_threshold = EXCLUDED.low_balance_threshold,
        updated_at = NOW();
        
    -- You can add more sync logic here as needed
END;
$$ LANGUAGE plpgsql;

-- Run initial sync
SELECT sync_analytics_data();

COMMENT ON TABLE platform_credit_consumption IS 'Analytics table tracking platform credit consumption by provider';
COMMENT ON TABLE user_credit_purchases IS 'Analytics table tracking user credit purchases';
COMMENT ON TABLE enhancement_tasks IS 'Analytics table tracking enhancement tasks and their status';
COMMENT ON TABLE platform_credits IS 'Analytics table tracking platform credit balances by provider';
COMMENT ON TABLE credit_packages IS 'Analytics table defining available credit packages for purchase';
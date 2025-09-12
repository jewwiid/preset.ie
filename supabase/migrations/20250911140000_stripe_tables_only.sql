-- Stripe Integration Tables Only (Minimal Migration)
-- This migration creates only the Stripe-specific tables to avoid conflicts

-- Checkout sessions tracking
CREATE TABLE IF NOT EXISTS checkout_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    stripe_session_id VARCHAR(255) UNIQUE NOT NULL,
    package_id VARCHAR(50) NOT NULL,
    credits INTEGER NOT NULL,
    amount_usd DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'created', -- created, completed, cancelled, expired
    expires_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Payment logs for all Stripe payment events
CREATE TABLE IF NOT EXISTS payment_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stripe_payment_intent_id VARCHAR(255) UNIQUE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'usd',
    status VARCHAR(50) NOT NULL, -- succeeded, failed, pending, cancelled
    error_message TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Invoice logs for subscription billing
CREATE TABLE IF NOT EXISTS invoice_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stripe_invoice_id VARCHAR(255) UNIQUE NOT NULL,
    stripe_subscription_id VARCHAR(255),
    amount_paid DECIMAL(10,2) DEFAULT 0,
    amount_due DECIMAL(10,2) DEFAULT 0,
    currency VARCHAR(3) NOT NULL DEFAULT 'usd',
    status VARCHAR(50) NOT NULL, -- paid, open, draft, uncollectible, void, payment_failed
    billing_reason VARCHAR(50), -- subscription_create, subscription_cycle, subscription_update, etc.
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Credit packages configuration (can be managed via admin)
CREATE TABLE IF NOT EXISTS credit_packages (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    credits INTEGER NOT NULL,
    price_usd DECIMAL(10,2) NOT NULL,
    stripe_price_id VARCHAR(255), -- Stripe Price ID for this package
    is_active BOOLEAN DEFAULT true,
    is_popular BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add Stripe fields to existing user_credit_purchases table (if it exists)
DO $$ 
BEGIN 
    -- Check if table exists and add columns
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_credit_purchases') THEN
        ALTER TABLE user_credit_purchases 
        ADD COLUMN IF NOT EXISTS stripe_session_id VARCHAR(255),
        ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255),
        ADD COLUMN IF NOT EXISTS error_message TEXT,
        ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'stripe',
        ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
        
        RAISE NOTICE 'Added Stripe columns to existing user_credit_purchases table';
    ELSE
        -- Create the table if it doesn't exist
        CREATE TABLE user_credit_purchases (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
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
        
        RAISE NOTICE 'Created user_credit_purchases table';
    END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_user_id ON checkout_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_stripe_session_id ON checkout_sessions(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_status ON checkout_sessions(status);
CREATE INDEX IF NOT EXISTS idx_payment_logs_stripe_payment_intent_id ON payment_logs(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_invoice_logs_stripe_invoice_id ON invoice_logs(stripe_invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_logs_stripe_subscription_id ON invoice_logs(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_user_credit_purchases_stripe_session_id ON user_credit_purchases(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_user_credit_purchases_user_id ON user_credit_purchases(user_id);

-- Enable RLS on new tables
ALTER TABLE checkout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_packages ENABLE ROW LEVEL SECURITY;

-- Enable RLS on user_credit_purchases if not already enabled
DO $$
BEGIN
    ALTER TABLE user_credit_purchases ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'Enabled RLS on user_credit_purchases';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'RLS already enabled on user_credit_purchases or other issue: %', SQLERRM;
END $$;

-- RLS Policies

-- Users can view their own checkout sessions
DROP POLICY IF EXISTS "Users can view own checkout sessions" ON checkout_sessions;
CREATE POLICY "Users can view own checkout sessions" ON checkout_sessions
    FOR SELECT
    USING (user_id = auth.uid());

-- Users can view their own credit purchases
DROP POLICY IF EXISTS "Users can view own credit purchases" ON user_credit_purchases;
CREATE POLICY "Users can view own credit purchases" ON user_credit_purchases
    FOR SELECT
    USING (user_id = auth.uid());

-- Users can view public credit packages
DROP POLICY IF EXISTS "Users can view active credit packages" ON credit_packages;
CREATE POLICY "Users can view active credit packages" ON credit_packages
    FOR SELECT
    USING (is_active = true);

-- Service role can manage all tables
DROP POLICY IF EXISTS "Service role can manage checkout sessions" ON checkout_sessions;
CREATE POLICY "Service role can manage checkout sessions" ON checkout_sessions
    FOR ALL
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can manage payment logs" ON payment_logs;
CREATE POLICY "Service role can manage payment logs" ON payment_logs
    FOR ALL
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can manage invoice logs" ON invoice_logs;
CREATE POLICY "Service role can manage invoice logs" ON invoice_logs
    FOR ALL
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can manage user credit purchases" ON user_credit_purchases;
CREATE POLICY "Service role can manage user credit purchases" ON user_credit_purchases
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Grant necessary permissions
GRANT SELECT ON checkout_sessions TO authenticated;
GRANT SELECT ON credit_packages TO authenticated;
GRANT SELECT ON user_credit_purchases TO authenticated;
GRANT ALL ON checkout_sessions TO service_role;
GRANT ALL ON payment_logs TO service_role;
GRANT ALL ON invoice_logs TO service_role;
GRANT ALL ON credit_packages TO service_role;
GRANT ALL ON user_credit_purchases TO service_role;

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
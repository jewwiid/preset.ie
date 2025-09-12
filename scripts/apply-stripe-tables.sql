-- Manual Stripe Integration Tables Setup
-- Run this SQL directly in your Supabase SQL editor or via psql

-- Checkout sessions tracking
CREATE TABLE IF NOT EXISTS checkout_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    stripe_session_id VARCHAR(255) UNIQUE NOT NULL,
    package_id VARCHAR(50) NOT NULL,
    credits INTEGER NOT NULL,
    amount_usd DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'created',
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
    status VARCHAR(50) NOT NULL,
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
    status VARCHAR(50) NOT NULL,
    billing_reason VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Credit packages configuration
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

-- Add Stripe columns to user_credit_purchases if it exists
ALTER TABLE user_credit_purchases 
ADD COLUMN IF NOT EXISTS stripe_session_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS error_message TEXT,
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'stripe',
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_user_id ON checkout_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_stripe_session_id ON checkout_sessions(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_stripe_payment_intent_id ON payment_logs(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_user_credit_purchases_stripe_session_id ON user_credit_purchases(stripe_session_id);

-- Enable RLS
ALTER TABLE checkout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_packages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own checkout sessions" ON checkout_sessions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view active credit packages" ON credit_packages
    FOR SELECT USING (is_active = true);

CREATE POLICY "Service role manages all stripe tables" ON checkout_sessions
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role manages all payment logs" ON payment_logs
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role manages all invoice logs" ON invoice_logs
    FOR ALL USING (true) WITH CHECK (true);

-- Grants
GRANT SELECT ON checkout_sessions TO authenticated;
GRANT SELECT ON credit_packages TO authenticated;
GRANT ALL ON checkout_sessions TO service_role;
GRANT ALL ON payment_logs TO service_role;
GRANT ALL ON invoice_logs TO service_role;
GRANT ALL ON credit_packages TO service_role;

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
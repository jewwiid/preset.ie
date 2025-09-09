-- Credit Management System Migration
-- This migration creates all necessary tables for the credit management system

-- Credit pools and tracking
CREATE TABLE IF NOT EXISTS credit_pools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider VARCHAR(50) UNIQUE NOT NULL, -- 'nanobanan', 'fal_ai', etc.
  total_purchased DECIMAL(12,4) DEFAULT 0,
  total_consumed DECIMAL(12,4) DEFAULT 0,
  available_balance DECIMAL(12,4) DEFAULT 0,
  cost_per_credit DECIMAL(8,4) NOT NULL,
  last_refill_at TIMESTAMP WITH TIME ZONE,
  auto_refill_threshold DECIMAL(12,4) DEFAULT 100, -- Refill when below this
  auto_refill_amount DECIMAL(12,4) DEFAULT 500,
  status VARCHAR(20) DEFAULT 'active', -- active, suspended, depleted
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User credit allocations and usage
CREATE TABLE IF NOT EXISTS user_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_tier VARCHAR(20) NOT NULL,
  monthly_allowance INTEGER DEFAULT 0, -- Credits per month based on tier
  current_balance INTEGER DEFAULT 0,
  consumed_this_month INTEGER DEFAULT 0,
  last_reset_at TIMESTAMP WITH TIME ZONE DEFAULT DATE_TRUNC('month', NOW()),
  lifetime_consumed INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Detailed usage tracking
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  moodboard_id UUID REFERENCES moodboards(id),
  transaction_type VARCHAR(20) NOT NULL, -- 'deduction', 'refund', 'allocation'
  credits_used INTEGER NOT NULL,
  cost_usd DECIMAL(8,4),
  provider VARCHAR(50),
  api_request_id VARCHAR(100), -- Track specific API calls
  enhancement_type VARCHAR(50),
  status VARCHAR(20) DEFAULT 'completed', -- completed, failed, pending
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Platform-wide usage analytics
CREATE TABLE IF NOT EXISTS daily_usage_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  total_requests INTEGER DEFAULT 0,
  successful_requests INTEGER DEFAULT 0,
  failed_requests INTEGER DEFAULT 0,
  total_credits_consumed INTEGER DEFAULT 0,
  total_cost_usd DECIMAL(10,4) DEFAULT 0,
  free_tier_usage INTEGER DEFAULT 0,
  plus_tier_usage INTEGER DEFAULT 0,
  pro_tier_usage INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(date)
);

-- Alert configurations
CREATE TABLE IF NOT EXISTS credit_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type VARCHAR(50) NOT NULL, -- 'low_credits', 'high_usage', 'api_failure'
  threshold_value DECIMAL(10,4),
  notification_channels TEXT[], -- ['email', 'slack', 'sms']
  is_active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API provider configurations
CREATE TABLE IF NOT EXISTS api_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  base_url TEXT NOT NULL,
  api_key_encrypted TEXT NOT NULL, -- Encrypted API key
  cost_per_request DECIMAL(8,4) NOT NULL,
  rate_limit_per_minute INTEGER DEFAULT 60,
  priority INTEGER DEFAULT 1, -- 1 = primary, 2 = fallback, etc.
  is_active BOOLEAN DEFAULT true,
  health_check_url TEXT,
  last_health_check TIMESTAMP WITH TIME ZONE,
  success_rate_24h DECIMAL(5,2) DEFAULT 100.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Credit purchase requests for manual approval
CREATE TABLE IF NOT EXISTS credit_purchase_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider VARCHAR(50) NOT NULL,
  amount_requested DECIMAL(12,4) NOT NULL,
  estimated_cost DECIMAL(10,4) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending_manual_approval',
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  transaction_id VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System alerts log
CREATE TABLE IF NOT EXISTS system_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL,
  level VARCHAR(20) NOT NULL, -- 'info', 'warning', 'error', 'critical'
  message TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON user_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_daily_usage_date ON daily_usage_summary(date);
CREATE INDEX IF NOT EXISTS idx_credit_pools_provider ON credit_pools(provider);
CREATE INDEX IF NOT EXISTS idx_api_providers_name ON api_providers(name);

-- RLS Policies
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- Users can view their own credits
CREATE POLICY "Users can view their own credits" ON user_credits
  FOR SELECT USING (auth.uid() = user_id);

-- Users can view their own transactions
CREATE POLICY "Users can view their own transactions" ON credit_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Functions for credit management
CREATE OR REPLACE FUNCTION consume_user_credits(
  p_user_id UUID,
  p_credits INTEGER,
  p_enhancement_type VARCHAR(50)
) RETURNS TABLE(remaining_balance INTEGER) AS $$
DECLARE
  current_balance INTEGER;
  new_balance INTEGER;
BEGIN
  -- Get current balance
  SELECT current_balance INTO current_balance
  FROM user_credits
  WHERE user_id = p_user_id;
  
  -- Check if user has enough credits
  IF current_balance < p_credits THEN
    RAISE EXCEPTION 'Insufficient credits. Available: %, Required: %', current_balance, p_credits;
  END IF;
  
  -- Calculate new balance
  new_balance := current_balance - p_credits;
  
  -- Update user credits
  UPDATE user_credits
  SET 
    current_balance = new_balance,
    consumed_this_month = consumed_this_month + p_credits,
    lifetime_consumed = lifetime_consumed + p_credits,
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Log transaction
  INSERT INTO credit_transactions (
    user_id,
    transaction_type,
    credits_used,
    enhancement_type,
    status
  ) VALUES (
    p_user_id,
    'deduction',
    p_credits,
    p_enhancement_type,
    'completed'
  );
  
  -- Return remaining balance
  RETURN QUERY SELECT new_balance;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION consume_platform_credits(
  p_provider VARCHAR(50),
  p_credits INTEGER,
  p_cost DECIMAL(8,4)
) RETURNS VOID AS $$
BEGIN
  -- Update platform pool
  UPDATE credit_pools
  SET 
    total_consumed = total_consumed + p_credits,
    available_balance = available_balance - p_credits,
    updated_at = NOW()
  WHERE provider = p_provider AND status = 'active';
  
  -- Check if pool is now low
  IF (SELECT available_balance FROM credit_pools WHERE provider = p_provider) <= 
     (SELECT auto_refill_threshold FROM credit_pools WHERE provider = p_provider) THEN
    -- Log alert for low credits
    INSERT INTO system_alerts (type, level, message)
    VALUES ('low_platform_credits', 'warning', 
            'Platform credits low for ' || p_provider || '. Auto-refill may be triggered.');
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Initialize default credit pool for NanoBanana
INSERT INTO credit_pools (
  provider,
  total_purchased,
  available_balance,
  cost_per_credit,
  auto_refill_threshold,
  auto_refill_amount,
  status
) VALUES (
  'nanobanan',
  1000, -- Start with 1000 credits
  1000,
  0.025, -- $0.025 per credit
  100,   -- Refill when below 100
  500,   -- Refill with 500 credits
  'active'
) ON CONFLICT (provider) DO NOTHING;

-- Initialize API provider configuration
INSERT INTO api_providers (
  name,
  base_url,
  api_key_encrypted,
  cost_per_request,
  priority,
  is_active
) VALUES (
  'nanobanan',
  'https://api.nanobananapi.ai',
  'ENCRYPTED_API_KEY_PLACEHOLDER', -- Replace with actual encrypted key
  0.025,
  1,
  true
) ON CONFLICT (name) DO NOTHING;

-- Create default alert configurations
INSERT INTO credit_alerts (alert_type, threshold_value, notification_channels, is_active)
VALUES 
  ('low_platform_credits', 100, ARRAY['email', 'slack'], true),
  ('high_credit_usage', 90, ARRAY['email'], true),
  ('api_failure', 0, ARRAY['slack'], true)
ON CONFLICT DO NOTHING;

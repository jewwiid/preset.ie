-- Create platform credit tables for marketplace system
-- This creates the core tables without the complex dependencies

-- Platform Credits table (tracks platform's balance with providers)
CREATE TABLE IF NOT EXISTS platform_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider VARCHAR(50) NOT NULL UNIQUE,
  current_balance INTEGER NOT NULL DEFAULT 0,
  total_purchased INTEGER NOT NULL DEFAULT 0,
  total_consumed INTEGER NOT NULL DEFAULT 0,
  last_purchase_at TIMESTAMPTZ,
  last_consumption_at TIMESTAMPTZ,
  credit_ratio DECIMAL(10, 2) NOT NULL DEFAULT 1.0,
  low_balance_threshold INTEGER DEFAULT 100,
  auto_refill_enabled BOOLEAN DEFAULT false,
  auto_refill_amount INTEGER DEFAULT 1000,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Credit Packages table (marketplace offerings)
CREATE TABLE IF NOT EXISTS credit_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  user_credits INTEGER NOT NULL,
  price_usd DECIMAL(10, 2) NOT NULL,
  discount_percentage DECIMAL(5, 2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  max_purchases_per_user INTEGER,
  stripe_price_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert initial provider configurations
INSERT INTO platform_credits (provider, current_balance, credit_ratio, low_balance_threshold)
VALUES 
  ('nanobanana', 10000, 4.0, 100),
  ('openai', 1000, 0.1, 50),
  ('pexels', 5000, 1.0, 100)
ON CONFLICT (provider) DO NOTHING;

-- Insert sample credit packages
INSERT INTO credit_packages (name, description, user_credits, price_usd, is_active)
VALUES 
  ('Starter Pack', 'Perfect for trying out the platform', 10, 9.99, true),
  ('Creative Bundle', 'For regular creators', 50, 39.99, true),
  ('Pro Pack', 'For power users', 100, 69.99, true),
  ('Studio Pack', 'For professional studios', 500, 299.99, true)
ON CONFLICT DO NOTHING;

-- Create the functions for credit management
CREATE OR REPLACE FUNCTION check_platform_credits(
  p_provider VARCHAR,
  p_user_credits INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
  v_platform_balance INTEGER;
  v_credit_ratio DECIMAL;
  v_required_credits INTEGER;
BEGIN
  SELECT current_balance, credit_ratio
  INTO v_platform_balance, v_credit_ratio
  FROM platform_credits
  WHERE provider = p_provider;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  v_required_credits := CEIL(p_user_credits * v_credit_ratio);
  
  RETURN v_platform_balance >= v_required_credits;
END;
$$ LANGUAGE plpgsql;

-- Function to consume platform credits
CREATE OR REPLACE FUNCTION consume_platform_credits(
  p_provider VARCHAR,
  p_user_id UUID,
  p_user_credits INTEGER,
  p_operation_type VARCHAR,
  p_task_id VARCHAR DEFAULT NULL,
  p_moodboard_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_platform_balance INTEGER;
  v_credit_ratio DECIMAL;
  v_provider_credits INTEGER;
BEGIN
  -- Get current balance and ratio
  SELECT current_balance, credit_ratio
  INTO v_platform_balance, v_credit_ratio
  FROM platform_credits
  WHERE provider = p_provider
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Provider % not found', p_provider;
  END IF;
  
  -- Calculate provider credits needed
  v_provider_credits := CEIL(p_user_credits * v_credit_ratio);
  
  -- Check if enough credits
  IF v_platform_balance < v_provider_credits THEN
    RETURN FALSE;
  END IF;
  
  -- Update platform balance
  UPDATE platform_credits
  SET 
    current_balance = current_balance - v_provider_credits,
    total_consumed = total_consumed + v_provider_credits,
    last_consumption_at = NOW()
  WHERE provider = p_provider;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
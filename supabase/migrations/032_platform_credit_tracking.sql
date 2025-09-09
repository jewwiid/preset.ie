-- Platform Credit Tracking
-- Tracks the platform's balance with various AI/API providers
CREATE TABLE IF NOT EXISTS platform_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider VARCHAR(50) NOT NULL UNIQUE,
  current_balance INTEGER NOT NULL DEFAULT 0,
  total_purchased INTEGER NOT NULL DEFAULT 0,
  total_consumed INTEGER NOT NULL DEFAULT 0,
  last_purchase_at TIMESTAMPTZ,
  last_consumption_at TIMESTAMPTZ,
  credit_ratio DECIMAL(10, 2) NOT NULL DEFAULT 1.0, -- Provider credits per user credit
  low_balance_threshold INTEGER DEFAULT 100,
  auto_refill_enabled BOOLEAN DEFAULT false,
  auto_refill_amount INTEGER DEFAULT 1000,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Credit Purchase History
CREATE TABLE IF NOT EXISTS platform_credit_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider VARCHAR(50) NOT NULL REFERENCES platform_credits(provider),
  amount_purchased INTEGER NOT NULL,
  cost_usd DECIMAL(10, 2) NOT NULL,
  payment_method VARCHAR(50),
  transaction_id VARCHAR(255),
  purchased_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Credit Packages (marketplace offerings)
CREATE TABLE IF NOT EXISTS credit_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  user_credits INTEGER NOT NULL, -- Credits the user receives
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

-- User Credit Purchases (from marketplace)
CREATE TABLE IF NOT EXISTS user_credit_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  package_id UUID REFERENCES credit_packages(id),
  credits_purchased INTEGER NOT NULL,
  amount_paid_usd DECIMAL(10, 2) NOT NULL,
  payment_method VARCHAR(50),
  stripe_payment_intent_id VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pending', -- pending, completed, failed, refunded
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Platform credit consumption tracking (detailed log)
CREATE TABLE IF NOT EXISTS platform_credit_consumption (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider VARCHAR(50) NOT NULL REFERENCES platform_credits(provider),
  user_id UUID REFERENCES auth.users(id),
  operation_type VARCHAR(50) NOT NULL, -- enhancement, generation, etc
  user_credits_charged INTEGER NOT NULL,
  provider_credits_consumed INTEGER NOT NULL,
  task_id VARCHAR(255), -- External API task ID
  moodboard_id UUID REFERENCES moodboards(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_platform_credits_provider ON platform_credits(provider);
CREATE INDEX idx_platform_credit_purchases_provider ON platform_credit_purchases(provider);
CREATE INDEX idx_platform_credit_purchases_created ON platform_credit_purchases(created_at DESC);
CREATE INDEX idx_credit_packages_active ON credit_packages(is_active) WHERE is_active = true;
CREATE INDEX idx_user_credit_purchases_user ON user_credit_purchases(user_id);
CREATE INDEX idx_user_credit_purchases_status ON user_credit_purchases(status);
CREATE INDEX idx_platform_credit_consumption_provider ON platform_credit_consumption(provider);
CREATE INDEX idx_platform_credit_consumption_user ON platform_credit_consumption(user_id);
CREATE INDEX idx_platform_credit_consumption_created ON platform_credit_consumption(created_at DESC);

-- RLS Policies
ALTER TABLE platform_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_credit_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_credit_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_credit_consumption ENABLE ROW LEVEL SECURITY;

-- Only admins can manage platform credits
CREATE POLICY platform_credits_admin_all ON platform_credits
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY platform_credit_purchases_admin_all ON platform_credit_purchases
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

-- Everyone can view active credit packages
CREATE POLICY credit_packages_public_read ON credit_packages
  FOR SELECT TO authenticated
  USING (is_active = true);

-- Admins can manage credit packages
CREATE POLICY credit_packages_admin_all ON credit_packages
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

-- Users can view their own purchases
CREATE POLICY user_credit_purchases_own_read ON user_credit_purchases
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- System can insert purchases (via service role)
CREATE POLICY user_credit_purchases_insert ON user_credit_purchases
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Only admins can view consumption logs
CREATE POLICY platform_credit_consumption_admin_read ON platform_credit_consumption
  FOR SELECT TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_platform_credits_updated_at
  BEFORE UPDATE ON platform_credits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_credit_packages_updated_at
  BEFORE UPDATE ON credit_packages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to check platform credit availability
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
  
  -- Log consumption
  INSERT INTO platform_credit_consumption (
    provider,
    user_id,
    operation_type,
    user_credits_charged,
    provider_credits_consumed,
    task_id,
    moodboard_id
  ) VALUES (
    p_provider,
    p_user_id,
    p_operation_type,
    p_user_credits,
    v_provider_credits,
    p_task_id,
    p_moodboard_id
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

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
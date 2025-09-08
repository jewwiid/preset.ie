-- =====================================================
-- CREDIT MANAGEMENT SYSTEM SCHEMA
-- =====================================================
-- Complete credit management system for NanoBanana integration

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS credit_transactions CASCADE;
DROP TABLE IF EXISTS user_credits CASCADE;
DROP TABLE IF EXISTS credit_pools CASCADE;
DROP TABLE IF EXISTS enhancement_tasks CASCADE;

-- Credit pools and tracking
CREATE TABLE IF NOT EXISTS credit_pools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider VARCHAR(50) NOT NULL, -- 'nanobanan', 'fal_ai', etc.
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

-- Enhancement tasks tracking
CREATE TABLE IF NOT EXISTS enhancement_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  moodboard_id UUID REFERENCES moodboards(id),
  original_image_url TEXT NOT NULL,
  original_source VARCHAR(50), -- 'pexels', 'upload', 'url'
  enhancement_type VARCHAR(50) NOT NULL,
  prompt TEXT,
  strength DECIMAL(3,2) DEFAULT 0.8,
  provider VARCHAR(50) DEFAULT 'nanobanan',
  api_task_id VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed
  result_url TEXT,
  storage_path TEXT, -- Path in Supabase storage
  error_message TEXT,
  cost_usd DECIMAL(8,4) DEFAULT 0.025,
  credits_used INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Index for fast lookups
  INDEX idx_user_tasks (user_id, status),
  INDEX idx_moodboard_tasks (moodboard_id),
  INDEX idx_api_task (api_task_id)
);

-- Detailed usage tracking
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  moodboard_id UUID REFERENCES moodboards(id),
  enhancement_task_id UUID REFERENCES enhancement_tasks(id),
  transaction_type VARCHAR(20) NOT NULL, -- 'deduction', 'refund', 'allocation'
  credits_used INTEGER NOT NULL,
  cost_usd DECIMAL(8,4),
  provider VARCHAR(50),
  api_request_id VARCHAR(255),
  status VARCHAR(20) DEFAULT 'completed',
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add enhanced image tracking to moodboards items
ALTER TABLE moodboards 
ADD COLUMN IF NOT EXISTS total_cost DECIMAL(8,4) DEFAULT 0;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_date ON credit_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_credits_tier ON user_credits(subscription_tier);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to check if user has sufficient credits
CREATE OR REPLACE FUNCTION check_user_credits(
  p_user_id UUID,
  p_credits_needed INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
  v_user_balance INTEGER;
  v_pool_balance DECIMAL;
BEGIN
  -- Get user's current balance
  SELECT current_balance INTO v_user_balance
  FROM user_credits
  WHERE user_id = p_user_id;
  
  -- If user has no record, they have no credits
  IF v_user_balance IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if user has enough credits
  IF v_user_balance >= p_credits_needed THEN
    RETURN TRUE;
  END IF;
  
  -- Check platform pool as fallback
  SELECT available_balance INTO v_pool_balance
  FROM credit_pools
  WHERE provider = 'nanobanan' AND status = 'active';
  
  RETURN v_pool_balance >= p_credits_needed;
END;
$$ LANGUAGE plpgsql;

-- Function to deduct credits from user
CREATE OR REPLACE FUNCTION deduct_user_credits(
  p_user_id UUID,
  p_credits INTEGER,
  p_moodboard_id UUID DEFAULT NULL,
  p_task_id UUID DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_user_balance INTEGER;
  v_new_balance INTEGER;
  v_transaction_id UUID;
BEGIN
  -- Get and lock user credits row
  SELECT current_balance INTO v_user_balance
  FROM user_credits
  WHERE user_id = p_user_id
  FOR UPDATE;
  
  -- Check if user has enough credits
  IF v_user_balance < p_credits THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient credits',
      'balance', v_user_balance,
      'required', p_credits
    );
  END IF;
  
  -- Deduct credits
  UPDATE user_credits
  SET 
    current_balance = current_balance - p_credits,
    consumed_this_month = consumed_this_month + p_credits,
    lifetime_consumed = lifetime_consumed + p_credits,
    updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING current_balance INTO v_new_balance;
  
  -- Record transaction
  INSERT INTO credit_transactions (
    user_id,
    moodboard_id,
    enhancement_task_id,
    transaction_type,
    credits_used,
    cost_usd,
    provider,
    description
  ) VALUES (
    p_user_id,
    p_moodboard_id,
    p_task_id,
    'deduction',
    p_credits,
    p_credits * 0.025,
    'nanobanan',
    'AI image enhancement'
  ) RETURNING id INTO v_transaction_id;
  
  -- Update platform pool
  UPDATE credit_pools
  SET 
    total_consumed = total_consumed + p_credits,
    available_balance = available_balance - p_credits,
    updated_at = NOW()
  WHERE provider = 'nanobanan';
  
  RETURN jsonb_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'new_balance', v_new_balance,
    'credits_deducted', p_credits
  );
END;
$$ LANGUAGE plpgsql;

-- Function to allocate monthly credits
CREATE OR REPLACE FUNCTION allocate_monthly_credits() RETURNS void AS $$
BEGIN
  -- Reset credits for all users at the start of the month
  UPDATE user_credits
  SET 
    current_balance = monthly_allowance,
    consumed_this_month = 0,
    last_reset_at = DATE_TRUNC('month', NOW()),
    updated_at = NOW()
  WHERE last_reset_at < DATE_TRUNC('month', NOW());
  
  -- Record allocation transactions
  INSERT INTO credit_transactions (
    user_id,
    transaction_type,
    credits_used,
    description
  )
  SELECT 
    user_id,
    'allocation',
    monthly_allowance,
    'Monthly credit allocation for ' || subscription_tier || ' tier'
  FROM user_credits
  WHERE last_reset_at = DATE_TRUNC('month', NOW())
    AND monthly_allowance > 0;
END;
$$ LANGUAGE plpgsql;

-- Function to update user subscription tier
CREATE OR REPLACE FUNCTION update_user_subscription(
  p_user_id UUID,
  p_tier VARCHAR(20)
) RETURNS void AS $$
DECLARE
  v_monthly_allowance INTEGER;
BEGIN
  -- Determine monthly allowance based on tier
  v_monthly_allowance := CASE p_tier
    WHEN 'free' THEN 0
    WHEN 'plus' THEN 10
    WHEN 'pro' THEN 25
    ELSE 0
  END;
  
  -- Upsert user credits record
  INSERT INTO user_credits (
    user_id,
    subscription_tier,
    monthly_allowance,
    current_balance,
    consumed_this_month,
    last_reset_at
  ) VALUES (
    p_user_id,
    p_tier,
    v_monthly_allowance,
    v_monthly_allowance,
    0,
    DATE_TRUNC('month', NOW())
  )
  ON CONFLICT (user_id) DO UPDATE
  SET 
    subscription_tier = p_tier,
    monthly_allowance = v_monthly_allowance,
    current_balance = CASE 
      WHEN user_credits.last_reset_at < DATE_TRUNC('month', NOW())
      THEN v_monthly_allowance
      ELSE GREATEST(user_credits.current_balance, v_monthly_allowance - user_credits.consumed_this_month)
    END,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE credit_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE enhancement_tasks ENABLE ROW LEVEL SECURITY;

-- Credit pools policies (admin only)
CREATE POLICY "Admin can manage credit pools" ON credit_pools
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE user_id = auth.uid()
      AND role_flags @> ARRAY['ADMIN']
    )
  );

-- User credits policies
CREATE POLICY "Users can view own credits" ON user_credits
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can manage user credits" ON user_credits
  FOR ALL USING (auth.uid() = 'service_role');

-- Credit transactions policies
CREATE POLICY "Users can view own transactions" ON credit_transactions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can create transactions" ON credit_transactions
  FOR INSERT WITH CHECK (auth.uid() = 'service_role' OR user_id = auth.uid());

-- Enhancement tasks policies
CREATE POLICY "Users can view own tasks" ON enhancement_tasks
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own tasks" ON enhancement_tasks
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "System can update tasks" ON enhancement_tasks
  FOR UPDATE USING (auth.uid() = 'service_role' OR user_id = auth.uid());

-- =====================================================
-- INITIAL DATA
-- =====================================================

-- Initialize NanoBanana credit pool
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
  1000,
  1000,
  0.025,
  100,
  500,
  'active'
) ON CONFLICT DO NOTHING;

-- Create trigger to auto-update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_credit_pools_updated_at BEFORE UPDATE ON credit_pools
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_credits_updated_at BEFORE UPDATE ON user_credits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_enhancement_tasks_updated_at BEFORE UPDATE ON enhancement_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SCHEDULED JOBS (Run these as cron jobs or scheduled functions)
-- =====================================================

-- Monthly credit allocation (run on the 1st of each month)
-- SELECT allocate_monthly_credits();

-- Auto-refill check (run daily)
-- UPDATE credit_pools
-- SET 
--   total_purchased = total_purchased + auto_refill_amount,
--   available_balance = available_balance + auto_refill_amount,
--   last_refill_at = NOW()
-- WHERE available_balance < auto_refill_threshold
--   AND status = 'active';
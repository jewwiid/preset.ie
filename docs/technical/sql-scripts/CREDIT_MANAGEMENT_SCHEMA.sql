-- =====================================================
-- CREDIT MANAGEMENT SYSTEM SCHEMA
-- =====================================================
-- Run this SQL in your Supabase SQL Editor to set up
-- the complete credit management system for NanoBanana integration

-- Credit pools and tracking
CREATE TABLE IF NOT EXISTS credit_pools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider VARCHAR(50) NOT NULL UNIQUE, -- 'nanobanan', 'fal_ai', etc.
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

-- Enhancement tasks table for async processing
CREATE TABLE IF NOT EXISTS enhancement_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  moodboard_id UUID REFERENCES moodboards(id) ON DELETE SET NULL,
  input_image_url TEXT NOT NULL,
  enhancement_type VARCHAR(50) NOT NULL,
  prompt TEXT NOT NULL,
  strength DECIMAL(3,2) DEFAULT 0.8,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  provider VARCHAR(50) DEFAULT 'nanobanan',
  api_task_id VARCHAR(100), -- External API task ID
  result_url TEXT,
  cost_usd DECIMAL(8,4),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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

-- System alerts log
CREATE TABLE IF NOT EXISTS system_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL,
  level VARCHAR(20) NOT NULL, -- 'info', 'warning', 'error', 'critical'
  message TEXT NOT NULL,
  metadata JSONB,
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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON user_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_enhancement_tasks_user_id ON enhancement_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_enhancement_tasks_status ON enhancement_tasks(status);
CREATE INDEX IF NOT EXISTS idx_enhancement_tasks_created_at ON enhancement_tasks(created_at);
CREATE INDEX IF NOT EXISTS idx_credit_pools_provider ON credit_pools(provider);
CREATE INDEX IF NOT EXISTS idx_api_providers_name ON api_providers(name);

-- RLS Policies
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE enhancement_tasks ENABLE ROW LEVEL SECURITY;

-- Users can view their own credits
CREATE POLICY "Users can view their own credits" ON user_credits
  FOR SELECT USING (auth.uid() = user_id);

-- Users can view their own transactions
CREATE POLICY "Users can view their own transactions" ON credit_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Users can view their own tasks
CREATE POLICY "Users can view their own tasks" ON enhancement_tasks
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own tasks
CREATE POLICY "Users can insert their own tasks" ON enhancement_tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own tasks
CREATE POLICY "Users can update their own tasks" ON enhancement_tasks
  FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to consume user credits
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

-- Function to consume platform credits
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

-- Function to refund user credits
CREATE OR REPLACE FUNCTION refund_user_credits(
  p_user_id UUID,
  p_credits INTEGER,
  p_enhancement_type VARCHAR(50)
) RETURNS VOID AS $$
BEGIN
  -- Add credits back to user
  UPDATE user_credits
  SET 
    current_balance = current_balance + p_credits,
    consumed_this_month = GREATEST(consumed_this_month - p_credits, 0),
    lifetime_consumed = GREATEST(lifetime_consumed - p_credits, 0),
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Log refund transaction
  INSERT INTO credit_transactions (
    user_id,
    transaction_type,
    credits_used,
    enhancement_type,
    status
  ) VALUES (
    p_user_id,
    'refund',
    p_credits,
    p_enhancement_type,
    'completed'
  );
END;
$$ LANGUAGE plpgsql;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_enhancement_tasks_updated_at
    BEFORE UPDATE ON enhancement_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- INITIAL DATA
-- =====================================================

-- Initialize default credit pool for NanoBanana (only if it doesn't exist)
INSERT INTO credit_pools (
  provider,
  total_purchased,
  available_balance,
  cost_per_credit,
  auto_refill_threshold,
  auto_refill_amount,
  status
)
SELECT 
  'nanobanan',
  1000, -- Start with 1000 credits
  1000,
  0.025, -- $0.025 per credit
  100,   -- Refill when below 100
  500,   -- Refill with 500 credits
  'active'
WHERE NOT EXISTS (
  SELECT 1 FROM credit_pools WHERE provider = 'nanobanan'
);

-- Initialize API provider configuration (only if it doesn't exist)
INSERT INTO api_providers (
  name,
  base_url,
  api_key_encrypted,
  cost_per_request,
  priority,
  is_active
)
SELECT 
  'nanobanan',
  'https://api.nanobananapi.ai',
  'ENCRYPTED_API_KEY_PLACEHOLDER', -- Replace with actual encrypted key
  0.025,
  1,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM api_providers WHERE name = 'nanobanan'
);

-- Create default alert configuration (only if it doesn't exist)
INSERT INTO system_alerts (type, level, message, metadata)
SELECT 
  'system_initialized', 
  'info', 
  'Credit management system initialized successfully', 
  '{"version": "1.0.0"}'
WHERE NOT EXISTS (
  SELECT 1 FROM system_alerts WHERE type = 'system_initialized'
);

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Verify tables were created
SELECT 'Tables created successfully' as status,
       count(*) as table_count
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('credit_pools', 'user_credits', 'credit_transactions', 'enhancement_tasks', 'api_providers', 'system_alerts');

-- Verify functions were created
SELECT 'Functions created successfully' as status,
       count(*) as function_count
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('consume_user_credits', 'consume_platform_credits', 'refund_user_credits');

-- Verify initial data
SELECT 'Initial data loaded' as status,
       provider,
       available_balance,
       cost_per_credit
FROM credit_pools 
WHERE provider = 'nanobanan';

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

SELECT '🎉 Credit Management System Setup Complete!' as message,
       'Run the Next.js app and test the /api/enhance-image endpoint' as next_step;

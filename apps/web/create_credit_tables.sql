-- Create user_credits table
CREATE TABLE IF NOT EXISTS user_credits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_balance INTEGER DEFAULT 0,
  monthly_allowance INTEGER DEFAULT 0,
  last_refreshed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create credit_transactions table
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type VARCHAR(10) CHECK (type IN ('credit', 'debit')),
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create platform_credits table
CREATE TABLE IF NOT EXISTS platform_credits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider VARCHAR(50) NOT NULL UNIQUE,
  available_credits INTEGER DEFAULT 0,
  last_recharged TIMESTAMP WITH TIME ZONE,
  last_used TIMESTAMP WITH TIME ZONE
);

-- Create enhancement_tasks table
CREATE TABLE IF NOT EXISTS enhancement_tasks (
  id VARCHAR(255) PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  moodboard_id UUID,
  input_url TEXT NOT NULL,
  enhancement_type VARCHAR(50),
  prompt TEXT,
  strength FLOAT DEFAULT 0.8,
  status VARCHAR(20) DEFAULT 'processing',
  nanobanana_task_id VARCHAR(255),
  result_url TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE enhancement_tasks ENABLE ROW LEVEL SECURITY;

-- Create policies for user_credits
CREATE POLICY "Users can view their own credits" ON user_credits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all credits" ON user_credits
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Create policies for credit_transactions
CREATE POLICY "Users can view their own transactions" ON credit_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all transactions" ON credit_transactions
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Create policies for platform_credits
CREATE POLICY "Service role can manage platform credits" ON platform_credits
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Create policies for enhancement_tasks
CREATE POLICY "Users can view their own tasks" ON enhancement_tasks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all tasks" ON enhancement_tasks
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');
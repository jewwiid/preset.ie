-- Enhancement Tasks Table Migration
-- This migration creates the enhancement_tasks table for async processing

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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_enhancement_tasks_user_id ON enhancement_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_enhancement_tasks_status ON enhancement_tasks(status);
CREATE INDEX IF NOT EXISTS idx_enhancement_tasks_created_at ON enhancement_tasks(created_at);
CREATE INDEX IF NOT EXISTS idx_enhancement_tasks_moodboard_id ON enhancement_tasks(moodboard_id);

-- RLS Policies
ALTER TABLE enhancement_tasks ENABLE ROW LEVEL SECURITY;

-- Users can view their own tasks
CREATE POLICY "Users can view their own tasks" ON enhancement_tasks
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own tasks
CREATE POLICY "Users can insert their own tasks" ON enhancement_tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own tasks (for status updates)
CREATE POLICY "Users can update their own tasks" ON enhancement_tasks
  FOR UPDATE USING (auth.uid() = user_id);

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

-- Add the refund function from AsyncTaskManager
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

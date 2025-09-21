-- Multi-Provider Support Migration
-- This migration adds support for multiple AI image generation providers

-- Update enhancement_tasks table to support multiple providers
ALTER TABLE enhancement_tasks 
ADD COLUMN IF NOT EXISTS provider VARCHAR(50) DEFAULT 'nanobanana',
ADD COLUMN IF NOT EXISTS provider_task_id VARCHAR(100), -- External provider task ID
ADD COLUMN IF NOT EXISTS provider_metadata JSONB DEFAULT '{}', -- Store provider-specific data
ADD COLUMN IF NOT EXISTS cost_credits INTEGER DEFAULT 1, -- Credits charged to user
ADD COLUMN IF NOT EXISTS provider_cost DECIMAL(8,4), -- Actual cost from provider
ADD COLUMN IF NOT EXISTS quality_score DECIMAL(3,2), -- Quality rating 0-1
ADD COLUMN IF NOT EXISTS processing_time_ms INTEGER; -- Processing time in milliseconds

-- Update credit_pools table to support multiple providers
INSERT INTO credit_pools (provider, total_purchased, total_consumed, available_balance, cost_per_credit, status)
VALUES 
  ('nanobanana', 0, 0, 0, 0.025, 'active'),
  ('seedream', 0, 0, 0, 0.05, 'active')
ON CONFLICT (provider) DO NOTHING;

-- Update api_providers table with both providers
INSERT INTO api_providers (name, base_url, api_key_encrypted, cost_per_request, rate_limit_per_minute, priority, is_active)
VALUES 
  ('nanobanana', 'https://api.nanobanana.ai', 'encrypted_key_placeholder', 0.025, 60, 1, true),
  ('seedream', 'https://api.wavespeed.ai', 'encrypted_key_placeholder', 0.05, 30, 2, true)
ON CONFLICT (name) DO NOTHING;

-- Create provider preferences table for user settings
CREATE TABLE IF NOT EXISTS user_provider_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  preferred_provider VARCHAR(50) DEFAULT 'nanobanana',
  auto_fallback BOOLEAN DEFAULT true,
  quality_priority BOOLEAN DEFAULT false, -- true = prefer quality, false = prefer speed
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create provider performance tracking table
CREATE TABLE IF NOT EXISTS provider_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider VARCHAR(50) NOT NULL,
  date DATE NOT NULL,
  total_requests INTEGER DEFAULT 0,
  successful_requests INTEGER DEFAULT 0,
  failed_requests INTEGER DEFAULT 0,
  average_processing_time_ms INTEGER DEFAULT 0,
  average_quality_score DECIMAL(3,2) DEFAULT 0,
  total_cost DECIMAL(10,4) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(provider, date)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_enhancement_tasks_provider ON enhancement_tasks(provider);
CREATE INDEX IF NOT EXISTS idx_enhancement_tasks_provider_task_id ON enhancement_tasks(provider_task_id);
CREATE INDEX IF NOT EXISTS idx_user_provider_preferences_user_id ON user_provider_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_provider_performance_provider_date ON provider_performance(provider, date);

-- RLS Policies for new tables
ALTER TABLE user_provider_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_performance ENABLE ROW LEVEL SECURITY;

-- Users can view and update their own provider preferences
CREATE POLICY "Users can view their own provider preferences" ON user_provider_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own provider preferences" ON user_provider_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own provider preferences" ON user_provider_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- Only admins can view provider performance
CREATE POLICY "Admins can view provider performance" ON provider_performance
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users_profile 
      WHERE user_id = auth.uid() 
      AND 'ADMIN' = ANY(role_flags)
    )
  );

-- Function to get user's preferred provider
CREATE OR REPLACE FUNCTION get_user_preferred_provider(p_user_id UUID)
RETURNS VARCHAR(50) AS $$
DECLARE
  preferred_provider VARCHAR(50);
BEGIN
  SELECT COALESCE(preferred_provider, 'nanobanana')
  INTO preferred_provider
  FROM user_provider_preferences
  WHERE user_id = p_user_id;
  
  RETURN COALESCE(preferred_provider, 'nanobanana');
END;
$$ LANGUAGE plpgsql;

-- Function to log provider performance
CREATE OR REPLACE FUNCTION log_provider_performance(
  p_provider VARCHAR(50),
  p_success BOOLEAN,
  p_processing_time_ms INTEGER,
  p_quality_score DECIMAL(3,2),
  p_cost DECIMAL(8,4)
) RETURNS VOID AS $$
BEGIN
  INSERT INTO provider_performance (
    provider,
    date,
    total_requests,
    successful_requests,
    failed_requests,
    average_processing_time_ms,
    average_quality_score,
    total_cost
  ) VALUES (
    p_provider,
    CURRENT_DATE,
    1,
    CASE WHEN p_success THEN 1 ELSE 0 END,
    CASE WHEN p_success THEN 0 ELSE 1 END,
    p_processing_time_ms,
    p_quality_score,
    p_cost
  )
  ON CONFLICT (provider, date) DO UPDATE SET
    total_requests = provider_performance.total_requests + 1,
    successful_requests = provider_performance.successful_requests + 
      CASE WHEN p_success THEN 1 ELSE 0 END,
    failed_requests = provider_performance.failed_requests + 
      CASE WHEN p_success THEN 0 ELSE 1 END,
    average_processing_time_ms = (
      (provider_performance.average_processing_time_ms * provider_performance.total_requests + p_processing_time_ms) 
      / (provider_performance.total_requests + 1)
    ),
    average_quality_score = (
      (provider_performance.average_quality_score * provider_performance.total_requests + p_quality_score) 
      / (provider_performance.total_requests + 1)
    ),
    total_cost = provider_performance.total_cost + p_cost;
END;
$$ LANGUAGE plpgsql;

-- Update the enhancement_tasks trigger to include provider tracking
CREATE OR REPLACE FUNCTION update_enhancement_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for user_provider_preferences
CREATE TRIGGER update_user_provider_preferences_updated_at
    BEFORE UPDATE ON user_provider_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_enhancement_tasks_updated_at();

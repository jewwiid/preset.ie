-- Create table for storing prompt analysis history
CREATE TABLE IF NOT EXISTS playground_prompt_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    original_prompt TEXT NOT NULL,
    style_applied VARCHAR(50),
    resolution VARCHAR(20),
    aspect_ratio VARCHAR(10),
    generation_mode VARCHAR(20),
    analysis_result JSONB NOT NULL,
    subscription_tier VARCHAR(20) DEFAULT 'free',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_playground_prompt_analyses_user_id 
ON playground_prompt_analyses(user_id);

CREATE INDEX IF NOT EXISTS idx_playground_prompt_analyses_created_at 
ON playground_prompt_analyses(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_playground_prompt_analyses_subscription_tier 
ON playground_prompt_analyses(subscription_tier);

-- Add RLS policies
ALTER TABLE playground_prompt_analyses ENABLE ROW LEVEL SECURITY;

-- Users can only see their own analyses
CREATE POLICY "Users can view their own prompt analyses" 
ON playground_prompt_analyses FOR SELECT 
USING (auth.uid() = user_id);

-- Users can only insert their own analyses
CREATE POLICY "Users can insert their own prompt analyses" 
ON playground_prompt_analyses FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can update their own analyses
CREATE POLICY "Users can update their own prompt analyses" 
ON playground_prompt_analyses FOR UPDATE 
USING (auth.uid() = user_id);

-- Users can delete their own analyses
CREATE POLICY "Users can delete their own prompt analyses" 
ON playground_prompt_analyses FOR DELETE 
USING (auth.uid() = user_id);

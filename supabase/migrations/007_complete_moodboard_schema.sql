-- Complete moodboard implementation schema
-- This migration adds all missing fields and tables for the complete moodboard system

-- Update moodboards table with missing fields
ALTER TABLE public.moodboards 
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS source_breakdown JSONB DEFAULT '{
  "pexels": 0,
  "user_uploads": 0,
  "ai_enhanced": 0,
  "ai_generated": 0
}',
ADD COLUMN IF NOT EXISTS enhancement_log JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS total_cost DECIMAL(10,4) DEFAULT 0,
ADD COLUMN IF NOT EXISTS generated_prompts TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS ai_provider VARCHAR(50);

-- Note: user_media table doesn't exist, skipping this update
-- These fields would be added to the media table if needed

-- Create moodboard_items table for better structure
CREATE TABLE IF NOT EXISTS public.moodboard_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  moodboard_id UUID REFERENCES public.moodboards(id) ON DELETE CASCADE,
  source VARCHAR(20) NOT NULL CHECK (source IN ('pexels', 'user-upload', 'ai-enhanced', 'ai-generated')),
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  attribution TEXT,
  width INTEGER,
  height INTEGER,
  palette TEXT[] DEFAULT '{}',
  blurhash VARCHAR(50),
  enhancement_prompt TEXT,
  original_image_id UUID,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create subscription_tiers table
CREATE TABLE IF NOT EXISTS public.subscription_tiers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(20) NOT NULL UNIQUE,
  display_name VARCHAR(50) NOT NULL,
  max_moodboards_per_day INTEGER NOT NULL DEFAULT 3,
  max_user_uploads INTEGER NOT NULL DEFAULT 0,
  max_ai_enhancements INTEGER NOT NULL DEFAULT 0,
  ai_cost_per_enhancement DECIMAL(10,4) DEFAULT 0.025,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default subscription tiers
INSERT INTO public.subscription_tiers (name, display_name, max_moodboards_per_day, max_user_uploads, max_ai_enhancements, ai_cost_per_enhancement) VALUES
('free', 'Free', 3, 0, 0, 0.025),
('plus', 'Plus', 10, 3, 2, 0.025),
('pro', 'Pro', 25, 6, 4, 0.025)
ON CONFLICT (name) DO NOTHING;

-- Add subscription_tier to users_profile
ALTER TABLE public.users_profile 
ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR(20) DEFAULT 'free' REFERENCES public.subscription_tiers(name);

-- Note: rate_limits table is created in a later migration (20250108_moodboards.sql)
-- Skipping rate_limits updates here to avoid dependency issues

-- Note: Storage bucket creation may need manual setup depending on Supabase version
-- Skipping bucket creation to avoid schema conflicts

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_moodboard_items_moodboard_id ON public.moodboard_items(moodboard_id);
CREATE INDEX IF NOT EXISTS idx_moodboard_items_position ON public.moodboard_items(moodboard_id, position);
CREATE INDEX IF NOT EXISTS idx_users_subscription_tier ON public.users_profile(subscription_tier);
-- Note: idx_rate_limits_user_action index is created with the rate_limits table in 20250108_moodboards.sql

-- RLS Policies for moodboard_items
ALTER TABLE public.moodboard_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view moodboard items" ON public.moodboard_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.moodboards 
      WHERE id = moodboard_items.moodboard_id 
      AND (is_public = true OR owner_user_id = auth.uid())
    )
  );

CREATE POLICY "Users can manage their own moodboard items" ON public.moodboard_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.moodboards 
      WHERE id = moodboard_items.moodboard_id 
      AND owner_user_id = auth.uid()
    )
  );

-- RLS Policies for subscription_tiers
ALTER TABLE public.subscription_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view subscription tiers" ON public.subscription_tiers
  FOR SELECT USING (true);

-- Note: Storage policies for moodboard-uploads bucket
-- These will need to be created after the bucket is manually set up

-- Update existing RLS policies for moodboards
DROP POLICY IF EXISTS "Public moodboards viewable" ON public.moodboards;
DROP POLICY IF EXISTS "Users view own moodboards" ON public.moodboards;
DROP POLICY IF EXISTS "Users create own moodboards" ON public.moodboards;
DROP POLICY IF EXISTS "Users update own moodboards" ON public.moodboards;
DROP POLICY IF EXISTS "Users delete own moodboards" ON public.moodboards;

CREATE POLICY "Public moodboards are viewable by everyone" ON public.moodboards
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view their own moodboards" ON public.moodboards
  FOR SELECT USING (auth.uid() = owner_user_id);

CREATE POLICY "Users can create their own moodboards" ON public.moodboards
  FOR INSERT WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Users can update their own moodboards" ON public.moodboards
  FOR UPDATE USING (auth.uid() = owner_user_id);

CREATE POLICY "Users can delete their own moodboards" ON public.moodboards
  FOR DELETE USING (auth.uid() = owner_user_id);


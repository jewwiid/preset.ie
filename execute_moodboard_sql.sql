-- Add missing columns to moodboards table
ALTER TABLE public.moodboards ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.moodboards ADD COLUMN IF NOT EXISTS vibe_summary TEXT;
ALTER TABLE public.moodboards ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.moodboards ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;
ALTER TABLE public.moodboards ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;
ALTER TABLE public.moodboards ADD COLUMN IF NOT EXISTS source_breakdown JSONB DEFAULT '{"pexels": 0, "user_upload": 0, "ai_enhanced": 0, "ai_generated": 0}'::jsonb;
ALTER TABLE public.moodboards ADD COLUMN IF NOT EXISTS enhancement_log JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.moodboards ADD COLUMN IF NOT EXISTS total_cost DECIMAL(10,4) DEFAULT 0;
ALTER TABLE public.moodboards ADD COLUMN IF NOT EXISTS ai_provider VARCHAR(50);
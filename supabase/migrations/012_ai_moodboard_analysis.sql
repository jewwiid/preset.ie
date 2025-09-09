-- Add AI analysis columns to moodboards table
-- This migration adds support for AI-generated vibe analysis and mood descriptors

-- Add vibe_summary column for AI-generated summary
ALTER TABLE public.moodboards 
ADD COLUMN IF NOT EXISTS vibe_summary TEXT;

-- Add mood_descriptors column for AI-generated mood words
ALTER TABLE public.moodboards 
ADD COLUMN IF NOT EXISTS mood_descriptors TEXT[] DEFAULT '{}';

-- Add tags column for searchability
ALTER TABLE public.moodboards 
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Add ai_analysis_status to track if AI analysis has been performed
ALTER TABLE public.moodboards 
ADD COLUMN IF NOT EXISTS ai_analysis_status VARCHAR(50) DEFAULT 'pending';

-- Add ai_analyzed_at timestamp
ALTER TABLE public.moodboards 
ADD COLUMN IF NOT EXISTS ai_analyzed_at TIMESTAMPTZ;

-- Create index for searching by tags
CREATE INDEX IF NOT EXISTS idx_moodboards_tags ON public.moodboards USING GIN (tags);

-- Create index for searching by mood descriptors
CREATE INDEX IF NOT EXISTS idx_moodboards_mood ON public.moodboards USING GIN (mood_descriptors);

-- Create index for vibe summary full text search
CREATE INDEX IF NOT EXISTS idx_moodboards_vibe_search ON public.moodboards USING GIN (to_tsvector('english', COALESCE(vibe_summary, '')));

-- Update existing moodboards to have pending AI analysis status
UPDATE public.moodboards 
SET ai_analysis_status = 'pending' 
WHERE ai_analysis_status IS NULL;

-- Comment on new columns
COMMENT ON COLUMN public.moodboards.mood_descriptors IS 'AI-generated mood descriptors like ethereal, bold, minimalist';
COMMENT ON COLUMN public.moodboards.tags IS 'Searchable tags for moodboard discovery';
COMMENT ON COLUMN public.moodboards.ai_analysis_status IS 'Status of AI analysis: pending, completed, failed';
COMMENT ON COLUMN public.moodboards.ai_analyzed_at IS 'Timestamp when AI analysis was performed';
-- Fix Missing vibe_ids Column in moodboards table
-- This adds the missing vibe_ids column to the moodboards table

-- Add vibe_ids column to moodboards table if it doesn't exist
ALTER TABLE moodboards 
ADD COLUMN IF NOT EXISTS vibe_ids UUID[] DEFAULT '{}';

-- Add vibe_summary column if it doesn't exist
ALTER TABLE moodboards 
ADD COLUMN IF NOT EXISTS vibe_summary TEXT;

-- Add mood_descriptors column if it doesn't exist
ALTER TABLE moodboards 
ADD COLUMN IF NOT EXISTS mood_descriptors TEXT[] DEFAULT '{}';

-- Add tags column if it doesn't exist
ALTER TABLE moodboards 
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Add ai_analysis_status column if it doesn't exist
ALTER TABLE moodboards 
ADD COLUMN IF NOT EXISTS ai_analysis_status VARCHAR(50) DEFAULT 'pending';

-- Add ai_analyzed_at column if it doesn't exist
ALTER TABLE moodboards 
ADD COLUMN IF NOT EXISTS ai_analyzed_at TIMESTAMPTZ;

-- Add is_public column if it doesn't exist
ALTER TABLE moodboards 
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;

-- Add source_breakdown column if it doesn't exist
ALTER TABLE moodboards 
ADD COLUMN IF NOT EXISTS source_breakdown JSONB DEFAULT '{
  "pexels": 0,
  "user_uploads": 0,
  "ai_enhanced": 0,
  "ai_generated": 0
}';

-- Add enhancement_log column if it doesn't exist
ALTER TABLE moodboards 
ADD COLUMN IF NOT EXISTS enhancement_log JSONB DEFAULT '[]';

-- Add total_cost column if it doesn't exist
ALTER TABLE moodboards 
ADD COLUMN IF NOT EXISTS total_cost DECIMAL(10,4) DEFAULT 0;

-- Add generated_prompts column if it doesn't exist
ALTER TABLE moodboards 
ADD COLUMN IF NOT EXISTS generated_prompts TEXT[] DEFAULT '{}';

-- Add ai_provider column if it doesn't exist
ALTER TABLE moodboards 
ADD COLUMN IF NOT EXISTS ai_provider VARCHAR(50);

-- Create indexes for moodboards table
CREATE INDEX IF NOT EXISTS idx_moodboards_vibe_ids ON moodboards USING GIN(vibe_ids);
CREATE INDEX IF NOT EXISTS idx_moodboards_tags ON moodboards USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_moodboards_mood ON moodboards USING GIN(mood_descriptors);
CREATE INDEX IF NOT EXISTS idx_moodboards_vibe_search ON moodboards USING GIN(to_tsvector('english', COALESCE(vibe_summary, '')));

-- Add constraint to limit vibes per moodboard (only if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_moodboard_vibe_limit' 
        AND table_name = 'moodboards'
    ) THEN
        ALTER TABLE moodboards 
        ADD CONSTRAINT check_moodboard_vibe_limit 
        CHECK (array_length(vibe_ids, 1) IS NULL OR array_length(vibe_ids, 1) <= 5);
    END IF;
END $$;

-- Verify the columns were added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'moodboards' 
AND column_name IN ('vibe_ids', 'vibe_summary', 'mood_descriptors', 'tags')
ORDER BY column_name;

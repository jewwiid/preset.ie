-- Create user_media table for tracking user uploads
-- This table is used by avatar, banner, and moodboard upload functionality

CREATE TABLE IF NOT EXISTS public.user_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name VARCHAR(255),
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),
  width INTEGER,
  height INTEGER,
  blurhash VARCHAR(50),
  palette TEXT[],
  upload_purpose VARCHAR(50) DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for faster lookups by user
CREATE INDEX IF NOT EXISTS idx_user_media_user_id ON public.user_media(user_id);
CREATE INDEX IF NOT EXISTS idx_user_media_purpose ON public.user_media(user_id, upload_purpose);

-- Enable RLS
ALTER TABLE public.user_media ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_media
-- Users can view their own media
CREATE POLICY "Users can view their own media" ON public.user_media
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own media
CREATE POLICY "Users can insert their own media" ON public.user_media
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own media
CREATE POLICY "Users can update their own media" ON public.user_media
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own media
CREATE POLICY "Users can delete their own media" ON public.user_media
  FOR DELETE USING (auth.uid() = user_id);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_media_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_media_updated_at
  BEFORE UPDATE ON public.user_media
  FOR EACH ROW
  EXECUTE FUNCTION update_user_media_updated_at();


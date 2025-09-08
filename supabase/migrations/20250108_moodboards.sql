-- Create moodboards table
CREATE TABLE IF NOT EXISTS public.moodboards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    gig_id UUID REFERENCES public.gigs(id) ON DELETE CASCADE,
    owner_user_id UUID REFERENCES public.users_profile(id) ON DELETE CASCADE,
    title TEXT,
    description TEXT,
    vibe_summary TEXT,
    palette JSONB DEFAULT '[]'::jsonb,
    items JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_public BOOLEAN DEFAULT false,
    view_count INTEGER DEFAULT 0
);

-- Create user_media table for uploaded images
CREATE TABLE IF NOT EXISTS public.user_media (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users_profile(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    width INTEGER,
    height INTEGER,
    blurhash TEXT,
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    used_in_moodboards INTEGER DEFAULT 0
);

-- Create rate_limits table for API rate limiting
CREATE TABLE IF NOT EXISTS public.rate_limits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users_profile(id) ON DELETE CASCADE,
    service TEXT NOT NULL, -- 'pexels', 'nano_banana', 'upload'
    count INTEGER DEFAULT 0,
    window_start TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, service)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_moodboards_gig_id ON public.moodboards(gig_id);
CREATE INDEX IF NOT EXISTS idx_moodboards_owner_user_id ON public.moodboards(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_user_media_user_id ON public.user_media(user_id);
CREATE INDEX IF NOT EXISTS idx_rate_limits_user_service ON public.rate_limits(user_id, service);

-- RLS Policies for moodboards
ALTER TABLE public.moodboards ENABLE ROW LEVEL SECURITY;

-- Anyone can view public moodboards
CREATE POLICY "Public moodboards are viewable by everyone" ON public.moodboards
    FOR SELECT USING (is_public = true);

-- Owners can view their own moodboards
CREATE POLICY "Users can view own moodboards" ON public.moodboards
    FOR SELECT USING (auth.uid()::text = owner_user_id::text);

-- Owners can create moodboards
CREATE POLICY "Users can create own moodboards" ON public.moodboards
    FOR INSERT WITH CHECK (auth.uid()::text = owner_user_id::text);

-- Owners can update their moodboards
CREATE POLICY "Users can update own moodboards" ON public.moodboards
    FOR UPDATE USING (auth.uid()::text = owner_user_id::text);

-- Owners can delete their moodboards
CREATE POLICY "Users can delete own moodboards" ON public.moodboards
    FOR DELETE USING (auth.uid()::text = owner_user_id::text);

-- RLS Policies for user_media
ALTER TABLE public.user_media ENABLE ROW LEVEL SECURITY;

-- Users can view their own media
CREATE POLICY "Users can view own media" ON public.user_media
    FOR SELECT USING (auth.uid()::text = user_id::text);

-- Users can upload media
CREATE POLICY "Users can upload media" ON public.user_media
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Users can update their media
CREATE POLICY "Users can update own media" ON public.user_media
    FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Users can delete their media
CREATE POLICY "Users can delete own media" ON public.user_media
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- RLS Policies for rate_limits
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Users can view their own rate limits
CREATE POLICY "Users can view own rate limits" ON public.rate_limits
    FOR SELECT USING (auth.uid()::text = user_id::text);

-- Users can create their rate limit records
CREATE POLICY "Users can create rate limits" ON public.rate_limits
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Users can update their rate limits
CREATE POLICY "Users can update own rate limits" ON public.rate_limits
    FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to update updated_at on moodboards
CREATE TRIGGER update_moodboards_updated_at
    BEFORE UPDATE ON public.moodboards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
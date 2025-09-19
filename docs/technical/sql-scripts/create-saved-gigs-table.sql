-- Create saved_gigs table for user bookmarking functionality
-- This table allows users to save/bookmark gigs they're interested in

-- Create the saved_gigs table
CREATE TABLE IF NOT EXISTS public.saved_gigs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gig_id UUID NOT NULL REFERENCES public.gigs(id) ON DELETE CASCADE,
    saved_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure a user can't save the same gig twice
    UNIQUE(user_id, gig_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_saved_gigs_user_id ON public.saved_gigs(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_gigs_gig_id ON public.saved_gigs(gig_id);
CREATE INDEX IF NOT EXISTS idx_saved_gigs_saved_at ON public.saved_gigs(saved_at);

-- Enable Row Level Security (RLS)
ALTER TABLE public.saved_gigs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see their own saved gigs
CREATE POLICY "Users can view their own saved gigs" ON public.saved_gigs
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own saved gigs
CREATE POLICY "Users can save gigs" ON public.saved_gigs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own saved gigs
CREATE POLICY "Users can unsave gigs" ON public.saved_gigs
    FOR DELETE USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT SELECT, INSERT, DELETE ON public.saved_gigs TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE public.saved_gigs IS 'Table for storing user-saved/bookmarked gigs';
COMMENT ON COLUMN public.saved_gigs.user_id IS 'ID of the user who saved the gig';
COMMENT ON COLUMN public.saved_gigs.gig_id IS 'ID of the gig that was saved';
COMMENT ON COLUMN public.saved_gigs.saved_at IS 'When the gig was saved';

-- Verify table was created
SELECT 'saved_gigs table created successfully!' as status;

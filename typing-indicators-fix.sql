-- Fix: Create typing_indicators table
-- Run this directly in Supabase SQL Editor or via npx supabase db execute

-- Create typing indicators table for real-time typing status
CREATE TABLE IF NOT EXISTS typing_indicators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
    gig_id UUID NOT NULL REFERENCES gigs(id) ON DELETE CASCADE,
    is_typing BOOLEAN DEFAULT false,
    last_activity TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure only one typing indicator per user per conversation
    UNIQUE(conversation_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_typing_indicators_conversation ON typing_indicators(conversation_id);
CREATE INDEX IF NOT EXISTS idx_typing_indicators_activity ON typing_indicators(last_activity);

-- Enable Row Level Security on typing_indicators
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view typing indicators in their conversations" ON typing_indicators;
DROP POLICY IF EXISTS "Users can manage their own typing indicators" ON typing_indicators;

-- RLS Policies for typing_indicators
CREATE POLICY "Users can view typing indicators in their conversations" ON typing_indicators
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM messages m 
            WHERE m.conversation_id = typing_indicators.conversation_id 
            AND (
                m.from_user_id = (SELECT id FROM users_profile WHERE user_id = auth.uid())
                OR m.to_user_id = (SELECT id FROM users_profile WHERE user_id = auth.uid())
            )
        )
    );

CREATE POLICY "Users can manage their own typing indicators" ON typing_indicators
    FOR ALL USING (
        user_id = (SELECT id FROM users_profile WHERE user_id = auth.uid())
    );

-- Function to clean up old typing indicators (older than 10 seconds)
CREATE OR REPLACE FUNCTION cleanup_old_typing_indicators()
RETURNS void AS $$
BEGIN
    DELETE FROM typing_indicators 
    WHERE last_activity < NOW() - INTERVAL '10 seconds';
END;
$$ LANGUAGE plpgsql;
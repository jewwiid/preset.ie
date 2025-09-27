-- Safe messaging tables creation - handles existing tables
-- Run this in your Supabase SQL Editor

-- First, let's see what columns exist in the current messages table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'messages'
ORDER BY ordinal_position;

-- Create typing_indicators table (this should be new)
CREATE TABLE IF NOT EXISTS typing_indicators (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    is_typing BOOLEAN DEFAULT true,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(conversation_id, user_id)
);

-- Create conversations table (this should be new)
CREATE TABLE IF NOT EXISTS conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Create conversation_participants table (this should be new)
CREATE TABLE IF NOT EXISTS conversation_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(conversation_id, user_id)
);

-- For the existing messages table, we need to be careful
-- Let's add missing columns only if they don't exist

-- Add conversation_id column to messages if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'messages' 
        AND column_name = 'conversation_id'
    ) THEN
        ALTER TABLE messages ADD COLUMN conversation_id UUID;
    END IF;
END $$;

-- Add message_type column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'messages' 
        AND column_name = 'message_type'
    ) THEN
        ALTER TABLE messages ADD COLUMN message_type VARCHAR(50) DEFAULT 'text';
    END IF;
END $$;

-- Add status column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'messages' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE messages ADD COLUMN status VARCHAR(20) DEFAULT 'sent';
    END IF;
END $$;

-- Add read_at column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'messages' 
        AND column_name = 'read_at'
    ) THEN
        ALTER TABLE messages ADD COLUMN read_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Add delivered_at column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'messages' 
        AND column_name = 'delivered_at'
    ) THEN
        ALTER TABLE messages ADD COLUMN delivered_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Add updated_at column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'messages' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE messages ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Create indexes for better performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_typing_indicators_conversation ON typing_indicators(conversation_id);
CREATE INDEX IF NOT EXISTS idx_typing_indicators_user ON typing_indicators(user_id);
CREATE INDEX IF NOT EXISTS idx_typing_indicators_activity ON typing_indicators(last_activity);

CREATE INDEX IF NOT EXISTS idx_conversations_created_by ON conversations(created_by);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_at);

CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user ON conversation_participants(user_id);

-- For messages table, only create indexes that don't exist
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_from_user ON messages(from_user_id);
CREATE INDEX IF NOT EXISTS idx_messages_to_user ON messages(to_user_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- Enable Row Level Security (only for new tables, messages might already have RLS)
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;

-- Check if messages table already has RLS enabled
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'messages' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Create RLS policies for typing_indicators (drop if exists first)
DROP POLICY IF EXISTS "Users can view typing indicators for their conversations" ON typing_indicators;
CREATE POLICY "Users can view typing indicators for their conversations" ON typing_indicators
    FOR SELECT USING (
        conversation_id IN (
            SELECT conversation_id FROM conversation_participants 
            WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can manage their own typing indicators" ON typing_indicators;
CREATE POLICY "Users can manage their own typing indicators" ON typing_indicators
    FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for conversations
DROP POLICY IF EXISTS "Users can view conversations they participate in" ON conversations;
CREATE POLICY "Users can view conversations they participate in" ON conversations
    FOR SELECT USING (
        id IN (
            SELECT conversation_id FROM conversation_participants 
            WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
CREATE POLICY "Users can create conversations" ON conversations
    FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Create RLS policies for conversation_participants
DROP POLICY IF EXISTS "Users can view participants in their conversations" ON conversation_participants;
CREATE POLICY "Users can view participants in their conversations" ON conversation_participants
    FOR SELECT USING (
        conversation_id IN (
            SELECT conversation_id FROM conversation_participants 
            WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can join conversations" ON conversation_participants;
CREATE POLICY "Users can join conversations" ON conversation_participants
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for messages (only if they don't exist)
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
CREATE POLICY "Users can view messages in their conversations" ON messages
    FOR SELECT USING (
        conversation_id IN (
            SELECT conversation_id FROM conversation_participants 
            WHERE user_id = auth.uid()
        )
        OR auth.uid() = from_user_id 
        OR auth.uid() = to_user_id
    );

DROP POLICY IF EXISTS "Users can insert messages" ON messages;
CREATE POLICY "Users can insert messages" ON messages
    FOR INSERT WITH CHECK (auth.uid() = from_user_id);

DROP POLICY IF EXISTS "Users can update their own messages" ON messages;
CREATE POLICY "Users can update their own messages" ON messages
    FOR UPDATE USING (auth.uid() = from_user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers (only if they don't exist)
DROP TRIGGER IF EXISTS update_typing_indicators_updated_at ON typing_indicators;
CREATE TRIGGER update_typing_indicators_updated_at 
    BEFORE UPDATE ON typing_indicators 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;
CREATE TRIGGER update_conversations_updated_at 
    BEFORE UPDATE ON conversations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_conversation_participants_updated_at ON conversation_participants;
CREATE TRIGGER update_conversation_participants_updated_at 
    BEFORE UPDATE ON conversation_participants 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_messages_updated_at ON messages;
CREATE TRIGGER update_messages_updated_at 
    BEFORE UPDATE ON messages 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to mark conversation as delivered
CREATE OR REPLACE FUNCTION mark_conversation_delivered(conversation_uuid UUID, user_uuid UUID)
RETURNS void AS $$
BEGIN
    UPDATE messages 
    SET delivered_at = NOW(), status = 'delivered'
    WHERE conversation_id = conversation_uuid 
    AND to_user_id = user_uuid 
    AND delivered_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update conversation last_message_at
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations 
    SET last_message_at = NEW.created_at,
        updated_at = NOW()
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to update conversation when new message is inserted (only if it doesn't exist)
DROP TRIGGER IF EXISTS update_conversation_on_new_message ON messages;
CREATE TRIGGER update_conversation_on_new_message 
    AFTER INSERT ON messages 
    FOR EACH ROW EXECUTE FUNCTION update_conversation_last_message();

-- Final check: show all tables that were created/updated
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('messages', 'typing_indicators', 'conversations', 'conversation_participants')
ORDER BY tablename;

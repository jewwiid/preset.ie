-- Fix Missing conversation_id Column in messages table
-- This adds the missing conversation_id column and related messaging features

-- Add conversation_id column to messages table if it doesn't exist
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS conversation_id UUID;

-- Add updated_at column if it doesn't exist
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add status column if it doesn't exist
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'sent';

-- Add read_at column if it doesn't exist
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

-- Create function to generate conversation_id based on gig_id and participants
CREATE OR REPLACE FUNCTION generate_conversation_id(gig_uuid UUID, user1_uuid UUID, user2_uuid UUID)
RETURNS UUID AS $$
BEGIN
  -- Create a deterministic UUID based on gig_id and sorted user IDs
  -- This ensures the same conversation_id for the same participants in the same gig
  RETURN uuid_generate_v5(
    '6ba7b810-9dad-11d1-80b4-00c04fd430c8'::uuid,
    gig_uuid::text || '|' || LEAST(user1_uuid, user2_uuid)::text || '|' || GREATEST(user1_uuid, user2_uuid)::text
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update existing messages to have conversation_id if null
UPDATE messages 
SET conversation_id = generate_conversation_id(gig_id, from_user_id, to_user_id)
WHERE conversation_id IS NULL;

-- Create typing indicators table for real-time typing status
CREATE TABLE IF NOT EXISTS typing_indicators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
    gig_id UUID NOT NULL REFERENCES gigs(id) ON DELETE CASCADE,
    last_activity TIMESTAMPTZ DEFAULT NOW(),
    is_typing BOOLEAN DEFAULT false,
    
    -- Ensure only one typing indicator per user per conversation
    UNIQUE(conversation_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created_at ON messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);
CREATE INDEX IF NOT EXISTS idx_messages_read_at ON messages(read_at) WHERE read_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_typing_indicators_conversation ON typing_indicators(conversation_id);
CREATE INDEX IF NOT EXISTS idx_typing_indicators_activity ON typing_indicators(last_activity);

-- Create trigger to automatically update conversation_id for new messages
CREATE OR REPLACE FUNCTION set_conversation_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Set conversation_id if not provided
  IF NEW.conversation_id IS NULL THEN
    NEW.conversation_id := generate_conversation_id(NEW.gig_id, NEW.from_user_id, NEW.to_user_id);
  END IF;
  
  -- Set updated_at
  NEW.updated_at := NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic conversation_id setting
DROP TRIGGER IF EXISTS set_messages_conversation_id ON messages;
CREATE TRIGGER set_messages_conversation_id
    BEFORE INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION set_conversation_id();

-- Create trigger for updating updated_at
DROP TRIGGER IF EXISTS update_messages_updated_at ON messages;
CREATE TRIGGER update_messages_updated_at
    BEFORE UPDATE ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Verify the columns were added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'messages' 
AND column_name IN ('conversation_id', 'updated_at', 'status', 'read_at')
ORDER BY column_name;

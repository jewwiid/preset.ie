-- Messaging System Real-time Enhancements
-- This migration adds support for real-time messaging, typing indicators, and message status tracking

-- Create message status enum
CREATE TYPE message_status AS ENUM ('sent', 'delivered', 'read');

-- Add new columns to messages table
ALTER TABLE messages 
ADD COLUMN conversation_id UUID,
ADD COLUMN updated_at TIMESTAMPTZ,
ADD COLUMN status message_status DEFAULT 'sent';

-- Create function to generate conversation_id based on gig_id and participants
CREATE OR REPLACE FUNCTION generate_conversation_id(gig_uuid UUID, user1_uuid UUID, user2_uuid UUID)
RETURNS UUID AS $$
BEGIN
  -- Create deterministic conversation ID based on gig and sorted participant UUIDs
  -- This ensures the same conversation ID regardless of message direction
  RETURN uuid_generate_v5(
    gig_uuid,
    CASE 
      WHEN user1_uuid < user2_uuid THEN user1_uuid::text || user2_uuid::text
      ELSE user2_uuid::text || user1_uuid::text
    END
  );
END;
$$ LANGUAGE plpgsql;

-- Update existing messages to have conversation_id
UPDATE messages 
SET conversation_id = generate_conversation_id(gig_id, from_user_id, to_user_id)
WHERE conversation_id IS NULL;

-- Make conversation_id NOT NULL after populating it
ALTER TABLE messages ALTER COLUMN conversation_id SET NOT NULL;

-- Create typing indicators table for real-time typing status
CREATE TABLE typing_indicators (
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
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_conversation_created_at ON messages(conversation_id, created_at);
CREATE INDEX idx_messages_status ON messages(status);
CREATE INDEX idx_typing_indicators_conversation ON typing_indicators(conversation_id);
CREATE INDEX idx_typing_indicators_activity ON typing_indicators(last_activity);

-- Enable Row Level Security on typing_indicators
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;

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

-- Function to automatically update message status to 'delivered' when read_at is set
CREATE OR REPLACE FUNCTION update_message_status()
RETURNS TRIGGER AS $$
BEGIN
    -- If read_at is being set and status is not already 'read', update to 'read'
    IF NEW.read_at IS NOT NULL AND OLD.read_at IS NULL THEN
        NEW.status = 'read';
    END IF;
    
    -- Update updated_at timestamp
    NEW.updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update message status and timestamp
CREATE TRIGGER trigger_update_message_status
    BEFORE UPDATE ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_message_status();

-- Function to clean up old typing indicators (older than 10 seconds)
CREATE OR REPLACE FUNCTION cleanup_old_typing_indicators()
RETURNS void AS $$
BEGIN
    DELETE FROM typing_indicators 
    WHERE last_activity < NOW() - INTERVAL '10 seconds';
END;
$$ LANGUAGE plpgsql;

-- Create a function to set message status to delivered for a conversation
CREATE OR REPLACE FUNCTION mark_conversation_delivered(conversation_uuid UUID, user_uuid UUID)
RETURNS void AS $$
BEGIN
    UPDATE messages 
    SET status = 'delivered'
    WHERE conversation_id = conversation_uuid 
    AND to_user_id = user_uuid
    AND status = 'sent';
END;
$$ LANGUAGE plpgsql;

-- Enable real-time replication for messages table
-- Note: This needs to be done via Supabase dashboard or CLI as it requires admin privileges
-- ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Enable real-time replication for typing_indicators table  
-- Note: This needs to be done via Supabase dashboard or CLI as it requires admin privileges
-- ALTER PUBLICATION supabase_realtime ADD TABLE typing_indicators;

-- Insert a test typing indicator cleanup job (this would normally be handled by a cron job)
-- For now, applications should periodically call cleanup_old_typing_indicators()

-- Comment with instructions for manual Supabase dashboard setup:
/*
MANUAL SETUP REQUIRED IN SUPABASE DASHBOARD:

1. Go to Database > Replication in Supabase Dashboard
2. Enable replication for 'messages' table
3. Enable replication for 'typing_indicators' table

OR via Supabase CLI:
supabase sql -f - <<EOF
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE typing_indicators;
EOF
*/
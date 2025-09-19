-- Enable real-time replication for messaging tables
-- This script enables real-time subscriptions for the messaging system

-- Enable replication for messages table (core messaging)
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Enable replication for typing indicators (real-time typing status)
ALTER PUBLICATION supabase_realtime ADD TABLE typing_indicators;

-- Enable replication for user blocks (optional, for real-time blocking updates)
ALTER PUBLICATION supabase_realtime ADD TABLE user_blocks;

-- Enable replication for moderation queue (for admin real-time updates)
ALTER PUBLICATION supabase_realtime ADD TABLE moderation_queue;

-- Verify the tables are added to replication
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename IN ('messages', 'typing_indicators', 'user_blocks', 'moderation_queue')
ORDER BY tablename;

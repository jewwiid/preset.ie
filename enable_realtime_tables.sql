-- Enable Realtime for tables used in the messaging system
-- Run this AFTER creating the messaging tables with create_messaging_tables_safe.sql

-- First, check which tables exist
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('messages', 'typing_indicators', 'conversations', 'conversation_participants', 'users_profile');

-- Enable realtime for the messaging tables that now exist
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE typing_indicators;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE conversation_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE users_profile;

-- Verify which tables are currently enabled for realtime
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;

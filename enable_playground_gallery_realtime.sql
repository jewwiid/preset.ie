-- Enable Realtime for playground_gallery table
-- Run this AFTER creating the playground_gallery table with create_playground_gallery_table.sql

-- First, check if the table exists
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'playground_gallery';

-- Enable realtime for the playground_gallery table
ALTER PUBLICATION supabase_realtime ADD TABLE playground_gallery;

-- Verify which tables are currently enabled for realtime
SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
AND tablename = 'playground_gallery'
ORDER BY tablename;

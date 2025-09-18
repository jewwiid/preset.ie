-- Cleanup script for equipment requests migration
-- Run this if you need to start fresh

-- Drop policies first
DROP POLICY IF EXISTS "Users can view active equipment requests" ON equipment_requests;
DROP POLICY IF EXISTS "Users can view their own equipment requests" ON equipment_requests;
DROP POLICY IF EXISTS "Users can create equipment requests" ON equipment_requests;
DROP POLICY IF EXISTS "Users can update their own equipment requests" ON equipment_requests;
DROP POLICY IF EXISTS "Users can delete their own equipment requests" ON equipment_requests;

DROP POLICY IF EXISTS "Users can view responses to their requests" ON request_responses;
DROP POLICY IF EXISTS "Users can view their own responses" ON request_responses;
DROP POLICY IF EXISTS "Users can create responses to requests" ON request_responses;
DROP POLICY IF EXISTS "Users can update their own responses" ON request_responses;
DROP POLICY IF EXISTS "Request owners can update responses to their requests" ON request_responses;

DROP POLICY IF EXISTS "Users can view conversations they're part of" ON request_conversations;
DROP POLICY IF EXISTS "Users can create conversations for their requests" ON request_conversations;
DROP POLICY IF EXISTS "Users can update conversations they're part of" ON request_conversations;

-- Drop triggers
DROP TRIGGER IF EXISTS update_equipment_requests_updated_at ON equipment_requests;
DROP TRIGGER IF EXISTS update_request_responses_updated_at ON request_responses;
DROP TRIGGER IF EXISTS update_request_conversations_updated_at ON request_conversations;

-- Drop functions
DROP FUNCTION IF EXISTS expire_equipment_requests();
DROP FUNCTION IF EXISTS get_request_stats(UUID);

-- Drop tables (in reverse order due to foreign keys)
DROP TABLE IF EXISTS request_conversations CASCADE;
DROP TABLE IF EXISTS request_responses CASCADE;
DROP TABLE IF EXISTS equipment_requests CASCADE;

-- Cleanup complete
SELECT 'Equipment requests tables and policies cleaned up successfully' AS status;

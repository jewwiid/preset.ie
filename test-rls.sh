#!/bin/bash

# Test script to check RLS policy status
echo "🔍 Testing RLS policies for playground_gallery table..."

# Set environment variables
export $(grep -v '^#' apps/web/.env.local | xargs)

# Use psql to check RLS status
psql $SUPABASE_DB_URL -c "
-- Check if RLS is enabled
SELECT relname, relrowsecurity
FROM pg_class
WHERE relname = 'playground_gallery';

-- Check existing RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'playground_gallery';

-- Check if user can access data
SELECT COUNT(*) as total_items
FROM playground_gallery;

-- Check specific user's data
SELECT COUNT(*) as emmas_items
FROM playground_gallery
WHERE user_id = 'a7138172-d10e-417a-acbf-e346616ea70c';
"
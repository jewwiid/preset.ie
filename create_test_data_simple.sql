-- Simple test to create marketplace messaging data
-- This will create test data step by step

-- First, let's check if we have valid user IDs
SELECT id, display_name, handle FROM users_profile LIMIT 5;

-- Check if we have a valid listing ID
SELECT id, title, owner_id FROM listings WHERE id = '11282a83-c665-4a55-bdf5-67c733ab8bc6';

-- If the listing exists, create test data
INSERT INTO offers (
  id,
  listing_id,
  offerer_id,
  owner_id,
  offer_amount_cents,
  message,
  status,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '11282a83-c665-4a55-bdf5-67c733ab8bc6',
  '2c0f7099-7002-4e78-8277-e632b402df45', -- Jude Okun (offerer)
  'd6953adb-9c93-4d17-92f5-268990b6650f', -- YJ Nation (owner)
  1000,
  'Test offer for messaging',
  'accepted',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Create test message
INSERT INTO messages (
  id,
  gig_id,
  listing_id,
  from_user_id,
  to_user_id,
  body,
  context_type,
  created_at
) VALUES (
  gen_random_uuid(),
  NULL, -- No gig_id needed for marketplace messages
  '11282a83-c665-4a55-bdf5-67c733ab8bc6',
  '2c0f7099-7002-4e78-8277-e632b402df45', -- Jude Okun (sender)
  'd6953adb-9c93-4d17-92f5-268990b6650f', -- YJ Nation (recipient)
  'Test message after offer acceptance',
  'marketplace',
  NOW()
) ON CONFLICT DO NOTHING;

-- Verify the data was created
SELECT 'Offers:' as type, COUNT(*) as count FROM offers;
SELECT 'Messages:' as type, COUNT(*) as count FROM messages;
SELECT 'Marketplace Messages:' as type, COUNT(*) as count FROM messages WHERE context_type = 'marketplace';

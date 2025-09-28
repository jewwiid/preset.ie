-- Temporarily disable RLS to test the messaging flow
-- This is for testing purposes only

-- Disable RLS on messages table temporarily
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;

-- Disable RLS on offers table temporarily  
ALTER TABLE offers DISABLE ROW LEVEL SECURITY;

-- Create a gig with the listing ID to satisfy foreign key constraint
INSERT INTO gigs (
  id,
  title,
  description,
  owner_user_id,
  status,
  created_at,
  updated_at
) VALUES (
  '11282a83-c665-4a55-bdf5-67c733ab8bc6',
  'Canon (peak design Everyday Backpack)',
  'Marketplace listing converted to gig for messaging',
  'd6953adb-9c93-4d17-92f5-268990b6650f', -- YJ Nation (owner)
  'active',
  NOW(),
  NOW()
);

-- Test insert an offer
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
);

-- Test insert a message
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
  '11282a83-c665-4a55-bdf5-67c733ab8bc6', -- Use listing_id as gig_id for marketplace
  '11282a83-c665-4a55-bdf5-67c733ab8bc6',
  '2c0f7099-7002-4e78-8277-e632b402df45', -- Jude Okun (sender)
  'd6953adb-9c93-4d17-92f5-268990b6650f', -- YJ Nation (recipient)
  'Test message after offer acceptance',
  'marketplace',
  NOW()
);

-- Re-enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;

-- Quick fix: Run the RLS policy fix first
-- This allows the service role to work with the messaging system

-- Drop existing policies
DROP POLICY IF EXISTS "messages_marketplace_read" ON messages;
DROP POLICY IF EXISTS "messages_marketplace_insert" ON messages;

-- Create simpler policies that work with service role
CREATE POLICY "messages_marketplace_read" ON messages
FOR SELECT USING (
  -- Allow service role to read all messages
  auth.role() = 'service_role' OR
  -- Allow users to read their own messages
  (context_type = 'marketplace' AND (
    from_user_id = (SELECT id FROM users_profile WHERE user_id = auth.uid()) OR
    to_user_id = (SELECT id FROM users_profile WHERE user_id = auth.uid())
  ))
);

CREATE POLICY "messages_marketplace_insert" ON messages
FOR INSERT WITH CHECK (
  -- Allow service role to insert messages
  auth.role() = 'service_role' OR
  -- Allow users to insert messages for accepted offers
  (context_type = 'marketplace' AND listing_id IS NOT NULL AND (
    -- User is the listing owner
    EXISTS (SELECT 1 FROM listings WHERE id = listing_id AND owner_id = (SELECT id FROM users_profile WHERE user_id = auth.uid())) OR
    -- User has accepted offers for this listing
    EXISTS (SELECT 1 FROM offers WHERE listing_id = messages.listing_id AND status = 'accepted' AND (
      offerer_id = (SELECT id FROM users_profile WHERE user_id = auth.uid()) OR 
      owner_id = (SELECT id FROM users_profile WHERE user_id = auth.uid())
    ))
  ))
);

-- Now insert test data
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
);

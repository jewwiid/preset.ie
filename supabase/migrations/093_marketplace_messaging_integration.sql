-- Marketplace Messaging Integration
-- Extends existing messaging system to support marketplace conversations

-- Add marketplace context columns to existing messages table
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS rental_order_id UUID REFERENCES rental_orders(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS sale_order_id UUID REFERENCES sale_orders(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS offer_id UUID REFERENCES offers(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS context_type TEXT CHECK (context_type IN ('gig', 'marketplace')) DEFAULT 'gig';

-- Add marketplace context columns to existing conversations (if conversations table exists)
-- Note: The existing system seems to use gig_id for conversations, so we'll extend that pattern
-- If there's a separate conversations table, we'll need to add these columns there too

-- Create indexes for marketplace messaging
CREATE INDEX IF NOT EXISTS idx_messages_listing_id ON messages(listing_id) WHERE listing_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_messages_rental_order_id ON messages(rental_order_id) WHERE rental_order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_messages_sale_order_id ON messages(sale_order_id) WHERE sale_order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_messages_offer_id ON messages(offer_id) WHERE offer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_messages_context_type ON messages(context_type);

-- Update RLS policies for marketplace messaging
-- Allow users to read messages related to their marketplace activities
DROP POLICY IF EXISTS "messages_marketplace_read" ON messages;
CREATE POLICY "messages_marketplace_read" ON messages
FOR SELECT USING (
  -- Existing gig-based access
  (context_type = 'gig' AND (
    EXISTS (SELECT 1 FROM gigs WHERE id = gig_id AND owner_user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM applications WHERE gig_id = messages.gig_id AND applicant_user_id = auth.uid())
  )) OR
  -- Marketplace listing access
  (context_type = 'marketplace' AND listing_id IS NOT NULL AND (
    EXISTS (SELECT 1 FROM listings WHERE id = listing_id AND owner_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM rental_orders WHERE listing_id = messages.listing_id AND (owner_id = auth.uid() OR renter_id = auth.uid())) OR
    EXISTS (SELECT 1 FROM sale_orders WHERE listing_id = messages.listing_id AND (owner_id = auth.uid() OR buyer_id = auth.uid())) OR
    EXISTS (SELECT 1 FROM offers WHERE listing_id = messages.listing_id AND (from_user = auth.uid() OR to_user = auth.uid()))
  )) OR
  -- Direct order/offer access
  (context_type = 'marketplace' AND (
    (rental_order_id IS NOT NULL AND EXISTS (SELECT 1 FROM rental_orders WHERE id = rental_order_id AND (owner_id = auth.uid() OR renter_id = auth.uid()))) OR
    (sale_order_id IS NOT NULL AND EXISTS (SELECT 1 FROM sale_orders WHERE id = sale_order_id AND (owner_id = auth.uid() OR buyer_id = auth.uid()))) OR
    (offer_id IS NOT NULL AND EXISTS (SELECT 1 FROM offers WHERE id = offer_id AND (from_user = auth.uid() OR to_user = auth.uid())))
  ))
);

-- Allow users to insert messages for marketplace activities they're involved in
DROP POLICY IF EXISTS "messages_marketplace_insert" ON messages;
CREATE POLICY "messages_marketplace_insert" ON messages
FOR INSERT WITH CHECK (
  -- Existing gig-based access
  (context_type = 'gig' AND (
    EXISTS (SELECT 1 FROM gigs WHERE id = gig_id AND owner_user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM applications WHERE gig_id = messages.gig_id AND applicant_user_id = auth.uid())
  )) OR
  -- Marketplace listing access
  (context_type = 'marketplace' AND listing_id IS NOT NULL AND (
    EXISTS (SELECT 1 FROM listings WHERE id = listing_id AND owner_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM rental_orders WHERE listing_id = messages.listing_id AND (owner_id = auth.uid() OR renter_id = auth.uid())) OR
    EXISTS (SELECT 1 FROM sale_orders WHERE listing_id = messages.listing_id AND (owner_id = auth.uid() OR buyer_id = auth.uid())) OR
    EXISTS (SELECT 1 FROM offers WHERE listing_id = messages.listing_id AND (from_user = auth.uid() OR to_user = auth.uid()))
  )) OR
  -- Direct order/offer access
  (context_type = 'marketplace' AND (
    (rental_order_id IS NOT NULL AND EXISTS (SELECT 1 FROM rental_orders WHERE id = rental_order_id AND (owner_id = auth.uid() OR renter_id = auth.uid()))) OR
    (sale_order_id IS NOT NULL AND EXISTS (SELECT 1 FROM sale_orders WHERE id = sale_order_id AND (owner_id = auth.uid() OR buyer_id = auth.uid()))) OR
    (offer_id IS NOT NULL AND EXISTS (SELECT 1 FROM offers WHERE id = offer_id AND (from_user = auth.uid() OR to_user = auth.uid())))
  ))
);

-- Function to create marketplace conversation
CREATE OR REPLACE FUNCTION create_marketplace_conversation(
  p_listing_id UUID,
  p_from_user_id UUID,
  p_to_user_id UUID,
  p_initial_message TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_conversation_id UUID;
  v_message_id UUID;
BEGIN
  -- For marketplace, we'll use the listing_id as the "gig_id" for conversation grouping
  -- This maintains compatibility with the existing messaging system
  
  -- Check if conversation already exists
  SELECT id INTO v_conversation_id
  FROM messages
  WHERE gig_id = p_listing_id
    AND from_user_id = p_from_user_id
    AND to_user_id = p_to_user_id
    AND context_type = 'marketplace'
  LIMIT 1;
  
  -- If conversation exists, return it
  IF v_conversation_id IS NOT NULL THEN
    RETURN v_conversation_id;
  END IF;
  
  -- Create initial message (this will create the conversation)
  INSERT INTO messages (
    gig_id,
    listing_id,
    from_user_id,
    to_user_id,
    body,
    context_type,
    created_at
  ) VALUES (
    p_listing_id,
    p_listing_id,
    p_from_user_id,
    p_to_user_id,
    COALESCE(p_initial_message, 'Hello! I''m interested in your listing.'),
    'marketplace',
    NOW()
  ) RETURNING id INTO v_message_id;
  
  RETURN p_listing_id; -- Return listing_id as conversation_id
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get marketplace conversation participants
CREATE OR REPLACE FUNCTION get_marketplace_conversation_participants(
  p_conversation_id UUID
) RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  handle TEXT,
  avatar_url TEXT,
  verified_id BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    up.id,
    up.display_name,
    up.handle,
    up.avatar_url,
    up.verified_id
  FROM messages m
  JOIN users_profile up ON up.id = m.from_user_id OR up.id = m.to_user_id
  WHERE m.gig_id = p_conversation_id
    AND m.context_type = 'marketplace'
    AND up.id != auth.uid(); -- Exclude current user
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get marketplace conversation context
CREATE OR REPLACE FUNCTION get_marketplace_conversation_context(
  p_conversation_id UUID
) RETURNS TABLE (
  listing_id UUID,
  listing_title TEXT,
  listing_category TEXT,
  listing_mode TEXT,
  owner_id UUID,
  owner_name TEXT,
  owner_handle TEXT,
  owner_verified BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.id,
    l.title,
    l.category,
    l.mode,
    l.owner_id,
    up.display_name,
    up.handle,
    up.verified_id
  FROM listings l
  JOIN users_profile up ON up.id = l.owner_id
  WHERE l.id = p_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION create_marketplace_conversation TO authenticated;
GRANT EXECUTE ON FUNCTION get_marketplace_conversation_participants TO authenticated;
GRANT EXECUTE ON FUNCTION get_marketplace_conversation_context TO authenticated;

-- Add comments for documentation
COMMENT ON COLUMN messages.listing_id IS 'References the marketplace listing for marketplace conversations';
COMMENT ON COLUMN messages.rental_order_id IS 'References the rental order for order-specific conversations';
COMMENT ON COLUMN messages.sale_order_id IS 'References the sale order for order-specific conversations';
COMMENT ON COLUMN messages.offer_id IS 'References the offer for offer-specific conversations';
COMMENT ON COLUMN messages.context_type IS 'Type of conversation: gig (existing) or marketplace (new)';

COMMENT ON FUNCTION create_marketplace_conversation IS 'Creates a new marketplace conversation between two users about a listing';
COMMENT ON FUNCTION get_marketplace_conversation_participants IS 'Gets all participants in a marketplace conversation';
COMMENT ON FUNCTION get_marketplace_conversation_context IS 'Gets the listing context for a marketplace conversation';

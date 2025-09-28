-- Prevent users from making offers on their own listings
-- Add a check constraint to ensure offerer_id != owner_id

-- First, let's clean up any existing self-offers
DELETE FROM offers WHERE offerer_id = owner_id;

-- Add the constraint
ALTER TABLE offers 
ADD CONSTRAINT check_no_self_offers 
CHECK (offerer_id != owner_id);

-- Add a comment explaining the constraint
COMMENT ON CONSTRAINT check_no_self_offers ON offers IS 'Prevents users from making offers on their own listings';

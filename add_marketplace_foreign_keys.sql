-- Add foreign key constraints for marketplace messaging
-- This will allow the frontend to use the expected foreign key join syntax

-- Add foreign key constraint for messages -> listings
ALTER TABLE messages 
ADD CONSTRAINT messages_listing_id_fkey 
FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE;

-- Add foreign key constraint for messages -> rental_orders
ALTER TABLE messages 
ADD CONSTRAINT messages_rental_order_id_fkey 
FOREIGN KEY (rental_order_id) REFERENCES rental_orders(id) ON DELETE CASCADE;

-- Add foreign key constraint for messages -> sale_orders
ALTER TABLE messages 
ADD CONSTRAINT messages_sale_order_id_fkey 
FOREIGN KEY (sale_order_id) REFERENCES sale_orders(id) ON DELETE CASCADE;

-- Add foreign key constraint for messages -> offers
ALTER TABLE messages 
ADD CONSTRAINT messages_offer_id_fkey 
FOREIGN KEY (offer_id) REFERENCES offers(id) ON DELETE CASCADE;

-- Verify the constraints were created
SELECT 
  tc.constraint_name, 
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM 
  information_schema.table_constraints AS tc 
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'messages'
  AND tc.constraint_name LIKE 'messages_%_fkey';

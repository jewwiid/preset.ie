-- Add foreign key constraint for collab_gear_offers.listing_id
-- This migration should run after the listings table is created

-- Check if listings table exists and add the foreign key constraint
DO $$
BEGIN
    -- Check if listings table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'listings') THEN
        -- Check if collab_gear_offers table exists and has listing_id column
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'collab_gear_offers' AND column_name = 'listing_id') THEN
            -- Add the foreign key constraint
            ALTER TABLE collab_gear_offers 
            ADD CONSTRAINT fk_collab_gear_offers_listing_id 
            FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE;
            
            -- Add the index for listing_id
            CREATE INDEX IF NOT EXISTS idx_collab_gear_offers_listing_id ON collab_gear_offers(listing_id);
            
            RAISE NOTICE 'Added foreign key constraint and index for collab_gear_offers.listing_id';
        ELSE
            RAISE NOTICE 'collab_gear_offers.listing_id column not found, skipping foreign key constraint';
        END IF;
    ELSE
        RAISE NOTICE 'Listings table not found, skipping foreign key constraint and index';
    END IF;
END $$;

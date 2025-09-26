-- Cleanup duplicate requests before creating unique indexes

-- 1. First, let's see what duplicates exist
-- This query will show us duplicate pending rental requests
SELECT 
    listing_id, 
    requester_id, 
    COUNT(*) as duplicate_count,
    array_agg(id ORDER BY created_at) as request_ids,
    array_agg(created_at ORDER BY created_at) as created_dates
FROM rental_requests 
WHERE status = 'pending'
GROUP BY listing_id, requester_id 
HAVING COUNT(*) > 1;

-- 2. Clean up duplicate rental requests
-- Keep only the most recent pending request for each user/listing combination
WITH duplicate_rental_requests AS (
    SELECT 
        id,
        ROW_NUMBER() OVER (
            PARTITION BY listing_id, requester_id 
            ORDER BY created_at DESC
        ) as rn
    FROM rental_requests 
    WHERE status = 'pending'
)
UPDATE rental_requests 
SET status = 'cancelled', updated_at = NOW()
WHERE id IN (
    SELECT id 
    FROM duplicate_rental_requests 
    WHERE rn > 1
);

-- 3. Check for duplicate offers
SELECT 
    listing_id, 
    offerer_id, 
    COUNT(*) as duplicate_count,
    array_agg(id ORDER BY created_at) as offer_ids,
    array_agg(created_at ORDER BY created_at) as created_dates
FROM offers 
WHERE status = 'pending'
GROUP BY listing_id, offerer_id 
HAVING COUNT(*) > 1;

-- 4. Clean up duplicate offers
-- Keep only the most recent pending offer for each user/listing combination
WITH duplicate_offers AS (
    SELECT 
        id,
        ROW_NUMBER() OVER (
            PARTITION BY listing_id, offerer_id 
            ORDER BY created_at DESC
        ) as rn
    FROM offers 
    WHERE status = 'pending'
)
UPDATE offers 
SET status = 'withdrawn', updated_at = NOW()
WHERE id IN (
    SELECT id 
    FROM duplicate_offers 
    WHERE rn > 1
);

-- 5. Verify cleanup worked
-- Check that no duplicates remain
SELECT 'rental_requests' as table_name, COUNT(*) as total_pending, COUNT(DISTINCT (listing_id, requester_id)) as unique_combinations
FROM rental_requests 
WHERE status = 'pending'
UNION ALL
SELECT 'offers' as table_name, COUNT(*) as total_pending, COUNT(DISTINCT (listing_id, offerer_id)) as unique_combinations
FROM offers 
WHERE status = 'pending';

-- 6. Show summary of what was cleaned up
SELECT 
    'rental_requests' as table_name,
    COUNT(*) as duplicates_cleaned
FROM rental_requests 
WHERE status = 'cancelled' AND updated_at > NOW() - INTERVAL '1 minute'
UNION ALL
SELECT 
    'offers' as table_name,
    COUNT(*) as duplicates_cleaned
FROM offers 
WHERE status = 'withdrawn' AND updated_at > NOW() - INTERVAL '1 minute';

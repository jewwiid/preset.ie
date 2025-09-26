-- Add anti-spam protections to rental_requests and offers tables (Safe version)

-- 1. Clean up any existing duplicate pending requests first
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

-- Clean up duplicate offers
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

-- 2. Add unique indexes to prevent duplicate requests
-- Only allow one pending rental request per user per listing
CREATE UNIQUE INDEX IF NOT EXISTS unique_pending_rental_request 
ON rental_requests (listing_id, requester_id) 
WHERE status = 'pending';

-- Only allow one pending offer per user per listing
CREATE UNIQUE INDEX IF NOT EXISTS unique_pending_offer 
ON offers (listing_id, offerer_id) 
WHERE status = 'pending';

-- 3. Add indexes for rate limiting queries
CREATE INDEX IF NOT EXISTS idx_rental_requests_requester_created_at 
ON rental_requests(requester_id, created_at);

CREATE INDEX IF NOT EXISTS idx_offers_offerer_created_at 
ON offers(offerer_id, created_at);

-- 4. Create function to check rate limits
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_user_id UUID,
  p_table_name TEXT,
  p_limit_count INTEGER DEFAULT 5,
  p_limit_hours INTEGER DEFAULT 24
)
RETURNS BOOLEAN AS $$
DECLARE
  request_count INTEGER;
BEGIN
  -- Count requests/offers in the last p_limit_hours
  IF p_table_name = 'rental_requests' THEN
    SELECT COUNT(*) INTO request_count
    FROM rental_requests
    WHERE requester_id = p_user_id
    AND created_at > NOW() - INTERVAL '1 hour' * p_limit_hours;
  ELSIF p_table_name = 'offers' THEN
    SELECT COUNT(*) INTO request_count
    FROM offers
    WHERE offerer_id = p_user_id
    AND created_at > NOW() - INTERVAL '1 hour' * p_limit_hours;
  ELSE
    RETURN FALSE;
  END IF;

  -- Return true if under limit, false if over limit
  RETURN request_count < p_limit_count;
END;
$$ LANGUAGE plpgsql;

-- 5. Create function to check for duplicate requests
CREATE OR REPLACE FUNCTION check_duplicate_request(
  p_user_id UUID,
  p_listing_id UUID,
  p_table_name TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  duplicate_count INTEGER;
BEGIN
  -- Check for existing pending requests/offers
  IF p_table_name = 'rental_requests' THEN
    SELECT COUNT(*) INTO duplicate_count
    FROM rental_requests
    WHERE requester_id = p_user_id
    AND listing_id = p_listing_id
    AND status = 'pending';
  ELSIF p_table_name = 'offers' THEN
    SELECT COUNT(*) INTO duplicate_count
    FROM offers
    WHERE offerer_id = p_user_id
    AND listing_id = p_listing_id
    AND status = 'pending';
  ELSE
    RETURN FALSE;
  END IF;

  -- Return true if no duplicates found, false if duplicates exist
  RETURN duplicate_count = 0;
END;
$$ LANGUAGE plpgsql;

-- 6. Add comments explaining the protections
COMMENT ON INDEX unique_pending_rental_request 
IS 'Prevents users from making multiple pending rental requests for the same listing';

COMMENT ON INDEX unique_pending_offer 
IS 'Prevents users from making multiple pending offers for the same listing';

COMMENT ON FUNCTION check_rate_limit(UUID, TEXT, INTEGER, INTEGER) 
IS 'Checks if user has exceeded rate limit for requests/offers in specified time period';

COMMENT ON FUNCTION check_duplicate_request(UUID, UUID, TEXT) 
IS 'Checks if user already has a pending request/offer for the same listing';

-- 7. Show summary of cleanup
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

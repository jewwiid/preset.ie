-- Comprehensive Duplicate Offers Cleanup & Prevention
-- This script handles ALL duplicate offers regardless of status

-- 1. ANALYZE ALL DUPLICATE OFFERS (any status)
SELECT 
  'ALL DUPLICATE OFFERS ANALYSIS:' as analysis_type,
  offerer_id, 
  listing_id, 
  status,
  COUNT(*) as duplicate_count,
  MIN(created_at) as earliest_offer,
  MAX(created_at) as latest_offer,
  MIN(offer_amount_cents) as min_offer_amount,
  MAX(offer_amount_cents) as max_offer_amount,
  STRING_AGG(id::text, ', ') as offer_ids
FROM offers 
GROUP BY offerer_id, listing_id, status
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC, status;

-- 2. SHOW ALL OFFERS BY STATUS
SELECT 
  'OFFERS BY STATUS:' as analysis_type,
  status,
  COUNT(*) as count,
  COUNT(DISTINCT offerer_id) as unique_offerers,
  COUNT(DISTINCT listing_id) as unique_listings
FROM offers
GROUP BY status
ORDER BY count DESC;

-- 3. IDENTIFY PROBLEMATIC SCENARIOS
-- Multiple accepted offers for same listing (CRITICAL ISSUE)
SELECT 
  'CRITICAL: MULTIPLE ACCEPTED OFFERS:' as issue_type,
  listing_id,
  COUNT(*) as accepted_count,
  STRING_AGG(offerer_id::text, ', ') as offerer_ids,
  STRING_AGG(id::text, ', ') as offer_ids
FROM offers
WHERE status = 'accepted'
GROUP BY listing_id
HAVING COUNT(*) > 1;

-- Multiple pending offers for same listing (ALSO PROBLEMATIC)
SELECT 
  'ISSUE: MULTIPLE PENDING OFFERS:' as issue_type,
  listing_id,
  COUNT(*) as pending_count,
  STRING_AGG(offerer_id::text, ', ') as offerer_ids,
  STRING_AGG(id::text, ', ') as offer_ids
FROM offers
WHERE status = 'pending'
GROUP BY listing_id
HAVING COUNT(*) > 1;

-- 4. CREATE CLEANUP STRATEGY
-- For each listing with multiple offers, keep only ONE offer per status
-- Priority: accepted > pending > rejected > withdrawn > expired

-- Create temporary table with offers to keep
CREATE TEMP TABLE offers_to_keep AS
WITH ranked_offers AS (
  SELECT 
    id,
    offerer_id,
    listing_id,
    status,
    created_at,
    offer_amount_cents,
    -- Rank offers by priority and recency
    ROW_NUMBER() OVER (
      PARTITION BY listing_id, status 
      ORDER BY 
        CASE status 
          WHEN 'accepted' THEN 1
          WHEN 'pending' THEN 2
          WHEN 'rejected' THEN 3
          WHEN 'withdrawn' THEN 4
          WHEN 'expired' THEN 5
          ELSE 6
        END,
        created_at DESC
    ) as rn
  FROM offers
)
SELECT id, offerer_id, listing_id, status, created_at
FROM ranked_offers
WHERE rn = 1;

-- 5. SHOW CLEANUP PLAN
SELECT 
  'CLEANUP PLAN:' as plan_type,
  o.status,
  COUNT(*) as total_offers,
  COUNT(*) - COALESCE(k.kept_count, 0) as to_delete,
  COALESCE(k.kept_count, 0) as to_keep
FROM offers o
LEFT JOIN (
  SELECT status, COUNT(*) as kept_count 
  FROM offers_to_keep 
  GROUP BY status
) k ON o.status = k.status
GROUP BY o.status, k.kept_count
ORDER BY o.status;

-- 6. SHOW SPECIFIC OFFERS TO DELETE
SELECT 
  'OFFERS TO DELETE:' as action,
  o.id,
  o.offerer_id,
  o.listing_id,
  o.status,
  o.offer_amount_cents,
  o.created_at,
  o.message
FROM offers o
WHERE o.id NOT IN (SELECT id FROM offers_to_keep)
ORDER BY o.listing_id, o.status, o.created_at;

-- 7. EXECUTE CLEANUP (UNCOMMENT TO RUN)
-- WARNING: This will permanently delete duplicate offers!
-- DELETE FROM offers WHERE id NOT IN (SELECT id FROM offers_to_keep);

-- 8. VERIFY CLEANUP
SELECT 
  'AFTER CLEANUP VERIFICATION:' as verification,
  listing_id,
  status,
  COUNT(*) as remaining_count
FROM offers
GROUP BY listing_id, status
HAVING COUNT(*) > 1
ORDER BY remaining_count DESC;

-- 9. UPDATE UNIQUE INDEX TO COVER ALL STATUSES
-- Drop existing index
DROP INDEX IF EXISTS unique_pending_offer;

-- Create comprehensive unique index
-- This prevents ANY duplicate offers for the same listing from the same user
CREATE UNIQUE INDEX unique_user_listing_offer 
ON offers (listing_id, offerer_id);

-- Add comment
COMMENT ON INDEX unique_user_listing_offer 
IS 'Prevents users from making multiple offers for the same listing regardless of status';

-- 10. UPDATE BUSINESS LOGIC FUNCTIONS
-- Update check_duplicate_request to check ALL statuses, not just pending
CREATE OR REPLACE FUNCTION check_duplicate_request(
  p_user_id UUID,
  p_listing_id UUID,
  p_table_name TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  duplicate_count INTEGER;
BEGIN
  IF p_table_name = 'rental_requests' THEN
    SELECT COUNT(*) INTO duplicate_count
    FROM rental_requests
    WHERE requester_id = p_user_id
    AND listing_id = p_listing_id
    AND status = 'pending';
  ELSIF p_table_name = 'offers' THEN
    -- FIXED: Check for ANY existing offers, not just pending
    SELECT COUNT(*) INTO duplicate_count
    FROM offers
    WHERE offerer_id = p_user_id
    AND listing_id = p_listing_id;
    -- Only allow if no offers exist at all
  ELSE
    RETURN FALSE;
  END IF;

  RETURN duplicate_count = 0;
END;
$$ LANGUAGE plpgsql;

-- Add comment
COMMENT ON FUNCTION check_duplicate_request(UUID, UUID, TEXT) 
IS 'UPDATED: Prevents users from making ANY offers for listings they already have offers on';

-- 11. FINAL SUMMARY
SELECT 
  'FINAL SUMMARY:' as summary_type,
  COUNT(*) as total_offers,
  COUNT(DISTINCT listing_id) as unique_listings,
  COUNT(DISTINCT offerer_id) as unique_offerers
FROM offers;

-- Clean up
DROP TABLE IF EXISTS offers_to_keep;

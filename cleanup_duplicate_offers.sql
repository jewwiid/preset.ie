-- Cleanup Duplicate Offers Script
-- This script removes duplicate offers, keeping only the most recent one for each user-listing combination

-- 1. First, let's see what duplicate offers exist
SELECT 
  'DUPLICATE OFFERS FOUND:' as status,
  offerer_id, 
  listing_id, 
  COUNT(*) as duplicate_count,
  MIN(created_at) as earliest_offer,
  MAX(created_at) as latest_offer
FROM offers 
WHERE status = 'pending' 
GROUP BY offerer_id, listing_id 
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- 2. Create a temporary table with the offers to keep (most recent for each user-listing combination)
CREATE TEMP TABLE offers_to_keep AS
SELECT DISTINCT ON (offerer_id, listing_id)
  id,
  offerer_id,
  listing_id,
  created_at
FROM offers
WHERE status = 'pending'
ORDER BY offerer_id, listing_id, created_at DESC;

-- 3. Show what offers will be kept
SELECT 
  'OFFERS TO KEEP:' as status,
  offerer_id,
  listing_id,
  id as offer_id,
  created_at
FROM offers_to_keep
ORDER BY offerer_id, listing_id;

-- 4. Show what offers will be deleted
SELECT 
  'OFFERS TO DELETE:' as status,
  o.offerer_id,
  o.listing_id,
  o.id as offer_id,
  o.created_at,
  o.offer_amount_cents,
  o.message
FROM offers o
WHERE o.status = 'pending'
  AND o.id NOT IN (SELECT id FROM offers_to_keep)
ORDER BY o.offerer_id, o.listing_id, o.created_at;

-- 5. Count how many offers will be deleted
SELECT 
  'SUMMARY:' as status,
  COUNT(*) as total_offers,
  COUNT(*) - (SELECT COUNT(*) FROM offers_to_keep) as offers_to_delete,
  (SELECT COUNT(*) FROM offers_to_keep) as offers_to_keep
FROM offers
WHERE status = 'pending';

-- 6. Actually delete the duplicate offers (keeping only the most recent)
-- WARNING: This will permanently delete duplicate offers!
-- Uncomment the next line to execute the deletion:
-- DELETE FROM offers WHERE status = 'pending' AND id NOT IN (SELECT id FROM offers_to_keep);

-- 7. Verify the cleanup worked
SELECT 
  'AFTER CLEANUP:' as status,
  offerer_id, 
  listing_id, 
  COUNT(*) as remaining_count
FROM offers 
WHERE status = 'pending' 
GROUP BY offerer_id, listing_id 
HAVING COUNT(*) > 1
ORDER BY remaining_count DESC;

-- 8. Show final count of pending offers
SELECT 
  'FINAL COUNT:' as status,
  COUNT(*) as total_pending_offers
FROM offers
WHERE status = 'pending';

-- 9. Clean up temporary table
DROP TABLE IF EXISTS offers_to_keep;

-- Safe Duplicate Offers Analysis Script
-- This script analyzes duplicate offers without deleting anything

-- 1. Check for duplicate offers
SELECT 
  'DUPLICATE OFFERS ANALYSIS:' as analysis_type,
  offerer_id, 
  listing_id, 
  COUNT(*) as duplicate_count,
  MIN(created_at) as earliest_offer,
  MAX(created_at) as latest_offer,
  MIN(offer_amount_cents) as min_offer_amount,
  MAX(offer_amount_cents) as max_offer_amount
FROM offers 
WHERE status = 'pending' 
GROUP BY offerer_id, listing_id 
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- 2. Show all pending offers with details
SELECT 
  'ALL PENDING OFFERS:' as analysis_type,
  id,
  offerer_id,
  listing_id,
  offer_amount_cents,
  status,
  created_at,
  message
FROM offers
WHERE status = 'pending'
ORDER BY offerer_id, listing_id, created_at DESC;

-- 3. Count total offers by status
SELECT 
  'OFFERS BY STATUS:' as analysis_type,
  status,
  COUNT(*) as count
FROM offers
GROUP BY status
ORDER BY count DESC;

-- 4. Check if the unique index is working
-- This should return 0 rows if the index is working properly
SELECT 
  'INDEX VERIFICATION:' as analysis_type,
  offerer_id,
  listing_id,
  COUNT(*) as duplicate_count
FROM offers
WHERE status = 'pending'
GROUP BY offerer_id, listing_id
HAVING COUNT(*) > 1;

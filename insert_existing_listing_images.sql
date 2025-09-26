-- Insert Existing Listing Images
-- Run this after setup_listing_images_system.sql to add your existing images

-- Replace 'your-supabase-url' with your actual Supabase URL
-- Replace the user_id and listing_id with your actual values

-- For listing '11282a83-c665-4a55-bdf5-67c733ab8bc6' (the one with the image):
INSERT INTO listing_images (listing_id, path, url, alt_text, sort_order, file_size, mime_type)
VALUES (
  '11282a83-c665-4a55-bdf5-67c733ab8bc6',
  'd6953adb-9c93-4d17-92f5-268990b6650f/11282a83-c665-4a55-bdf5-67c733ab8bc6/1758830803140-0.jpg',
  'https://your-supabase-url.supabase.co/storage/v1/object/public/marketplace-images/d6953adb-9c93-4d17-92f5-268990b6650f/11282a83-c665-4a55-bdf5-67c733ab8bc6/1758830803140-0.jpg',
  'Canon (peak design Everyday Backpack)',
  0,
  2200000, -- 2.2MB based on the file size shown in your storage
  'image/jpeg'
);

-- Verify the insertion
SELECT 
  li.id,
  li.listing_id,
  li.path,
  li.url,
  li.alt_text,
  l.title as listing_title
FROM listing_images li
JOIN listings l ON l.id = li.listing_id
WHERE li.listing_id = '11282a83-c665-4a55-bdf5-67c733ab8bc6';

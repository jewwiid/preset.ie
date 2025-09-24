-- Update the media count constraint to allow 1-6 items instead of 3-6
ALTER TABLE showcases 
DROP CONSTRAINT IF EXISTS media_count;

ALTER TABLE showcases 
ADD CONSTRAINT media_count CHECK (array_length(media_ids, 1) BETWEEN 1 AND 6);

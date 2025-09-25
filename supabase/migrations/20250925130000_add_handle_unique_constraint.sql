-- Add unique constraint to handle field in users_profile table
-- This ensures no duplicate handles can be created at the database level

-- First, check if there are any duplicate handles and clean them up if needed
-- (This is a safety measure in case there are existing duplicates)
WITH duplicate_handles AS (
  SELECT handle, COUNT(*) as count
  FROM users_profile
  GROUP BY handle
  HAVING COUNT(*) > 1
)
UPDATE users_profile 
SET handle = handle || '_' || user_id::text
WHERE handle IN (SELECT handle FROM duplicate_handles);

-- Add unique constraint
ALTER TABLE users_profile 
ADD CONSTRAINT unique_handle UNIQUE (handle);

-- Add comment for documentation
COMMENT ON CONSTRAINT unique_handle ON users_profile IS 'Ensures each handle is unique across all users';

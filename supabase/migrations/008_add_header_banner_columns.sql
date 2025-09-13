-- Migration: Add header banner columns to users_profile table
-- Date: 2025-01-12
-- Description: Adds support for header banner images and positioning

-- Add header banner URL column
ALTER TABLE users_profile 
ADD COLUMN IF NOT EXISTS header_banner_url TEXT;

-- Add header banner position column (JSON string for y position and scale)
ALTER TABLE users_profile 
ADD COLUMN IF NOT EXISTS header_banner_position TEXT DEFAULT '{"y":0,"scale":1}';

-- Add comment to explain the position format
COMMENT ON COLUMN users_profile.header_banner_position IS 'JSON string containing y position (pixels) and scale (1.0 = normal) for header banner positioning';

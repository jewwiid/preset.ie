-- Create usage rights enum and add common usage rights options
-- This migration adds standardized usage rights options for gigs

-- Create the usage_rights enum type
CREATE TYPE usage_rights_type AS ENUM (
  'PORTFOLIO_ONLY',
  'SOCIAL_MEDIA_PERSONAL',
  'SOCIAL_MEDIA_COMMERCIAL', 
  'WEBSITE_PERSONAL',
  'WEBSITE_COMMERCIAL',
  'EDITORIAL_PRINT',
  'COMMERCIAL_PRINT',
  'ADVERTISING',
  'FULL_COMMERCIAL',
  'EXCLUSIVE_BUYOUT',
  'CUSTOM'
);

-- Create a table to store usage rights descriptions and details
CREATE TABLE IF NOT EXISTS usage_rights_options (
  id SERIAL PRIMARY KEY,
  value usage_rights_type UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert the standard usage rights options
INSERT INTO usage_rights_options (value, display_name, description, sort_order) VALUES
('PORTFOLIO_ONLY', 'Portfolio Use Only', 'Images can be used by both parties for portfolio/promotional purposes only', 1),
('SOCIAL_MEDIA_PERSONAL', 'Personal Social Media', 'Can be shared on personal social media accounts with proper credit', 2),
('SOCIAL_MEDIA_COMMERCIAL', 'Commercial Social Media', 'Can be used for commercial social media marketing and promotion', 3),
('WEBSITE_PERSONAL', 'Personal Website', 'Can be used on personal websites and blogs with proper attribution', 4),
('WEBSITE_COMMERCIAL', 'Commercial Website', 'Can be used on commercial websites and marketing materials', 5),
('EDITORIAL_PRINT', 'Editorial Print', 'Can be used in magazines, newspapers, and editorial publications', 6),
('COMMERCIAL_PRINT', 'Commercial Print', 'Can be used in commercial print advertising and marketing materials', 7),
('ADVERTISING', 'Advertising Campaigns', 'Full advertising usage rights for campaigns and promotional materials', 8),
('FULL_COMMERCIAL', 'Full Commercial Rights', 'Complete commercial usage rights for any marketing or business purpose', 9),
('EXCLUSIVE_BUYOUT', 'Exclusive Buyout', 'Exclusive rights - photographer cannot use images elsewhere', 10),
('CUSTOM', 'Custom Agreement', 'Usage rights to be specified in gig description or separate agreement', 11);

-- Add comment to explain the usage
COMMENT ON TYPE usage_rights_type IS 'Standardized usage rights options for photo/video gigs';
COMMENT ON TABLE usage_rights_options IS 'Predefined usage rights options with descriptions for gig creation';

-- Update the gigs table to use the new enum (alter existing usage_rights column)
-- First, let's add a temporary column with the new enum type
ALTER TABLE gigs ADD COLUMN usage_rights_enum usage_rights_type;

-- Update existing rows to map text values to enum values
UPDATE gigs SET usage_rights_enum = 'PORTFOLIO_ONLY' WHERE usage_rights ILIKE '%portfolio%' OR usage_rights ILIKE '%tfp%';
UPDATE gigs SET usage_rights_enum = 'SOCIAL_MEDIA_PERSONAL' WHERE usage_rights ILIKE '%social%' AND usage_rights ILIKE '%personal%';
UPDATE gigs SET usage_rights_enum = 'COMMERCIAL_PRINT' WHERE usage_rights ILIKE '%commercial%';
UPDATE gigs SET usage_rights_enum = 'CUSTOM' WHERE usage_rights_enum IS NULL;

-- Drop the old text column and rename the enum column
ALTER TABLE gigs DROP COLUMN usage_rights;
ALTER TABLE gigs RENAME COLUMN usage_rights_enum TO usage_rights;

-- Set NOT NULL constraint after data migration
ALTER TABLE gigs ALTER COLUMN usage_rights SET NOT NULL;
ALTER TABLE gigs ALTER COLUMN usage_rights SET DEFAULT 'PORTFOLIO_ONLY';

-- Add index for better query performance
CREATE INDEX idx_gigs_usage_rights ON gigs(usage_rights);

-- Create a view for easy usage rights lookups
CREATE OR REPLACE VIEW usage_rights_view AS
SELECT 
  uro.value,
  uro.display_name,
  uro.description,
  uro.sort_order
FROM usage_rights_options uro
WHERE uro.is_active = true
ORDER BY uro.sort_order;

-- Add RLS policies for usage_rights_options table
ALTER TABLE usage_rights_options ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read usage rights options
CREATE POLICY "Usage rights are publicly readable" ON usage_rights_options
  FOR SELECT USING (true);

-- Only allow authenticated users to suggest new options (for future feature)
CREATE POLICY "Authenticated users can read usage rights" ON usage_rights_options
  FOR SELECT TO authenticated USING (true);
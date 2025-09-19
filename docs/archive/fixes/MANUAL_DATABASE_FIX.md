# Manual Database Fix for Usage Rights Options

## Problem
The `usage_rights_options` table doesn't exist in the database, causing the CreateGig page to show an error: `Error fetching usage rights options: Could not find the table 'public.usage_rights_options' in the schema cache`

## Solution
You need to manually execute the SQL to create this table.

### Steps:

1. **Open your Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Navigate to your project

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Copy and paste the following SQL:**

```sql
-- Simple script to create usage_rights_options table
-- Copy and paste this into your Supabase SQL Editor

-- Step 1: Create enum if it doesn't exist
DO $$ BEGIN
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
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 2: Create table
CREATE TABLE IF NOT EXISTS usage_rights_options (
  id SERIAL PRIMARY KEY,
  value usage_rights_type UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Insert data
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
('CUSTOM', 'Custom Agreement', 'Usage rights to be specified in gig description or separate agreement', 11)
ON CONFLICT (value) DO NOTHING;

-- Step 4: Enable RLS
ALTER TABLE usage_rights_options ENABLE ROW LEVEL SECURITY;

-- Step 5: Create policy
DROP POLICY IF EXISTS "Usage rights are publicly readable" ON usage_rights_options;
CREATE POLICY "Usage rights are publicly readable" ON usage_rights_options FOR SELECT USING (true);

-- Step 6: Create index
CREATE INDEX IF NOT EXISTS idx_usage_rights_options_active_sort ON usage_rights_options(is_active, sort_order);
```

4. **Execute the query**
   - Click "Run" or press Ctrl+Enter (Cmd+Enter on Mac)
   - You should see a success message

5. **Verify the table was created**
   - Run this test query:
   ```sql
   SELECT COUNT(*) FROM usage_rights_options;
   ```
   - You should see `11` as the result

## What this fixes:
- Creates the `usage_rights_type` enum
- Creates the `usage_rights_options` table
- Populates it with 11 standard usage rights options
- Sets up proper Row Level Security (RLS)
- Creates an index for better performance

## After completing this:
- The CreateGig page will load without errors
- Users will see all 11 usage rights options in the dropdown
- The error message will be replaced with proper data

## Note:
The CreateGig component already has fallback data, so even if this table doesn't exist, users can still create gigs. However, creating the table provides the full set of options and eliminates the console error.
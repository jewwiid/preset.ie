const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zbsmgymyfhnwjdnmlelr.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpic21neW15Zmhud2pkbm1sZWxyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzEwODg1MywiZXhwIjoyMDcyNjg0ODUzfQ.XkDZmk6mfJAGUEUl3uusETrtsJZ5fBPtHMrda7nD__U';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addSubscriptionTier() {
  console.log('🔧 Adding subscription_tier column to users_profile...\n');
  
  try {
    // First, check if column exists by trying to select it
    const { data: testData, error: testError } = await supabase
      .from('users_profile')
      .select('subscription_tier')
      .limit(1);
    
    if (!testError) {
      console.log('✅ subscription_tier column already exists');
      return;
    }
    
    console.log('Column does not exist, please add it via Supabase dashboard:');
    console.log('\n📋 SQL to run in Supabase SQL Editor:\n');
    console.log(`
-- Add subscription_tier column to users_profile
ALTER TABLE public.users_profile 
ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR(10) DEFAULT 'free';

-- Add check constraint for valid tiers
ALTER TABLE public.users_profile 
ADD CONSTRAINT valid_subscription_tier 
CHECK (subscription_tier IN ('free', 'plus', 'pro'));

-- Create index for subscription queries
CREATE INDEX IF NOT EXISTS idx_users_profile_subscription_tier 
ON public.users_profile(subscription_tier);

-- Update existing rows to have 'free' tier
UPDATE public.users_profile 
SET subscription_tier = 'free' 
WHERE subscription_tier IS NULL;
    `);
    
    console.log('\n🔗 Go to: https://supabase.com/dashboard/project/zbsmgymyfhnwjdnmlelr/sql/new');
    console.log('    Paste and run the SQL above\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

addSubscriptionTier();
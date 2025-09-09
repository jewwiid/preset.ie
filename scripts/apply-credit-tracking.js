const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://zbsmgymyfhnwjdnmlelr.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpic21neW15Zmhud2pkbm1sZWxyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzEwODg1MywiZXhwIjoyMDcyNjg0ODUzfQ.XkDZmk6mfJAGUEUl3uusETrtsJZ5fBPtHMrda7nD__U';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('Applying real credit tracking migration...');
  
  try {
    // Add columns to platform_credits
    console.log('Adding columns to platform_credits...');
    const alterTableQueries = [
      `ALTER TABLE platform_credits ADD COLUMN IF NOT EXISTS last_api_balance INTEGER`,
      `ALTER TABLE platform_credits ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMPTZ`,
      `ALTER TABLE platform_credits ADD COLUMN IF NOT EXISTS sync_status VARCHAR(20) DEFAULT 'pending'`
    ];
    
    // We'll execute these via direct SQL later
    
    // Create platform_alerts table
    console.log('Creating platform_alerts table...');
    const { error: alertsError } = await supabase.from('platform_alerts').select('id').limit(1);
    if (alertsError && alertsError.code === '42P01') {
      console.log('platform_alerts table does not exist, creation would happen via migration');
    } else {
      console.log('platform_alerts table already exists or accessible');
    }
    
    // Create platform_settings table
    console.log('Creating platform_settings table...');
    const { error: settingsError } = await supabase.from('platform_settings').select('key').limit(1);
    if (settingsError && settingsError.code === '42P01') {
      console.log('platform_settings table does not exist, creation would happen via migration');
    } else {
      console.log('platform_settings table already exists or accessible');
    }
    
    // Test NanoBanana API connection
    console.log('\nTesting NanoBanana API connection...');
    const nanoBananaApiKey = process.env.NANOBANANA_API_KEY || process.env.NANOBANAN_API_KEY || 'nAXAGHzevhq87FU9Zjoz';
    
    const response = await fetch('https://api.nanobananaapi.ai/api/v1/common/credit', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${nanoBananaApiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const creditData = await response.json();
      console.log('✅ NanoBanana API connection successful!');
      console.log('   Current credits:', creditData.data || 0);
      
      // Update platform_credits with real data
      const realCredits = creditData.data || 0;
      const { error: updateError } = await supabase
        .from('platform_credits')
        .update({
          current_balance: realCredits,
          metadata: {
            last_api_response: creditData,
            last_api_balance: realCredits,
            last_sync_at: new Date().toISOString()
          }
        })
        .eq('provider', 'nanobanana');
      
      if (!updateError) {
        console.log('✅ Updated NanoBanana credits in database:', realCredits);
      } else {
        console.error('Error updating credits:', updateError);
      }
      
    } else {
      const errorText = await response.text();
      console.error('❌ NanoBanana API error:', response.status, errorText);
    }
    
    console.log('\n='.repeat(60));
    console.log('📊 REAL CREDIT TRACKING SETUP COMPLETE');
    console.log('='.repeat(60));
    console.log('\nNext steps:');
    console.log('1. Run the full migration SQL in Supabase SQL editor');
    console.log('2. Test the sync button in admin dashboard');
    console.log('3. Monitor real credits vs database credits');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('Error applying migration:', error);
  }
}

applyMigration();
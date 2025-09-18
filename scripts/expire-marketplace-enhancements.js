#!/usr/bin/env node

/**
 * Marketplace Enhancement Expiration Cron Job
 * 
 * This script should be run as a cron job to automatically expire
 * marketplace listing enhancements that have passed their expiration date.
 * 
 * Recommended cron schedule: Every hour
 * 0 * * * * /path/to/scripts/expire-marketplace-enhancements.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function expireMarketplaceEnhancements() {
  try {
    console.log(`🕐 [${new Date().toISOString()}] Starting marketplace enhancement expiration...`);
    
    // Call the database function to expire enhancements
    const { data: expiredCount, error } = await supabase
      .rpc('expire_listing_enhancements');
    
    if (error) {
      console.error('❌ Error expiring enhancements:', error.message);
      process.exit(1);
    }
    
    console.log(`✅ Successfully expired ${expiredCount} marketplace enhancements`);
    
    // Log additional details if enhancements were expired
    if (expiredCount > 0) {
      console.log(`📊 ${expiredCount} listings have been updated to remove expired enhancements`);
      
      // Get some stats about expired enhancements
      const { data: stats, error: statsError } = await supabase
        .from('listing_enhancements')
        .select('enhancement_type')
        .eq('status', 'expired')
        .gte('updated_at', new Date(Date.now() - 60000).toISOString()); // Last minute
      
      if (!statsError && stats.length > 0) {
        const typeCounts = stats.reduce((acc, enhancement) => {
          acc[enhancement.enhancement_type] = (acc[enhancement.enhancement_type] || 0) + 1;
          return acc;
        }, {});
        
        console.log('📈 Expired enhancement breakdown:', typeCounts);
      }
    }
    
    console.log(`🏁 Enhancement expiration completed successfully`);
    
  } catch (error) {
    console.error('💥 Unexpected error:', error.message);
    process.exit(1);
  }
}

// Run the expiration if this script is executed directly
if (require.main === module) {
  expireMarketplaceEnhancements();
}

module.exports = { expireMarketplaceEnhancements };

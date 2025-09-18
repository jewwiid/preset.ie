#!/usr/bin/env node

/**
 * Monthly Subscription Benefits Reset Cron Job
 * 
 * This script should be run as a cron job to automatically reset
 * monthly subscription benefits usage counters at the beginning of each month.
 * 
 * Recommended cron schedule: First day of each month at midnight
 * 0 0 1 * * /path/to/scripts/reset-monthly-benefits.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function resetMonthlyBenefits() {
  try {
    console.log(`🕐 [${new Date().toISOString()}] Starting monthly benefits reset...`);
    
    // Call the database function to reset monthly benefits
    const { data: resetCount, error } = await supabase
      .rpc('reset_monthly_subscription_benefits');
    
    if (error) {
      console.error('❌ Error resetting monthly benefits:', error.message);
      process.exit(1);
    }
    
    console.log(`✅ Successfully reset ${resetCount} monthly subscription benefits`);
    
    // Get stats about the reset benefits
    if (resetCount > 0) {
      const { data: benefits, error: benefitsError } = await supabase
        .from('subscription_benefits')
        .select('benefit_type, subscription_tier, monthly_limit')
        .gte('last_reset_at', new Date(Date.now() - 60000).toISOString()); // Last minute
      
      if (!benefitsError && benefits.length > 0) {
        const benefitStats = benefits.reduce((acc, benefit) => {
          const key = `${benefit.subscription_tier}_${benefit.benefit_type}`;
          acc[key] = {
            tier: benefit.subscription_tier,
            type: benefit.benefit_type,
            limit: benefit.monthly_limit
          };
          return acc;
        }, {});
        
        console.log('📈 Reset benefits breakdown:');
        Object.values(benefitStats).forEach(stat => {
          console.log(`  - ${stat.tier} ${stat.type}: ${stat.limit} uses/month`);
        });
      }
    }
    
    console.log(`🏁 Monthly benefits reset completed successfully`);
    
  } catch (error) {
    console.error('💥 Unexpected error:', error.message);
    process.exit(1);
  }
}

// Run the reset if this script is executed directly
if (require.main === module) {
  resetMonthlyBenefits();
}

module.exports = { resetMonthlyBenefits };

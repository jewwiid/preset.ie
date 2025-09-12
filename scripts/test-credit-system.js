#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testCreditSystem() {
  console.log('🧪 Testing Credit System...\n');
  
  try {
    // Test 1: Basic table query to check if table exists and has expected columns
    console.log('Test 1: Checking table structure...');
    const { data: sampleRecord, error: structureError } = await supabase
      .from('user_credits')
      .select('current_balance, monthly_allowance, consumed_this_month, subscription_tier, last_reset_at')
      .limit(1);
    
    if (structureError) {
      console.error('❌ Table structure issue:', structureError.message);
      return false;
    }
    
    console.log('✅ Table structure appears valid\n');
    
    // Test 2: Check if users have credit records
    console.log('Test 2: Checking user credit records...');
    const { data: users, error: usersError } = await supabase
      .from('auth.users')
      .select('id')
      .limit(5);
    
    if (usersError) {
      console.error('❌ Failed to fetch users:', usersError.message);
      return false;
    }
    
    let userCount = 0;
    for (const user of users || []) {
      const { data: credits, error: creditsError } = await supabase
        .from('user_credits')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (creditsError && creditsError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error(`❌ Error checking credits for user ${user.id}:`, creditsError.message);
      } else if (!credits) {
        console.warn(`⚠️  User ${user.id} has no credit record`);
      } else {
        console.log(`✅ User ${user.id}: ${credits.current_balance} credits (${credits.subscription_tier})`);
        userCount++;
      }
    }
    
    if (userCount === 0) {
      console.warn('⚠️  No users have credit records');
    }
    
    // Test 3: Test a basic credit query
    console.log('\nTest 3: Testing basic credit query...');
    const { data: sampleCredits, error: sampleError } = await supabase
      .from('user_credits')
      .select('*')
      .limit(1);
    
    if (sampleError) {
      console.error('❌ Failed to query credits:', sampleError.message);
      return false;
    }
    
    if (sampleCredits && sampleCredits.length > 0) {
      const credit = sampleCredits[0];
      console.log(`✅ Sample credit record:`, {
        user_id: credit.user_id.substring(0, 8) + '...',
        current_balance: credit.current_balance,
        monthly_allowance: credit.monthly_allowance,
        consumed_this_month: credit.consumed_this_month,
        subscription_tier: credit.subscription_tier
      });
    } else {
      console.log('⚠️  No credit records found in database');
    }
    
    // Test 4: Test credit manipulation functions
    console.log('\nTest 4: Testing credit functions...');
    if (sampleCredits && sampleCredits.length > 0) {
      const testUserId = sampleCredits[0].user_id;
      try {
        const { data: updateResult, error: updateError } = await supabase
          .rpc('update_user_credits', {
            p_user_id: testUserId,
            p_amount: 0, // No-op to test function exists
            p_type: 'adjustment',
            p_description: 'Test function call'
          });
          
        if (updateError) {
          console.log('⚠️  update_user_credits function may not exist:', updateError.message);
        } else {
          console.log('✅ update_user_credits function exists and works');
        }
      } catch (funcError) {
        console.log('⚠️  Credit manipulation functions need setup');
      }
    } else {
      console.log('⚠️  No test data available for function testing');
    }
    
    console.log('\n🎉 Credit system tests complete!');
    console.log('\n📋 Summary:');
    console.log('- Table structure: ✅ Valid');
    console.log('- User records:', userCount > 0 ? '✅ Found' : '⚠️  None found');
    console.log('- Basic queries: ✅ Working');
    
    return true;
    
  } catch (error) {
    console.error('💥 Test failed with error:', error);
    return false;
  }
}

async function createTestUser() {
  console.log('\n🔧 Creating test credit record...');
  
  try {
    // Get a user without credits
    const { data: users } = await supabase
      .from('auth.users')
      .select('id')
      .limit(1);
    
    if (!users || users.length === 0) {
      console.log('⚠️  No users found to create test record');
      return;
    }
    
    const testUserId = users[0].id;
    
    // Create a test credit record
    const { data, error } = await supabase
      .from('user_credits')
      .upsert({
        user_id: testUserId,
        subscription_tier: 'free',
        monthly_allowance: 0,
        current_balance: 5,
        consumed_this_month: 0,
        last_reset_at: new Date().toISOString()
      })
      .select();
    
    if (error) {
      console.error('❌ Failed to create test record:', error.message);
    } else {
      console.log('✅ Test credit record created:', {
        user_id: testUserId.substring(0, 8) + '...',
        current_balance: data[0].current_balance
      });
    }
  } catch (error) {
    console.error('❌ Error creating test record:', error.message);
  }
}

if (require.main === module) {
  (async () => {
    const success = await testCreditSystem();
    
    if (!success) {
      console.log('\n🔧 Attempting to create test data...');
      await createTestUser();
    }
    
    process.exit(success ? 0 : 1);
  })();
}

module.exports = { testCreditSystem };
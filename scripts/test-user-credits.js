#!/usr/bin/env node

// Test script to check user credits and create test user
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

async function testUserCredits() {
  console.log('🧪 Testing User Credits System...\n');

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing required environment variables');
    process.exit(1);
  }

  try {
    // Initialize Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('✅ Connected to Supabase database');

    // Check if we have any users
    console.log('\n👥 Checking existing users...');
    const { data: users, error: usersError } = await supabase
      .from('users_profile')
      .select('user_id, display_name, subscription_tier')
      .limit(5);

    if (usersError) {
      console.log('❌ Error fetching users:', usersError.message);
    } else if (users && users.length > 0) {
      console.log(`✅ Found ${users.length} users:`);
      users.forEach(user => {
        console.log(`   - ${user.display_name} (${user.user_id}) - ${user.subscription_tier}`);
      });
    } else {
      console.log('⚠️  No users found in users_profile table');
    }

    // Check user credits
    console.log('\n💰 Checking user credits...');
    const { data: allCredits, error: creditsError } = await supabase
      .from('user_credits')
      .select('user_id, subscription_tier, current_balance, monthly_allowance')
      .limit(10);

    if (creditsError) {
      console.log('❌ Error fetching user credits:', creditsError.message);
    } else if (allCredits && allCredits.length > 0) {
      console.log(`✅ Found ${allCredits.length} user credit records:`);
      allCredits.forEach(credit => {
        console.log(`   - User ${credit.user_id}: ${credit.current_balance}/${credit.monthly_allowance} credits (${credit.subscription_tier})`);
      });
    } else {
      console.log('⚠️  No user credit records found');
    }

    // Test creating a user credit record for an existing user
    if (users && users.length > 0) {
      const testUser = users[0];
      console.log(`\n🧪 Testing credit creation for user: ${testUser.display_name}`);
      
      // Check if user already has credits
      const { data: existingCredits } = await supabase
        .from('user_credits')
        .select('*')
        .eq('user_id', testUser.user_id)
        .single();

      if (existingCredits) {
        console.log(`✅ User already has credits: ${existingCredits.current_balance}/${existingCredits.monthly_allowance}`);
      } else {
        console.log('Creating credits for user...');
        
        const tier = testUser.subscription_tier || 'free';
        const allowance = { free: 0, plus: 10, pro: 25 }[tier] || 0;

        const { data: newCredits, error: createError } = await supabase
          .from('user_credits')
          .insert({
            user_id: testUser.user_id,
            subscription_tier: tier,
            monthly_allowance: allowance,
            current_balance: allowance,
            consumed_this_month: 0,
            last_reset_at: new Date().toISOString()
          })
          .select()
          .single();

        if (createError) {
          console.log('❌ Error creating credits:', createError.message);
        } else {
          console.log(`✅ Created credits for user: ${newCredits.current_balance}/${newCredits.monthly_allowance} (${tier})`);
        }
      }
    }

    // Test the API endpoint
    console.log('\n🌐 Testing API endpoint...');
    try {
      const response = await fetch('http://localhost:3000/api/enhance-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          inputImageUrl: 'https://example.com/image.jpg',
          enhancementType: 'lighting',
          prompt: 'test prompt'
        })
      });

      const data = await response.json();
      console.log(`API Response (${response.status}):`, data);
      
      if (response.status === 401) {
        console.log('✅ API is working - authentication required as expected');
      } else if (response.status === 402) {
        console.log('✅ API is working - insufficient credits error as expected');
      } else if (response.status === 200) {
        console.log('✅ API is working - request processed successfully');
      }
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.log('⚠️  Next.js server not running. Start with: npm run dev');
      } else {
        console.log('❌ API test error:', error.message);
      }
    }

    console.log('\n🎉 User Credits Test Complete!');
    console.log('\n📋 Next Steps:');
    console.log('   1. Make sure users have credit records in the database');
    console.log('   2. Test with a real user token from your auth system');
    console.log('   3. Check the admin dashboard to monitor credit usage');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testUserCredits();


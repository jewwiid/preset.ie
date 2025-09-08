#!/usr/bin/env node

// Test script to test the credit API with a real user
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

async function testCreditAPI() {
  console.log('🧪 Testing Credit API with Real User...\n');

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

    // Get a test user
    const { data: users } = await supabase
      .from('users_profile')
      .select('user_id, display_name, subscription_tier')
      .limit(1);

    if (!users || users.length === 0) {
      console.log('❌ No users found');
      return;
    }

    const testUser = users[0];
    console.log(`👤 Testing with user: ${testUser.display_name} (${testUser.subscription_tier})`);

    // Get user's current credits
    const { data: userCredits } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', testUser.user_id)
      .single();

    console.log('💰 Current credits:', userCredits);

    // Create a test JWT token (this won't work for real auth, but let's see what happens)
    console.log('\n🌐 Testing API endpoint...');
    
    try {
      const response = await fetch('http://localhost:3000/api/enhance-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer invalid-token-for-testing'
        },
        body: JSON.stringify({
          inputImageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
          enhancementType: 'lighting',
          prompt: 'warm golden hour lighting',
          strength: 0.8
        })
      });

      const data = await response.json();
      console.log(`API Response (${response.status}):`, JSON.stringify(data, null, 2));
      
    } catch (error) {
      console.log('❌ API test error:', error.message);
    }

    // Test the credit checking logic directly
    console.log('\n🔍 Testing credit logic directly...');
    
    if (!userCredits || userCredits.current_balance < 1) {
      console.log('❌ User has insufficient credits:', {
        hasCredits: !!userCredits,
        currentBalance: userCredits?.current_balance,
        subscriptionTier: userCredits?.subscription_tier
      });
    } else {
      console.log('✅ User has sufficient credits:', {
        currentBalance: userCredits.current_balance,
        subscriptionTier: userCredits.subscription_tier
      });
    }

    console.log('\n📋 Debug Information:');
    console.log('- User ID:', testUser.user_id);
    console.log('- Subscription Tier:', testUser.subscription_tier);
    console.log('- Current Balance:', userCredits?.current_balance || 'No credits record');
    console.log('- Monthly Allowance:', userCredits?.monthly_allowance || 'No credits record');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testCreditAPI();


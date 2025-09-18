#!/usr/bin/env node

/**
 * Marketplace API Test Script
 * Tests all marketplace API endpoints
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '❌');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Test data
let testUser = null;
let testListing = null;
let testRentalOrder = null;
let testOffer = null;

async function createTestUser() {
  console.log('👤 Creating test user...');
  
  // Create auth user
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: `test-marketplace-${Date.now()}@example.com`,
    password: 'testpass123',
    email_confirm: true
  });

  if (authError) {
    console.error('❌ Failed to create auth user:', authError.message);
    return null;
  }

  // Create user profile
  const { data: profile, error: profileError } = await supabase
    .from('users_profile')
    .insert({
      user_id: authUser.user.id,
      display_name: 'Test Marketplace User',
      handle: `test_marketplace_${Date.now()}`,
      bio: 'Test user for marketplace API testing',
      city: 'Test City',
      country: 'Test Country',
      verified_id: true
    })
    .select('id, user_id')
    .single();

  if (profileError) {
    console.error('❌ Failed to create user profile:', profileError.message);
    return null;
  }

  console.log('✅ Test user created');
  return { authUser: authUser.user, profile };
}

async function testListingsAPI() {
  console.log('\n📋 Testing Listings API...');
  
  const tests = [
    {
      name: 'GET /api/marketplace/listings - Browse listings',
      test: async () => {
        const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/api/marketplace/listings`);
        const data = await response.json();
        
        if (response.ok) {
          return { status: '✅', message: `Found ${data.listings?.length || 0} listings` };
        } else {
          return { status: '❌', error: data.error };
        }
      }
    },
    {
      name: 'POST /api/marketplace/listings - Create listing',
      test: async () => {
        if (!testUser) {
          return { status: '⚠️', message: 'No test user available' };
        }

        const listingData = {
          title: 'Test Camera Equipment',
          description: 'Professional camera for rent',
          category: 'camera',
          condition: 'good',
          mode: 'rent',
          rent_day_cents: 5000, // €50/day
          retainer_mode: 'credit_hold',
          retainer_cents: 10000, // €100 retainer
          location_city: 'Test City',
          location_country: 'Test Country',
          verified_only: false
        };

        const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/api/marketplace/listings`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${testUser.authUser.access_token}`
          },
          body: JSON.stringify(listingData)
        });

        const data = await response.json();
        
        if (response.ok) {
          testListing = data.listing;
          return { status: '✅', message: 'Listing created successfully' };
        } else {
          return { status: '❌', error: data.error };
        }
      }
    },
    {
      name: 'GET /api/marketplace/listings/[id] - Get listing details',
      test: async () => {
        if (!testListing) {
          return { status: '⚠️', message: 'No test listing available' };
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/api/marketplace/listings/${testListing.id}`);
        const data = await response.json();
        
        if (response.ok) {
          return { status: '✅', message: 'Listing details retrieved successfully' };
        } else {
          return { status: '❌', error: data.error };
        }
      }
    }
  ];

  let passedTests = 0;
  let totalTests = tests.length;

  for (const test of tests) {
    console.log(`🔍 ${test.name}...`);
    
    try {
      const result = await test.test();
      console.log(`   ${result.status} ${result.message || result.error}`);
      if (result.status === '✅') passedTests++;
    } catch (error) {
      console.log(`   ❌ Unexpected error: ${error.message}`);
    }
  }

  return { passedTests, totalTests };
}

async function testRentalOrdersAPI() {
  console.log('\n📋 Testing Rental Orders API...');
  
  const tests = [
    {
      name: 'POST /api/marketplace/rental-orders - Create rental order',
      test: async () => {
        if (!testUser || !testListing) {
          return { status: '⚠️', message: 'No test user or listing available' };
        }

        const orderData = {
          listing_id: testListing.id,
          start_date: '2024-12-01',
          end_date: '2024-12-03',
          pickup_location: 'Test Pickup Location',
          return_location: 'Test Return Location',
          special_instructions: 'Handle with care'
        };

        const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/api/marketplace/rental-orders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${testUser.authUser.access_token}`
          },
          body: JSON.stringify(orderData)
        });

        const data = await response.json();
        
        if (response.ok) {
          testRentalOrder = data.order;
          return { status: '✅', message: 'Rental order created successfully' };
        } else {
          return { status: '❌', error: data.error };
        }
      }
    },
    {
      name: 'GET /api/marketplace/rental-orders - Get user orders',
      test: async () => {
        if (!testUser) {
          return { status: '⚠️', message: 'No test user available' };
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/api/marketplace/rental-orders`, {
          headers: {
            'Authorization': `Bearer ${testUser.authUser.access_token}`
          }
        });

        const data = await response.json();
        
        if (response.ok) {
          return { status: '✅', message: `Found ${data.orders?.length || 0} orders` };
        } else {
          return { status: '❌', error: data.error };
        }
      }
    }
  ];

  let passedTests = 0;
  let totalTests = tests.length;

  for (const test of tests) {
    console.log(`🔍 ${test.name}...`);
    
    try {
      const result = await test.test();
      console.log(`   ${result.status} ${result.message || result.error}`);
      if (result.status === '✅') passedTests++;
    } catch (error) {
      console.log(`   ❌ Unexpected error: ${error.message}`);
    }
  }

  return { passedTests, totalTests };
}

async function testOffersAPI() {
  console.log('\n📋 Testing Offers API...');
  
  const tests = [
    {
      name: 'POST /api/marketplace/offers - Create offer',
      test: async () => {
        if (!testUser || !testListing) {
          return { status: '⚠️', message: 'No test user or listing available' };
        }

        const offerData = {
          listing_id: testListing.id,
          context: 'rent',
          payload: {
            price_cents: 4000, // €40/day (counter offer)
            start_date: '2024-12-01',
            end_date: '2024-12-03',
            quantity: 1,
            message: 'Would you consider €40/day instead?'
          }
        };

        const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/api/marketplace/offers`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${testUser.authUser.access_token}`
          },
          body: JSON.stringify(offerData)
        });

        const data = await response.json();
        
        if (response.ok) {
          testOffer = data.offer;
          return { status: '✅', message: 'Offer created successfully' };
        } else {
          return { status: '❌', error: data.error };
        }
      }
    },
    {
      name: 'GET /api/marketplace/offers - Get user offers',
      test: async () => {
        if (!testUser) {
          return { status: '⚠️', message: 'No test user available' };
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/api/marketplace/offers`, {
          headers: {
            'Authorization': `Bearer ${testUser.authUser.access_token}`
          }
        });

        const data = await response.json();
        
        if (response.ok) {
          return { status: '✅', message: `Found ${data.offers?.length || 0} offers` };
        } else {
          return { status: '❌', error: data.error };
        }
      }
    }
  ];

  let passedTests = 0;
  let totalTests = tests.length;

  for (const test of tests) {
    console.log(`🔍 ${test.name}...`);
    
    try {
      const result = await test.test();
      console.log(`   ${result.status} ${result.message || result.error}`);
      if (result.status === '✅') passedTests++;
    } catch (error) {
      console.log(`   ❌ Unexpected error: ${error.message}`);
    }
  }

  return { passedTests, totalTests };
}

async function testReviewsAPI() {
  console.log('\n📋 Testing Reviews API...');
  
  const tests = [
    {
      name: 'GET /api/marketplace/reviews - Get reviews',
      test: async () => {
        const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/api/marketplace/reviews`);
        const data = await response.json();
        
        if (response.ok) {
          return { status: '✅', message: `Found ${data.reviews?.length || 0} reviews` };
        } else {
          return { status: '❌', error: data.error };
        }
      }
    }
  ];

  let passedTests = 0;
  let totalTests = tests.length;

  for (const test of tests) {
    console.log(`🔍 ${test.name}...`);
    
    try {
      const result = await test.test();
      console.log(`   ${result.status} ${result.message || result.error}`);
      if (result.status === '✅') passedTests++;
    } catch (error) {
      console.log(`   ❌ Unexpected error: ${error.message}`);
    }
  }

  return { passedTests, totalTests };
}

async function cleanupTestData() {
  console.log('\n🧹 Cleaning up test data...');
  
  try {
    if (testOffer) {
      await supabase.from('offers').delete().eq('id', testOffer.id);
    }
    
    if (testRentalOrder) {
      await supabase.from('rental_orders').delete().eq('id', testRentalOrder.id);
    }
    
    if (testListing) {
      await supabase.from('listings').delete().eq('id', testListing.id);
    }
    
    if (testUser) {
      await supabase.from('users_profile').delete().eq('id', testUser.profile.id);
      await supabase.auth.admin.deleteUser(testUser.authUser.id);
    }
    
    console.log('✅ Test data cleaned up');
  } catch (error) {
    console.error('❌ Error cleaning up test data:', error.message);
  }
}

async function testMarketplaceAPI() {
  console.log('🧪 Testing Marketplace API Endpoints...\n');

  try {
    // Create test user
    testUser = await createTestUser();
    
    // Test each API section
    const listingsResults = await testListingsAPI();
    const ordersResults = await testRentalOrdersAPI();
    const offersResults = await testOffersAPI();
    const reviewsResults = await testReviewsAPI();
    
    // Calculate totals
    const totalPassed = listingsResults.passedTests + ordersResults.passedTests + offersResults.passedTests + reviewsResults.passedTests;
    const totalTests = listingsResults.totalTests + ordersResults.totalTests + offersResults.totalTests + reviewsResults.totalTests;
    
    // Summary
    console.log('\n📊 Test Summary:');
    console.log(`   Listings API: ${listingsResults.passedTests}/${listingsResults.totalTests}`);
    console.log(`   Rental Orders API: ${ordersResults.passedTests}/${ordersResults.totalTests}`);
    console.log(`   Offers API: ${offersResults.passedTests}/${offersResults.totalTests}`);
    console.log(`   Reviews API: ${reviewsResults.passedTests}/${reviewsResults.totalTests}`);
    console.log(`   Total: ${totalPassed}/${totalTests}`);
    console.log(`   Success Rate: ${Math.round((totalPassed / totalTests) * 100)}%`);

    if (totalPassed === totalTests) {
      console.log('\n🎉 All API tests passed! Marketplace API is ready.');
      return true;
    } else {
      console.log('\n⚠️  Some API tests failed. Please review the errors above.');
      return false;
    }

  } catch (error) {
    console.error('💥 Unexpected error:', error);
    return false;
  } finally {
    // Clean up test data
    await cleanupTestData();
  }
}

// Run the tests
testMarketplaceAPI()
  .then(success => {
    if (success) {
      console.log('\n✅ Marketplace API testing complete!');
      process.exit(0);
    } else {
      console.log('\n❌ API testing failed.');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });

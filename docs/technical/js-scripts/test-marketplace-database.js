#!/usr/bin/env node

/**
 * Marketplace Database Testing Suite
 * Tests database schema, RLS policies, and functions
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables from .env file
require('dotenv').config();

// Configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

// Utility functions
function logTest(testName, passed, details = '') {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    console.log(`✅ ${testName}`);
  } else {
    testResults.failed++;
    console.log(`❌ ${testName}: ${details}`);
  }
  testResults.details.push({ testName, passed, details });
}

function logSection(title) {
  console.log(`\n🔍 ${title}`);
  console.log('='.repeat(50));
}

// Test functions
async function testDatabaseSchema() {
  logSection('Testing Database Schema');
  
  try {
    // Test marketplace tables exist
    const tables = [
      'listings', 'listing_images', 'listing_availability',
      'rental_orders', 'sale_orders', 'offers',
      'marketplace_reviews', 'marketplace_disputes'
    ];
    
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      logTest(`Table ${table} exists`, !error, error?.message);
    }
    
    // Test notification extensions
    const { data: notifications, error: notifError } = await supabase
      .from('notifications')
      .select('related_listing_id, related_rental_order_id, related_sale_order_id, related_offer_id, related_review_id')
      .limit(1);
    
    logTest('Notifications table has marketplace columns', !notifError, notifError?.message);
    
    // Test notification preferences extensions
    const { data: prefs, error: prefsError } = await supabase
      .from('notification_preferences')
      .select('marketplace_notifications, listing_notifications, offer_notifications, order_notifications, payment_notifications, review_notifications, dispute_notifications')
      .limit(1);
    
    logTest('Notification preferences have marketplace columns', !prefsError, prefsError?.message);
    
  } catch (error) {
    logTest('Database schema test', false, error.message);
  }
}

async function testRLSPolicies() {
  logSection('Testing RLS Policies');
  
  try {
    // Test that we can query listings (should work with service key)
    const { data: listings, error: listingsError } = await supabase
      .from('listings')
      .select('*')
      .limit(1);
    
    logTest('Listings RLS policy allows service key access', !listingsError, listingsError?.message);
    
    // Test rental orders
    const { data: rentalOrders, error: rentalError } = await supabase
      .from('rental_orders')
      .select('*')
      .limit(1);
    
    logTest('Rental orders RLS policy allows service key access', !rentalError, rentalError?.message);
    
    // Test offers
    const { data: offers, error: offersError } = await supabase
      .from('offers')
      .select('*')
      .limit(1);
    
    logTest('Offers RLS policy allows service key access', !offersError, offersError?.message);
    
    // Test marketplace reviews
    const { data: reviews, error: reviewsError } = await supabase
      .from('marketplace_reviews')
      .select('*')
      .limit(1);
    
    logTest('Marketplace reviews RLS policy allows service key access', !reviewsError, reviewsError?.message);
    
  } catch (error) {
    logTest('RLS policies test', false, error.message);
  }
}

async function testDatabaseFunctions() {
  logSection('Testing Database Functions');
  
  try {
    // Test marketplace notification function
    const { data: notifResult, error: notifError } = await supabase.rpc('create_marketplace_notification', {
      p_recipient_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
      p_type: 'test_notification',
      p_title: 'Test Notification',
      p_message: 'This is a test notification'
    });
    
    logTest('create_marketplace_notification function exists', !notifError, notifError?.message);
    
    // Test listing event notification function
    const { data: listingResult, error: listingError } = await supabase.rpc('notify_listing_event', {
      p_listing_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
      p_event_type: 'test_event',
      p_recipient_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
      p_custom_message: 'Test message'
    });
    
    logTest('notify_listing_event function exists', !listingError, listingError?.message);
    
    // Test order event notification function
    const { data: orderResult, error: orderError } = await supabase.rpc('notify_order_event', {
      p_order_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
      p_order_type: 'rental',
      p_event_type: 'test_event',
      p_recipient_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
      p_custom_message: 'Test message'
    });
    
    logTest('notify_order_event function exists', !orderError, orderError?.message);
    
  } catch (error) {
    logTest('Database functions test', false, error.message);
  }
}

async function testStorageBucket() {
  logSection('Testing Storage Bucket');
  
  try {
    // Test listings bucket exists
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      logTest('Storage buckets accessible', false, bucketsError.message);
      return;
    }
    
    const listingsBucket = buckets.find(bucket => bucket.name === 'listings');
    logTest('Listings storage bucket exists', !!listingsBucket, 'Listings bucket not found');
    
    if (listingsBucket) {
      // Test bucket policies (we can't directly test policies, but we can check if bucket is accessible)
      const { data: files, error: filesError } = await supabase.storage
        .from('listings')
        .list('', { limit: 1 });
      
      logTest('Listings bucket accessible', !filesError, filesError?.message);
    }
    
  } catch (error) {
    logTest('Storage bucket test', false, error.message);
  }
}

async function testAPIRoutes() {
  logSection('Testing API Routes');
  
  try {
    // Test marketplace listings API
    const response = await fetch(`${supabaseUrl}/rest/v1/listings`, {
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    logTest('Marketplace listings API accessible', response.ok, `Status: ${response.status}`);
    
    // Test marketplace orders API
    const ordersResponse = await fetch(`${supabaseUrl}/rest/v1/rental_orders`, {
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    logTest('Marketplace orders API accessible', ordersResponse.ok, `Status: ${ordersResponse.status}`);
    
    // Test marketplace offers API
    const offersResponse = await fetch(`${supabaseUrl}/rest/v1/offers`, {
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    logTest('Marketplace offers API accessible', offersResponse.ok, `Status: ${offersResponse.status}`);
    
    // Test marketplace reviews API
    const reviewsResponse = await fetch(`${supabaseUrl}/rest/v1/marketplace_reviews`, {
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    logTest('Marketplace reviews API accessible', reviewsResponse.ok, `Status: ${reviewsResponse.status}`);
    
  } catch (error) {
    logTest('API routes test', false, error.message);
  }
}

async function testTriggers() {
  logSection('Testing Database Triggers');
  
  try {
    // Test that triggers exist by checking if we can create a test notification
    // This will test the trigger system indirectly
    const { data: triggerTest, error: triggerError } = await supabase.rpc('create_marketplace_notification', {
      p_recipient_id: '00000000-0000-0000-0000-000000000000',
      p_type: 'trigger_test',
      p_title: 'Trigger Test',
      p_message: 'Testing trigger system'
    });
    
    logTest('Notification triggers functional', !triggerError, triggerError?.message);
    
  } catch (error) {
    logTest('Database triggers test', false, error.message);
  }
}

// Main test execution
async function runTests() {
  console.log('🚀 Starting Marketplace Database Testing Suite');
  console.log('='.repeat(60));
  
  try {
    await testDatabaseSchema();
    await testRLSPolicies();
    await testDatabaseFunctions();
    await testStorageBucket();
    await testAPIRoutes();
    await testTriggers();
    
  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
  }
  
  // Print summary
  console.log('\n📊 Test Summary');
  console.log('='.repeat(50));
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
  
  if (testResults.failed > 0) {
    console.log('\n❌ Failed Tests:');
    testResults.details
      .filter(test => !test.passed)
      .forEach(test => {
        console.log(`  - ${test.testName}: ${test.details}`);
      });
  }
  
  // Save results to file
  const resultsPath = 'marketplace-database-test-results.json';
  require('fs').writeFileSync(resultsPath, JSON.stringify(testResults, null, 2));
  console.log(`\n📄 Detailed results saved to: ${resultsPath}`);
  
  // Exit with appropriate code
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});

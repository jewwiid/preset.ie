#!/usr/bin/env node

/**
 * Comprehensive Marketplace Testing Suite
 * Tests all marketplace functionality including database, API, and integration
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuration
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
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
    
  } catch (error) {
    logTest('API routes test', false, error.message);
  }
}

async function testFileStructure() {
  logSection('Testing File Structure');
  
  try {
    // Test marketplace pages exist
    const pages = [
      'apps/web/app/marketplace/page.tsx',
      'apps/web/app/marketplace/create/page.tsx',
      'apps/web/app/marketplace/listings/[id]/page.tsx',
      'apps/web/app/marketplace/my-listings/page.tsx',
      'apps/web/app/marketplace/orders/page.tsx'
    ];
    
    for (const page of pages) {
      const exists = fs.existsSync(page);
      logTest(`Page ${page} exists`, exists, 'File not found');
    }
    
    // Test marketplace components exist
    const components = [
      'apps/web/components/marketplace/MarketplaceLayout.tsx',
      'apps/web/components/marketplace/ListingCard.tsx',
      'apps/web/components/marketplace/ListingsGrid.tsx',
      'apps/web/components/marketplace/MarketplaceFilters.tsx',
      'apps/web/components/marketplace/CreateListingForm.tsx',
      'apps/web/components/marketplace/MarketplaceMessaging.tsx',
      'apps/web/components/marketplace/PaymentModal.tsx',
      'apps/web/components/marketplace/VerificationBadge.tsx',
      'apps/web/components/marketplace/SafetyDisclaimer.tsx',
      'apps/web/components/marketplace/SafetyFeatures.tsx',
      'apps/web/components/marketplace/MarketplaceNotifications.tsx'
    ];
    
    for (const component of components) {
      const exists = fs.existsSync(component);
      logTest(`Component ${component} exists`, exists, 'File not found');
    }
    
    // Test API routes exist
    const apiRoutes = [
      'apps/web/app/api/marketplace/listings/route.ts',
      'apps/web/app/api/marketplace/listings/[id]/route.ts',
      'apps/web/app/api/marketplace/rental-orders/route.ts',
      'apps/web/app/api/marketplace/rental-orders/[id]/route.ts',
      'apps/web/app/api/marketplace/offers/route.ts',
      'apps/web/app/api/marketplace/offers/[id]/route.ts',
      'apps/web/app/api/marketplace/reviews/route.ts',
      'apps/web/app/api/marketplace/payments/process/route.ts',
      'apps/web/app/api/marketplace/messages/conversations/route.ts',
      'apps/web/app/api/marketplace/messages/send/route.ts',
      'apps/web/app/api/marketplace/notifications/route.ts'
    ];
    
    for (const route of apiRoutes) {
      const exists = fs.existsSync(route);
      logTest(`API route ${route} exists`, exists, 'File not found');
    }
    
    // Test migrations exist
    const migrations = [
      'supabase/migrations/092_marketplace_schema.sql',
      'supabase/migrations/093_marketplace_messaging_integration.sql',
      'supabase/migrations/094_marketplace_notifications_extension.sql'
    ];
    
    for (const migration of migrations) {
      const exists = fs.existsSync(migration);
      logTest(`Migration ${migration} exists`, exists, 'File not found');
    }
    
  } catch (error) {
    logTest('File structure test', false, error.message);
  }
}

async function testNavigationIntegration() {
  logSection('Testing Navigation Integration');
  
  try {
    // Test NavBar component has marketplace integration
    const navBarPath = 'apps/web/components/NavBar.tsx';
    const navBarContent = fs.readFileSync(navBarPath, 'utf8');
    
    const hasMarketplaceImport = navBarContent.includes('Store') || navBarContent.includes('ShoppingBag');
    logTest('NavBar has marketplace icons imported', hasMarketplaceImport, 'Marketplace icons not imported');
    
    const hasMarketplaceDropdown = navBarContent.includes('Marketplace Dropdown');
    logTest('NavBar has marketplace dropdown', hasMarketplaceDropdown, 'Marketplace dropdown not found');
    
    const hasMarketplaceMobile = navBarContent.includes('Marketplace Section');
    logTest('NavBar has marketplace mobile navigation', hasMarketplaceMobile, 'Marketplace mobile navigation not found');
    
    // Test dashboard has marketplace notifications
    const dashboardPath = 'apps/web/app/dashboard/page.tsx';
    const dashboardContent = fs.readFileSync(dashboardPath, 'utf8');
    
    const hasMarketplaceNotifications = dashboardContent.includes('MarketplaceNotifications');
    logTest('Dashboard has marketplace notifications', hasMarketplaceNotifications, 'Marketplace notifications not found');
    
  } catch (error) {
    logTest('Navigation integration test', false, error.message);
  }
}

async function testSafetyFeatures() {
  logSection('Testing Safety Features');
  
  try {
    // Test safety components exist
    const safetyComponents = [
      'apps/web/components/marketplace/VerificationBadge.tsx',
      'apps/web/components/marketplace/SafetyDisclaimer.tsx',
      'apps/web/components/marketplace/SafetyFeatures.tsx'
    ];
    
    for (const component of safetyComponents) {
      const exists = fs.existsSync(component);
      logTest(`Safety component ${component} exists`, exists, 'File not found');
    }
    
    // Test safety features are integrated in listing detail page
    const listingDetailPath = 'apps/web/app/marketplace/listings/[id]/page.tsx';
    const listingDetailContent = fs.readFileSync(listingDetailPath, 'utf8');
    
    const hasSafetyFeatures = listingDetailContent.includes('SafetyFeatures');
    logTest('Listing detail page has safety features', hasSafetyFeatures, 'Safety features not integrated');
    
    const hasVerificationBadge = listingDetailContent.includes('VerificationBadge');
    logTest('Listing detail page has verification badge', hasVerificationBadge, 'Verification badge not integrated');
    
    // Test safety disclaimer in marketplace page
    const marketplacePath = 'apps/web/app/marketplace/page.tsx';
    const marketplaceContent = fs.readFileSync(marketplacePath, 'utf8');
    
    const hasSafetyDisclaimer = marketplaceContent.includes('SafetyDisclaimer');
    logTest('Marketplace page has safety disclaimer', hasSafetyDisclaimer, 'Safety disclaimer not integrated');
    
  } catch (error) {
    logTest('Safety features test', false, error.message);
  }
}

async function testMessagingIntegration() {
  logSection('Testing Messaging Integration');
  
  try {
    // Test messaging components exist
    const messagingComponents = [
      'apps/web/components/marketplace/MarketplaceMessaging.tsx'
    ];
    
    for (const component of messagingComponents) {
      const exists = fs.existsSync(component);
      logTest(`Messaging component ${component} exists`, exists, 'File not found');
    }
    
    // Test messaging API routes exist
    const messagingRoutes = [
      'apps/web/app/api/marketplace/messages/conversations/route.ts',
      'apps/web/app/api/marketplace/messages/send/route.ts'
    ];
    
    for (const route of messagingRoutes) {
      const exists = fs.existsSync(route);
      logTest(`Messaging API route ${route} exists`, exists, 'File not found');
    }
    
    // Test messaging integration in listing detail page
    const listingDetailPath = 'apps/web/app/marketplace/listings/[id]/page.tsx';
    const listingDetailContent = fs.readFileSync(listingDetailPath, 'utf8');
    
    const hasMessaging = listingDetailContent.includes('MarketplaceMessaging');
    logTest('Listing detail page has messaging integration', hasMessaging, 'Messaging not integrated');
    
  } catch (error) {
    logTest('Messaging integration test', false, error.message);
  }
}

async function testPaymentIntegration() {
  logSection('Testing Payment Integration');
  
  try {
    // Test payment components exist
    const paymentComponents = [
      'apps/web/components/marketplace/PaymentModal.tsx'
    ];
    
    for (const component of paymentComponents) {
      const exists = fs.existsSync(component);
      logTest(`Payment component ${component} exists`, exists, 'File not found');
    }
    
    // Test payment API routes exist
    const paymentRoutes = [
      'apps/web/app/api/marketplace/payments/process/route.ts'
    ];
    
    for (const route of paymentRoutes) {
      const exists = fs.existsSync(route);
      logTest(`Payment API route ${route} exists`, exists, 'File not found');
    }
    
  } catch (error) {
    logTest('Payment integration test', false, error.message);
  }
}

async function testNotificationSystem() {
  logSection('Testing Notification System');
  
  try {
    // Test notification components exist
    const notificationComponents = [
      'apps/web/components/marketplace/MarketplaceNotifications.tsx'
    ];
    
    for (const component of notificationComponents) {
      const exists = fs.existsSync(component);
      logTest(`Notification component ${component} exists`, exists, 'File not found');
    }
    
    // Test notification API routes exist
    const notificationRoutes = [
      'apps/web/app/api/marketplace/notifications/route.ts'
    ];
    
    for (const route of notificationRoutes) {
      const exists = fs.existsSync(route);
      logTest(`Notification API route ${route} exists`, exists, 'File not found');
    }
    
    // Test notification integration in dashboard
    const dashboardPath = 'apps/web/app/dashboard/page.tsx';
    const dashboardContent = fs.readFileSync(dashboardPath, 'utf8');
    
    const hasNotifications = dashboardContent.includes('MarketplaceNotifications');
    logTest('Dashboard has marketplace notifications', hasNotifications, 'Marketplace notifications not integrated');
    
  } catch (error) {
    logTest('Notification system test', false, error.message);
  }
}

// Main test execution
async function runTests() {
  console.log('🚀 Starting Comprehensive Marketplace Testing Suite');
  console.log('='.repeat(60));
  
  try {
    await testDatabaseSchema();
    await testRLSPolicies();
    await testDatabaseFunctions();
    await testStorageBucket();
    await testAPIRoutes();
    await testFileStructure();
    await testNavigationIntegration();
    await testSafetyFeatures();
    await testMessagingIntegration();
    await testPaymentIntegration();
    await testNotificationSystem();
    
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
  const resultsPath = 'marketplace-test-results.json';
  fs.writeFileSync(resultsPath, JSON.stringify(testResults, null, 2));
  console.log(`\n📄 Detailed results saved to: ${resultsPath}`);
  
  // Exit with appropriate code
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});

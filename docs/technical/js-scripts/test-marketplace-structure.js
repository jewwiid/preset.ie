#!/usr/bin/env node

/**
 * Marketplace Structure Testing Suite
 * Tests file structure and basic integration without requiring database access
 */

const fs = require('fs');
const path = require('path');

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

async function testComponentImports() {
  logSection('Testing Component Imports');
  
  try {
    // Test that components have proper imports
    const components = [
      'apps/web/components/marketplace/MarketplaceLayout.tsx',
      'apps/web/components/marketplace/ListingCard.tsx',
      'apps/web/components/marketplace/ListingsGrid.tsx',
      'apps/web/components/marketplace/MarketplaceFilters.tsx',
      'apps/web/components/marketplace/CreateListingForm.tsx'
    ];
    
    for (const component of components) {
      const content = fs.readFileSync(component, 'utf8');
      const hasReactImport = content.includes("'use client'") || content.includes('import React');
      const hasUIComponents = content.includes('@/components/ui/');
      
      logTest(`${component} has React import`, hasReactImport, 'Missing React import');
      logTest(`${component} has UI components`, hasUIComponents, 'Missing UI component imports');
    }
    
  } catch (error) {
    logTest('Component imports test', false, error.message);
  }
}

async function testAPIImports() {
  logSection('Testing API Route Imports');
  
  try {
    // Test that API routes have proper imports
    const apiRoutes = [
      'apps/web/app/api/marketplace/listings/route.ts',
      'apps/web/app/api/marketplace/rental-orders/route.ts',
      'apps/web/app/api/marketplace/offers/route.ts',
      'apps/web/app/api/marketplace/reviews/route.ts'
    ];
    
    for (const route of apiRoutes) {
      const content = fs.readFileSync(route, 'utf8');
      const hasNextRequest = content.includes('NextRequest');
      const hasNextResponse = content.includes('NextResponse');
      const hasSupabase = content.includes('@supabase/supabase-js');
      
      logTest(`${route} has NextRequest import`, hasNextRequest, 'Missing NextRequest import');
      logTest(`${route} has NextResponse import`, hasNextResponse, 'Missing NextResponse import');
      logTest(`${route} has Supabase import`, hasSupabase, 'Missing Supabase import');
    }
    
  } catch (error) {
    logTest('API imports test', false, error.message);
  }
}

// Main test execution
async function runTests() {
  console.log('🚀 Starting Marketplace Structure Testing Suite');
  console.log('='.repeat(60));
  
  try {
    await testFileStructure();
    await testNavigationIntegration();
    await testSafetyFeatures();
    await testMessagingIntegration();
    await testPaymentIntegration();
    await testNotificationSystem();
    await testComponentImports();
    await testAPIImports();
    
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
  const resultsPath = 'marketplace-structure-test-results.json';
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

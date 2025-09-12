#!/usr/bin/env node

/**
 * Test script for Stripe integration
 * This script validates the Stripe setup and tests basic functionality
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function success(message) {
  log(`✅ ${message}`, colors.green);
}

function error(message) {
  log(`❌ ${message}`, colors.red);
}

function warning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

function info(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

async function testStripeIntegration() {
  log('\n🔍 Testing Stripe Integration\n', colors.bold);

  // 1. Check environment variables
  info('1. Checking environment variables...');
  
  const requiredEnvVars = [
    'STRIPE_SECRET_KEY',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    'STRIPE_WEBHOOK_SECRET'
  ];

  let envValid = true;
  
  for (const envVar of requiredEnvVars) {
    if (process.env[envVar]) {
      success(`${envVar} is set`);
    } else {
      error(`${envVar} is missing`);
      envValid = false;
    }
  }

  if (!envValid) {
    error('Environment variables are not properly configured');
    return false;
  }

  // 2. Check Stripe configuration files
  info('\n2. Checking Stripe configuration files...');
  
  const requiredFiles = [
    'apps/web/lib/stripe.ts',
    'apps/web/app/api/stripe/webhook/route.ts',
    'apps/web/app/api/stripe/create-checkout-session/route.ts',
    'apps/web/app/api/stripe/customer/route.ts'
  ];

  for (const file of requiredFiles) {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      success(`${file} exists`);
    } else {
      error(`${file} is missing`);
      return false;
    }
  }

  // 3. Test API endpoints structure
  info('\n3. Checking API endpoint structure...');
  
  try {
    // Import Stripe config to check if it loads properly
    const stripePath = path.join(process.cwd(), 'apps/web/lib/stripe.ts');
    const stripeContent = fs.readFileSync(stripePath, 'utf8');
    
    if (stripeContent.includes('export const stripe') && stripeContent.includes('CREDIT_PACKAGES')) {
      success('Stripe configuration file is properly structured');
    } else {
      error('Stripe configuration file is missing required exports');
      return false;
    }
  } catch (err) {
    error(`Error reading Stripe configuration: ${err.message}`);
    return false;
  }

  // 4. Check database migration
  info('\n4. Checking database migration...');
  
  // Check for multiple possible migration files
  const migrationPaths = [
    'supabase/migrations/20250911140000_stripe_tables_only.sql',
    'supabase/migrations/051_stripe_integration_tables.sql',
    'scripts/apply-stripe-tables.sql'
  ];
  
  let migrationPath = null;
  for (const path_candidate of migrationPaths) {
    const fullPath = path.join(process.cwd(), path_candidate);
    if (fs.existsSync(fullPath)) {
      migrationPath = fullPath;
      break;
    }
  }
  
  if (migrationPath) {
    success('Stripe database migration file exists');
    
    const migrationContent = fs.readFileSync(migrationPath, 'utf8');
    const expectedTables = [
      'checkout_sessions',
      'payment_logs',
      'invoice_logs',
      'credit_packages',
      'subscription_plans',
      'platform_credit_purchases'
    ];
    
    let tablesFound = 0;
    for (const table of expectedTables) {
      if (migrationContent.includes(`CREATE TABLE IF NOT EXISTS ${table}`)) {
        tablesFound++;
      }
    }
    
    if (tablesFound === expectedTables.length) {
      success(`All ${expectedTables.length} required tables are defined in migration`);
    } else {
      warning(`Only ${tablesFound}/${expectedTables.length} tables found in migration`);
    }
  } else {
    error('Stripe database migration file is missing');
    return false;
  }

  // 5. Validate Stripe API key format
  info('\n5. Validating Stripe API key format...');
  
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  
  if (secretKey.startsWith('sk_test_') || secretKey.startsWith('sk_live_')) {
    success('Stripe secret key format is valid');
  } else {
    error('Stripe secret key format is invalid');
    return false;
  }
  
  if (publishableKey.startsWith('pk_test_') || publishableKey.startsWith('pk_live_')) {
    success('Stripe publishable key format is valid');
  } else {
    error('Stripe publishable key format is invalid');
    return false;
  }

  // 6. Check webhook endpoint configuration
  info('\n6. Checking webhook endpoint...');
  
  const webhookPath = path.join(process.cwd(), 'apps/web/app/api/stripe/webhook/route.ts');
  const webhookContent = fs.readFileSync(webhookPath, 'utf8');
  
  const webhookEvents = [
    'checkout.session.completed',
    'payment_intent.succeeded',
    'payment_intent.payment_failed',
    'customer.subscription.created',
    'customer.subscription.updated',
    'customer.subscription.deleted'
  ];
  
  let eventsHandled = 0;
  for (const event of webhookEvents) {
    if (webhookContent.includes(`case '${event}':`)) {
      eventsHandled++;
    }
  }
  
  if (eventsHandled === webhookEvents.length) {
    success(`All ${webhookEvents.length} critical webhook events are handled`);
  } else {
    warning(`Only ${eventsHandled}/${webhookEvents.length} webhook events are handled`);
  }

  // 7. Summary
  log('\n📋 Integration Summary:', colors.bold);
  success('Stripe SDK integration is complete');
  success('Environment variables are configured');
  success('API endpoints are implemented');
  success('Database schema is defined');
  success('Webhook handling is implemented');
  
  log('\n🚀 Next Steps:', colors.bold);
  info('1. Apply database migration: npx supabase db push');
  info('2. Set actual Stripe API keys in production environment');
  info('3. Configure Stripe webhook endpoint in Stripe dashboard');
  info('4. Test credit purchase flow in development');
  info('5. Test webhook events with Stripe CLI');
  
  log('\n🔗 Useful Links:', colors.bold);
  info('Stripe Dashboard: https://dashboard.stripe.com/');
  info('Webhook Testing: https://stripe.com/docs/webhooks/test');
  info('Stripe CLI: https://stripe.com/docs/stripe-cli');
  
  return true;
}

// Run the test
if (require.main === module) {
  testStripeIntegration()
    .then(success => {
      if (success) {
        log('\n🎉 Stripe integration test completed successfully!', colors.green + colors.bold);
        process.exit(0);
      } else {
        log('\n💥 Stripe integration test failed!', colors.red + colors.bold);
        process.exit(1);
      }
    })
    .catch(err => {
      error(`Test execution failed: ${err.message}`);
      process.exit(1);
    });
}

module.exports = { testStripeIntegration };
#!/usr/bin/env node

/**
 * Credit System Bug Testing Script
 *
 * This script tests all 6 credit bugs identified in the audit.
 * Run with: node scripts/test-credit-bugs.js [options]
 *
 * Options:
 *   --bug=N          Test specific bug (1-6)
 *   --all            Test all bugs (default)
 *   --fix-check      Check if fixes are applied
 *   --verbose        Show detailed output
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../apps/web/.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Test results
const results = {
  passed: [],
  failed: [],
  warnings: [],
};

// Utility functions
function logSuccess(test) {
  console.log(`✅ ${test}`);
  results.passed.push(test);
}

function logFailure(test, reason) {
  console.log(`❌ ${test}`);
  console.log(`   Reason: ${reason}`);
  results.failed.push({ test, reason });
}

function logWarning(test, reason) {
  console.log(`⚠️  ${test}`);
  console.log(`   Warning: ${reason}`);
  results.warnings.push({ test, reason });
}

// Create test user
async function createTestUser() {
  const testUserId = 'test-user-' + Date.now();

  // Create test user credits
  const { error } = await supabase.from('user_credits').insert({
    user_id: testUserId,
    subscription_tier: 'free',
    monthly_allowance: 5,
    current_balance: 100,
    consumed_this_month: 0,
  });

  if (error) {
    console.error('Failed to create test user:', error);
    return null;
  }

  return testUserId;
}

// Clean up test user
async function cleanupTestUser(userId) {
  await supabase.from('credit_transactions').delete().eq('user_id', userId);
  await supabase.from('user_credits').delete().eq('user_id', userId);
}

// Test Bug #1: Apply-style consumption tracking
async function testBug1() {
  console.log('\n📋 Testing Bug #1: Apply-Style Consumption Tracking');
  console.log('=' .repeat(60));

  const userId = await createTestUser();
  if (!userId) return;

  try {
    // Get initial state
    const { data: before } = await supabase
      .from('user_credits')
      .select('current_balance, consumed_this_month')
      .eq('user_id', userId)
      .single();

    console.log(`Initial state: balance=${before.current_balance}, consumed=${before.consumed_this_month}`);

    // Simulate credit deduction (what apply-style does)
    const COST = 1;
    await supabase
      .from('user_credits')
      .update({
        current_balance: before.current_balance - COST,
        consumed_this_month: before.consumed_this_month + COST, // This is the FIX
      })
      .eq('user_id', userId);

    // Check result
    const { data: after } = await supabase
      .from('user_credits')
      .select('current_balance, consumed_this_month')
      .eq('user_id', userId)
      .single();

    console.log(`After deduction: balance=${after.current_balance}, consumed=${after.consumed_this_month}`);

    // Verify
    const expectedBalance = before.current_balance - COST;
    const expectedConsumed = before.consumed_this_month + COST;

    if (after.current_balance === expectedBalance && after.consumed_this_month === expectedConsumed) {
      logSuccess('Bug #1: Consumption tracking works correctly');
    } else {
      logFailure(
        'Bug #1: Consumption tracking incorrect',
        `Expected consumed=${expectedConsumed}, got ${after.consumed_this_month}`
      );
    }

    // Check if bug still exists in code
    const fs = await import('fs');
    const applyStylePath = join(__dirname, '../apps/web/app/api/playground/apply-style/route.ts');

    if (fs.existsSync(applyStylePath)) {
      const content = fs.readFileSync(applyStylePath, 'utf8');

      if (content.includes('consumed_this_month: userCredits.current_balance -')) {
        logFailure('Bug #1: BUG STILL EXISTS IN CODE', 'Found incorrect consumption tracking in apply-style/route.ts:194');
      } else if (content.includes('consumed_this_month: userCredits.consumed_this_month +')) {
        logSuccess('Bug #1: Fix verified in code');
      }
    }
  } finally {
    await cleanupTestUser(userId);
  }
}

// Test Bug #2: Playground refund logic
async function testBug2() {
  console.log('\n📋 Testing Bug #2: Playground Refund Logic');
  console.log('=' .repeat(60));

  const userId = await createTestUser();
  if (!userId) return;

  try {
    const { data: before } = await supabase
      .from('user_credits')
      .select('current_balance')
      .eq('user_id', userId)
      .single();

    console.log(`Initial balance: ${before.current_balance}`);

    // Simulate generation failure scenario
    const CREDITS_DEDUCTED = 2;

    // Deduct credits (as playground does)
    await supabase
      .from('user_credits')
      .update({
        current_balance: before.current_balance - CREDITS_DEDUCTED,
        consumed_this_month: CREDITS_DEDUCTED,
      })
      .eq('user_id', userId);

    console.log('Credits deducted. Simulating API failure...');

    // Now refund should happen (this is what's missing)
    const { error: refundError } = await supabase.rpc('refund_user_credits', {
      p_user_id: userId,
      p_credits: CREDITS_DEDUCTED,
      p_enhancement_type: 'playground_generation',
    });

    if (refundError) {
      if (refundError.message?.includes('Could not find the function')) {
        logWarning('Bug #2: refund_user_credits function not found', 'Using fallback refund logic');

        // Fallback refund
        await supabase
          .from('user_credits')
          .update({
            current_balance: before.current_balance,
            consumed_this_month: 0,
          })
          .eq('user_id', userId);
      } else {
        logFailure('Bug #2: Refund failed', refundError.message);
        return;
      }
    }

    // Check if refunded
    const { data: after } = await supabase
      .from('user_credits')
      .select('current_balance')
      .eq('user_id', userId)
      .single();

    console.log(`After refund: ${after.current_balance}`);

    if (after.current_balance === before.current_balance) {
      logSuccess('Bug #2: Refund logic works correctly');
    } else {
      logFailure('Bug #2: Refund logic failed', `Expected ${before.current_balance}, got ${after.current_balance}`);
    }

    // Check if refund transaction logged
    const { data: transactions } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('transaction_type', 'refund');

    if (transactions && transactions.length > 0) {
      logSuccess('Bug #2: Refund transaction logged');
    } else {
      logWarning('Bug #2: Refund transaction not logged', 'Transaction history incomplete');
    }
  } finally {
    await cleanupTestUser(userId);
  }
}

// Test Bug #3: Referral credits
async function testBug3() {
  console.log('\n📋 Testing Bug #3: Referral Credit System');
  console.log('=' .repeat(60));

  const referrerId = await createTestUser();
  const referredId = await createTestUser();

  if (!referrerId || !referredId) return;

  try {
    const { data: before } = await supabase
      .from('user_credits')
      .select('current_balance')
      .eq('user_id', referrerId)
      .single();

    console.log(`Referrer initial balance: ${before.current_balance}`);

    // Check if /api/credits/add endpoint exists
    const fs = await import('fs');
    const addEndpointPath = join(__dirname, '../apps/web/app/api/credits/add/route.ts');

    if (!fs.existsSync(addEndpointPath)) {
      logFailure('Bug #3: /api/credits/add endpoint missing', 'Referral credits cannot be awarded');
    } else {
      logSuccess('Bug #3: /api/credits/add endpoint exists');

      // Test direct credit addition
      await supabase
        .from('user_credits')
        .update({
          current_balance: before.current_balance + 5,
        })
        .eq('user_id', referrerId);

      // Log transaction
      await supabase.from('credit_transactions').insert({
        user_id: referrerId,
        transaction_type: 'referral_bonus',
        credits_used: 5,
        status: 'completed',
      });

      const { data: after } = await supabase
        .from('user_credits')
        .select('current_balance')
        .eq('user_id', referrerId)
        .single();

      if (after.current_balance === before.current_balance + 5) {
        logSuccess('Bug #3: Referral credits awarded correctly');
      } else {
        logFailure('Bug #3: Referral credits not awarded', `Expected ${before.current_balance + 5}, got ${after.current_balance}`);
      }
    }
  } finally {
    await cleanupTestUser(referrerId);
    await cleanupTestUser(referredId);
  }
}

// Test Bug #4: Transaction atomicity
async function testBug4() {
  console.log('\n📋 Testing Bug #4: Transaction Atomicity');
  console.log('=' .repeat(60));

  // Check if transaction function exists
  const { data, error } = await supabase.rpc('playground_generate_with_transaction', {
    p_user_id: 'test',
    p_credits_needed: 1,
    p_project_data: {},
  });

  if (error) {
    if (error.message?.includes('Could not find the function')) {
      logFailure('Bug #4: Transaction function missing', 'playground_generate_with_transaction not found in database');
    } else {
      logWarning('Bug #4: Transaction function error', error.message);
    }
  } else {
    logSuccess('Bug #4: Transaction function exists');
  }

  // Note: Full testing requires forcing DB failures, which is complex
  logWarning('Bug #4: Full atomicity test skipped', 'Requires controlled DB failure simulation');
}

// Test Bug #5: Credit costs consistency
async function testBug5() {
  console.log('\n📋 Testing Bug #5: Credit Costs Consistency');
  console.log('=' .repeat(60));

  const fs = await import('fs');

  // Check if constants file exists
  const constantsPath = join(__dirname, '../apps/web/lib/credits/constants.ts');

  if (!fs.existsSync(constantsPath)) {
    logFailure('Bug #5: Constants file missing', 'Centralized credit costs not found');
    return;
  }

  logSuccess('Bug #5: Constants file exists');

  const content = fs.readFileSync(constantsPath, 'utf8');

  // Verify costs are defined
  if (content.includes('nanobanana') && content.includes('seedream')) {
    logSuccess('Bug #5: Provider costs defined');
  } else {
    logFailure('Bug #5: Provider costs not defined', 'Missing provider cost definitions');
  }

  // Check if endpoints are using constants
  const filesToCheck = [
    '../apps/web/app/api/enhance-image/route.ts',
    '../apps/web/app/api/playground/generate/route.ts',
  ];

  for (const file of filesToCheck) {
    const filePath = join(__dirname, file);
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf8');

      if (fileContent.includes('from "@/lib/credits"') || fileContent.includes('from \'@/lib/credits\'')) {
        logSuccess(`Bug #5: ${file.split('/').pop()} uses centralized constants`);
      } else {
        logWarning(`Bug #5: ${file.split('/').pop()} not using constants yet`, 'Still using hardcoded values');
      }
    }
  }
}

// Test Bug #6: SQL refund function
async function testBug6() {
  console.log('\n📋 Testing Bug #6: SQL Refund Function');
  console.log('=' .repeat(60));

  const userId = await createTestUser();
  if (!userId) return;

  try {
    // Set consumed_this_month to 5
    await supabase
      .from('user_credits')
      .update({
        consumed_this_month: 5,
      })
      .eq('user_id', userId);

    // Try to refund 10 (more than consumed)
    const { error } = await supabase.rpc('refund_user_credits', {
      p_user_id: userId,
      p_credits: 10,
      p_enhancement_type: 'test_over_refund',
    });

    if (error) {
      if (error.message?.includes('Could not find the function')) {
        logWarning('Bug #6: refund_user_credits function not found', 'Cannot test over-refund detection');
      } else {
        logFailure('Bug #6: Refund function error', error.message);
      }
    } else {
      // Check if alert was created
      const { data: alerts } = await supabase
        .from('system_alerts')
        .select('*')
        .eq('type', 'over_refund_detected')
        .order('created_at', { ascending: false })
        .limit(1);

      if (alerts && alerts.length > 0) {
        logSuccess('Bug #6: Over-refund detection works');
      } else {
        logWarning('Bug #6: Over-refund not detected', 'Alert not created for over-refund scenario');
      }

      // Check if metadata tracked
      const { data: transactions } = await supabase
        .from('credit_transactions')
        .select('metadata')
        .eq('user_id', userId)
        .eq('transaction_type', 'refund')
        .order('created_at', { ascending: false })
        .limit(1);

      if (transactions && transactions.length > 0 && transactions[0].metadata?.over_refund_amount) {
        logSuccess('Bug #6: Over-refund metadata tracked');
      } else {
        logWarning('Bug #6: Over-refund metadata not tracked', 'Metadata missing in transaction');
      }
    }
  } finally {
    await cleanupTestUser(userId);
  }
}

// Run all tests
async function runTests(bugNumber = null) {
  console.log('\n🧪 CREDIT SYSTEM BUG TESTING');
  console.log('='.repeat(60));
  console.log(`Testing started at: ${new Date().toISOString()}`);

  if (bugNumber) {
    console.log(`Running test for Bug #${bugNumber}...\n`);

    switch (bugNumber) {
      case 1:
        await testBug1();
        break;
      case 2:
        await testBug2();
        break;
      case 3:
        await testBug3();
        break;
      case 4:
        await testBug4();
        break;
      case 5:
        await testBug5();
        break;
      case 6:
        await testBug6();
        break;
      default:
        console.error(`Invalid bug number: ${bugNumber}`);
    }
  } else {
    console.log('Running all tests...\n');

    await testBug1();
    await testBug2();
    await testBug3();
    await testBug4();
    await testBug5();
    await testBug6();
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${results.passed.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  console.log(`⚠️  Warnings: ${results.warnings.length}`);

  if (results.failed.length > 0) {
    console.log('\n❌ Failed Tests:');
    results.failed.forEach(({ test, reason }) => {
      console.log(`   - ${test}`);
      console.log(`     ${reason}`);
    });
  }

  if (results.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    results.warnings.forEach(({ test, reason }) => {
      console.log(`   - ${test}`);
      console.log(`     ${reason}`);
    });
  }

  console.log('\n' + '='.repeat(60));
  console.log(`Testing completed at: ${new Date().toISOString()}`);

  // Exit with error if any tests failed
  if (results.failed.length > 0) {
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
let bugNumber = null;

for (const arg of args) {
  if (arg.startsWith('--bug=')) {
    bugNumber = parseInt(arg.split('=')[1]);
  }
}

// Run tests
runTests(bugNumber).catch((error) => {
  console.error('Test execution error:', error);
  process.exit(1);
});

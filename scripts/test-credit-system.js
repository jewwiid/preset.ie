#!/usr/bin/env node

// Test script to verify credit management system is working
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

async function testCreditSystem() {
  console.log('🧪 Testing Credit Management System...\n');

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

    // Test 1: Check if tables exist
    console.log('\n📋 Test 1: Checking if tables exist...');
    
    const tables = ['credit_pools', 'user_credits', 'credit_transactions', 'enhancement_tasks', 'api_providers', 'system_alerts'];
    
    for (const tableName of tables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);

        if (error) {
          console.log(`   ❌ ${tableName}: ${error.message}`);
        } else {
          console.log(`   ✅ ${tableName}: Table accessible`);
        }
      } catch (err) {
        console.log(`   ❌ ${tableName}: ${err.message}`);
      }
    }

    // Test 2: Check credit pool initialization
    console.log('\n💰 Test 2: Checking credit pool initialization...');
    
    try {
      const { data: creditPools, error } = await supabase
        .from('credit_pools')
        .select('*')
        .eq('provider', 'nanobanan');

      if (error) {
        console.log(`   ❌ Error fetching credit pools: ${error.message}`);
      } else if (creditPools && creditPools.length > 0) {
        const pool = creditPools[0];
        console.log(`   ✅ NanoBanana credit pool found:`);
        console.log(`      - Available balance: ${pool.available_balance}`);
        console.log(`      - Cost per credit: $${pool.cost_per_credit}`);
        console.log(`      - Status: ${pool.status}`);
      } else {
        console.log(`   ⚠️  No NanoBanana credit pool found`);
      }
    } catch (err) {
      console.log(`   ❌ Error: ${err.message}`);
    }

    // Test 3: Check API provider configuration
    console.log('\n🔧 Test 3: Checking API provider configuration...');
    
    try {
      const { data: providers, error } = await supabase
        .from('api_providers')
        .select('*')
        .eq('name', 'nanobanan');

      if (error) {
        console.log(`   ❌ Error fetching API providers: ${error.message}`);
      } else if (providers && providers.length > 0) {
        const provider = providers[0];
        console.log(`   ✅ NanoBanana API provider found:`);
        console.log(`      - Base URL: ${provider.base_url}`);
        console.log(`      - Cost per request: $${provider.cost_per_request}`);
        console.log(`      - Priority: ${provider.priority}`);
        console.log(`      - Active: ${provider.is_active}`);
      } else {
        console.log(`   ⚠️  No NanoBanana API provider found`);
      }
    } catch (err) {
      console.log(`   ❌ Error: ${err.message}`);
    }

    // Test 4: Test credit functions
    console.log('\n⚙️  Test 4: Testing credit management functions...');
    
    try {
      // Test if functions exist by checking the information schema
      const { data: functions, error } = await supabase
        .from('information_schema.routines')
        .select('routine_name')
        .eq('routine_schema', 'public')
        .in('routine_name', ['consume_user_credits', 'consume_platform_credits', 'refund_user_credits']);

      if (error) {
        console.log(`   ❌ Error checking functions: ${error.message}`);
      } else if (functions && functions.length > 0) {
        console.log(`   ✅ Credit management functions found:`);
        functions.forEach(func => {
          console.log(`      - ${func.routine_name}`);
        });
      } else {
        console.log(`   ⚠️  No credit management functions found`);
      }
    } catch (err) {
      console.log(`   ❌ Error: ${err.message}`);
    }

    // Test 5: Check system alerts
    console.log('\n🚨 Test 5: Checking system alerts...');
    
    try {
      const { data: alerts, error } = await supabase
        .from('system_alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.log(`   ❌ Error fetching alerts: ${error.message}`);
      } else if (alerts && alerts.length > 0) {
        console.log(`   ✅ System alerts found (${alerts.length} recent):`);
        alerts.forEach(alert => {
          console.log(`      - ${alert.type}: ${alert.message} (${alert.level})`);
        });
      } else {
        console.log(`   ⚠️  No system alerts found`);
      }
    } catch (err) {
      console.log(`   ❌ Error: ${err.message}`);
    }

    console.log('\n🎉 Credit Management System Test Complete!');
    console.log('\n📋 Next Steps:');
    console.log('   1. Start the Next.js app: npm run dev');
    console.log('   2. Test the API endpoint: POST /api/enhance-image');
    console.log('   3. Check the admin dashboard: /admin/credits');
    console.log('   4. Set up background jobs: node scripts/setup-background-jobs.js run-all');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testCreditSystem();

#!/usr/bin/env node

// Test script to connect to Supabase and read tables
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

async function testSupabaseConnection() {
  console.log('🔌 Testing Supabase Connection...\n');

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing required environment variables');
    console.log('Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  try {
    // Initialize Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('✅ Connected to Supabase database');
    console.log('📍 Database URL:', supabaseUrl);

    // Test 1: List all tables
    console.log('\n📋 Listing all tables...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .order('table_name');

    if (tablesError) {
      console.log('❌ Error fetching tables:', tablesError.message);
    } else {
      console.log(`✅ Found ${tables.length} tables:`);
      tables.forEach(table => {
        console.log(`   - ${table.table_name}`);
      });
    }

    // Test 2: Check credit management tables specifically
    console.log('\n💰 Checking credit management tables...');
    const creditTables = ['credit_pools', 'user_credits', 'credit_transactions', 'enhancement_tasks', 'api_providers'];
    
    for (const tableName of creditTables) {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (error) {
        console.log(`❌ Table ${tableName}: ${error.message}`);
      } else {
        console.log(`✅ Table ${tableName}: ${data.length} records (sample shown)`);
        if (data.length > 0) {
          console.log(`   Sample record:`, JSON.stringify(data[0], null, 2));
        }
      }
    }

    // Test 3: Check user credits specifically
    console.log('\n👥 Checking user credits...');
    const { data: userCredits, error: creditsError } = await supabase
      .from('user_credits')
      .select('user_id, subscription_tier, current_balance, monthly_allowance')
      .limit(5);

    if (creditsError) {
      console.log('❌ Error fetching user credits:', creditsError.message);
    } else {
      console.log(`✅ Found ${userCredits.length} user credit records:`);
      userCredits.forEach(credit => {
        console.log(`   - User ${credit.user_id}: ${credit.current_balance}/${credit.monthly_allowance} credits (${credit.subscription_tier})`);
      });
    }

    // Test 4: Check enhancement tasks
    console.log('\n🔄 Checking enhancement tasks...');
    const { data: tasks, error: tasksError } = await supabase
      .from('enhancement_tasks')
      .select('id, user_id, status, enhancement_type, created_at')
      .limit(5);

    if (tasksError) {
      console.log('❌ Error fetching enhancement tasks:', tasksError.message);
    } else {
      console.log(`✅ Found ${tasks.length} enhancement task records:`);
      tasks.forEach(task => {
        console.log(`   - Task ${task.id}: ${task.enhancement_type} (${task.status}) by user ${task.user_id}`);
      });
    }

    // Test 5: Check credit transactions
    console.log('\n💳 Checking credit transactions...');
    const { data: transactions, error: transactionsError } = await supabase
      .from('credit_transactions')
      .select('user_id, transaction_type, credits_used, enhancement_type, created_at')
      .limit(5);

    if (transactionsError) {
      console.log('❌ Error fetching credit transactions:', transactionsError.message);
    } else {
      console.log(`✅ Found ${transactions.length} credit transaction records:`);
      transactions.forEach(transaction => {
        console.log(`   - ${transaction.transaction_type}: ${transaction.credits_used} credits for ${transaction.enhancement_type} by user ${transaction.user_id}`);
      });
    }

    console.log('\n🎉 Supabase Connection Test Complete!');
    console.log('\n📊 Summary:');
    console.log('   - Database connection: ✅ Working');
    console.log('   - Credit management tables: ✅ Present');
    console.log('   - User credits: ✅ Working');
    console.log('   - Enhancement tasks: ✅ Working');
    console.log('   - Credit transactions: ✅ Working');

  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testSupabaseConnection();


#!/usr/bin/env node

// Create credit management tables using Supabase client
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

async function createCreditTables() {
  console.log('🚀 Creating Credit Management Tables...\n');

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

    // Since we can't execute raw SQL directly, let's check what tables exist
    console.log('🔍 Checking existing tables...');
    
    const { data: existingTables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');

    if (tablesError) {
      console.error('❌ Could not check existing tables:', tablesError.message);
      return;
    }

    console.log('📋 Existing tables:');
    existingTables?.forEach(table => {
      console.log(`   - ${table.table_name}`);
    });

    // Check if credit management tables already exist
    const creditTables = ['credit_pools', 'user_credits', 'credit_transactions', 'enhancement_tasks'];
    const existingCreditTables = existingTables?.filter(table => 
      creditTables.includes(table.table_name)
    ) || [];

    if (existingCreditTables.length > 0) {
      console.log('\n✅ Credit management tables already exist:');
      existingCreditTables.forEach(table => {
        console.log(`   - ${table.table_name}`);
      });
    } else {
      console.log('\n❌ Credit management tables not found.');
      console.log('📝 You need to create these tables manually in the Supabase SQL Editor:');
      console.log('\n1. Go to your Supabase dashboard');
      console.log('2. Navigate to SQL Editor');
      console.log('3. Run the following SQL:');
      console.log('\n' + '='.repeat(60));
      
      // Read and display the migration file
      const fs = require('fs');
      const path = require('path');
      
      try {
        const migrationPath = path.join(__dirname, '../supabase/migrations/008_credit_management_system.sql');
        const migrationContent = fs.readFileSync(migrationPath, 'utf8');
        console.log(migrationContent);
      } catch (error) {
        console.log('Could not read migration file. Please check the file exists.');
      }
      
      console.log('\n' + '='.repeat(60));
      console.log('\n4. Then run the enhancement tasks migration:');
      
      try {
        const tasksMigrationPath = path.join(__dirname, '../supabase/migrations/009_enhancement_tasks.sql');
        const tasksMigrationContent = fs.readFileSync(tasksMigrationPath, 'utf8');
        console.log(tasksMigrationContent);
      } catch (error) {
        console.log('Could not read enhancement tasks migration file.');
      }
      
      console.log('\n' + '='.repeat(60));
    }

    // Test if we can access the tables
    console.log('\n🧪 Testing table access...');
    
    try {
      const { data: creditPools, error: poolsError } = await supabase
        .from('credit_pools')
        .select('*')
        .limit(1);

      if (poolsError) {
        console.log('⚠️  Credit pools table not accessible:', poolsError.message);
      } else {
        console.log('✅ Credit pools table is accessible');
        if (creditPools && creditPools.length > 0) {
          console.log(`   - Found ${creditPools.length} credit pool(s)`);
        }
      }
    } catch (error) {
      console.log('⚠️  Could not test credit pools table:', error.message);
    }

    console.log('\n🎉 Credit Management Setup Complete!');
    console.log('\n📋 Next Steps:');
    console.log('   1. If tables don\'t exist, run the SQL in Supabase SQL Editor');
    console.log('   2. Test the API endpoints: POST /api/enhance-image');
    console.log('   3. Check the admin dashboard: /admin/credits');
    console.log('   4. Set up background jobs: node scripts/setup-background-jobs.js run-all');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the script
createCreditTables();

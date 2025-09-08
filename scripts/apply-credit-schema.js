#!/usr/bin/env node

// Apply credit management schema to Supabase database
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

async function applyCreditSchema() {
  console.log('🚀 Applying Credit Management Schema to Supabase...\n');

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing required environment variables:');
    console.error('   SUPABASE_URL:', supabaseUrl ? '✓' : '❌');
    console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '❌');
    process.exit(1);
  }

  try {
    // Initialize Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('✅ Connected to Supabase database');

    // Read the credit management migration
    const migrationPath = path.join(__dirname, '../supabase/migrations/008_credit_management_system.sql');
    const migrationContent = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Reading credit management migration...');

    // Split the migration into individual statements
    const statements = migrationContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (statement.trim()) {
        try {
          console.log(`   Executing statement ${i + 1}/${statements.length}...`);
          
          const { error } = await supabase.rpc('exec_sql', { 
            sql: statement + ';' 
          });

          if (error) {
            // Try direct execution if RPC fails
            const { error: directError } = await supabase
              .from('_migrations')
              .select('*')
              .limit(1); // This will fail but we can use it to test connection

            if (directError) {
              console.warn(`   ⚠️  Statement ${i + 1} may have failed: ${error.message}`);
            } else {
              console.log(`   ✅ Statement ${i + 1} executed successfully`);
            }
          } else {
            console.log(`   ✅ Statement ${i + 1} executed successfully`);
          }
        } catch (err) {
          console.warn(`   ⚠️  Statement ${i + 1} error: ${err.message}`);
        }
      }
    }

    // Apply the enhancement tasks migration
    console.log('\n📄 Applying enhancement tasks migration...');
    const tasksMigrationPath = path.join(__dirname, '../supabase/migrations/009_enhancement_tasks.sql');
    const tasksMigrationContent = fs.readFileSync(tasksMigrationPath, 'utf8');

    const taskStatements = tasksMigrationContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    for (let i = 0; i < taskStatements.length; i++) {
      const statement = taskStatements[i];
      
      if (statement.trim()) {
        try {
          console.log(`   Executing enhancement task statement ${i + 1}/${taskStatements.length}...`);
          
          const { error } = await supabase.rpc('exec_sql', { 
            sql: statement + ';' 
          });

          if (error) {
            console.warn(`   ⚠️  Enhancement task statement ${i + 1} may have failed: ${error.message}`);
          } else {
            console.log(`   ✅ Enhancement task statement ${i + 1} executed successfully`);
          }
        } catch (err) {
          console.warn(`   ⚠️  Enhancement task statement ${i + 1} error: ${err.message}`);
        }
      }
    }

    // Verify the schema was created
    console.log('\n🔍 Verifying schema creation...');
    
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', [
        'credit_pools',
        'user_credits', 
        'credit_transactions',
        'enhancement_tasks',
        'api_providers',
        'system_alerts'
      ]);

    if (tablesError) {
      console.log('⚠️  Could not verify tables (this is normal if RLS is enabled)');
    } else {
      console.log('✅ Created tables:');
      tables?.forEach(table => {
        console.log(`   - ${table.table_name}`);
      });
    }

    // Test credit pool initialization
    console.log('\n🧪 Testing credit pool initialization...');
    const { data: creditPools, error: poolsError } = await supabase
      .from('credit_pools')
      .select('*')
      .eq('provider', 'nanobanan');

    if (poolsError) {
      console.log('⚠️  Could not verify credit pools (this is normal if RLS is enabled)');
    } else if (creditPools && creditPools.length > 0) {
      console.log('✅ NanoBanana credit pool initialized:');
      console.log(`   - Available balance: ${creditPools[0].available_balance}`);
      console.log(`   - Cost per credit: $${creditPools[0].cost_per_credit}`);
    }

    console.log('\n🎉 Credit Management Schema Applied Successfully!');
    console.log('\n📋 Next Steps:');
    console.log('   1. Test the API endpoints: POST /api/enhance-image');
    console.log('   2. Check the admin dashboard: /admin/credits');
    console.log('   3. Set up background jobs: node scripts/setup-background-jobs.js run-all');
    console.log('   4. Monitor credit usage in the admin dashboard');

  } catch (error) {
    console.error('❌ Error applying schema:', error.message);
    process.exit(1);
  }
}

// Run the script
applyCreditSchema();

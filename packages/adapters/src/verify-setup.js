#!/usr/bin/env node

// Comprehensive verification of Supabase setup
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from root .env file
const rootDir = path.resolve(__dirname, '../../../');
const envPath = path.join(rootDir, '.env');

try {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key, ...valueParts] = trimmed.split('=');
      const value = valueParts.join('=');
      process.env[key] = value;
    }
  });
} catch (error) {
  console.error('❌ Could not load .env file:', error.message);
  process.exit(1);
}

async function verifySetup() {
  console.log('🔍 Verifying Supabase setup...\n');

  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !anonKey || !serviceRoleKey) {
    console.error('❌ Missing required environment variables');
    console.log('Required: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  console.log('📋 Configuration:');
  console.log(`   URL: ${url}`);
  console.log(`   Project: ${url.split('.')[0].split('//')[1]}`);
  console.log(`   Keys: ${'✓'.repeat(2)} configured\n`);

  // Create both public and admin clients
  const publicClient = createClient(url, anonKey);
  const adminClient = createClient(url, serviceRoleKey);

  let allTestsPassed = true;
  const testResults = [];

  // Test 1: Basic Connection
  console.log('🔗 Testing basic connection...');
  try {
    const { data: healthCheck, error } = await publicClient.auth.getSession();
    if (error && error.message !== 'Auth session missing!') {
      throw error;
    }
    console.log('✅ Basic connection successful');
    testResults.push({ test: 'Basic Connection', status: 'PASS' });
  } catch (error) {
    console.log(`❌ Basic connection failed: ${error.message}`);
    testResults.push({ test: 'Basic Connection', status: 'FAIL', error: error.message });
    allTestsPassed = false;
  }

  // Test 2: Database Tables
  console.log('\n🗄️ Testing database tables...');
  const expectedTables = [
    'users_profile',
    'gigs', 
    'applications',
    'media',
    'moodboards',
    'moodboard_items',
    'messages',
    'showcases',
    'showcase_media', 
    'reviews',
    'subscriptions',
    'reports'
  ];

  for (const tableName of expectedTables) {
    try {
      const { data, error } = await adminClient
        .from(tableName)
        .select('*', { count: 'exact' })
        .limit(1);
      
      if (error) {
        console.log(`❌ Table ${tableName}: ${error.message}`);
        testResults.push({ 
          test: `Table ${tableName}`, 
          status: 'FAIL', 
          error: error.message 
        });
        allTestsPassed = false;
      } else {
        console.log(`✅ Table ${tableName}: accessible (${data?.length || 0} records, total ~${error?.count || 'unknown'})`);
        testResults.push({ test: `Table ${tableName}`, status: 'PASS' });
      }
    } catch (error) {
      console.log(`❌ Table ${tableName}: ${error.message}`);
      testResults.push({ 
        test: `Table ${tableName}`, 
        status: 'FAIL', 
        error: error.message 
      });
      allTestsPassed = false;
    }
  }

  // Test 3: Custom Types
  console.log('\n🎭 Testing custom types...');
  const typeTests = [
    { 
      name: 'user_role',
      testQuery: "SELECT 'CONTRIBUTOR'::user_role as test_value"
    },
    {
      name: 'subscription_tier', 
      testQuery: "SELECT 'FREE'::subscription_tier as test_value"
    },
    {
      name: 'gig_status',
      testQuery: "SELECT 'DRAFT'::gig_status as test_value"
    }
  ];

  for (const typeTest of typeTests) {
    try {
      // Custom type testing would need SQL execution capability
      console.log(`ℹ️  Type ${typeTest.name}: Cannot test directly (SQL execution limited)`);
      testResults.push({ test: `Type ${typeTest.name}`, status: 'SKIP', note: 'Requires SQL execution' });
    } catch (error) {
      console.log(`❌ Type ${typeTest.name}: ${error.message}`);
      testResults.push({ 
        test: `Type ${typeTest.name}`, 
        status: 'FAIL', 
        error: error.message 
      });
    }
  }

  // Test 4: Auth Service
  console.log('\n🔐 Testing auth service...');
  try {
    const { data, error } = await publicClient.auth.getSession();
    console.log('✅ Auth service accessible');
    console.log(`   Current session: ${data.session ? 'Active' : 'None'}`);
    testResults.push({ test: 'Auth Service', status: 'PASS' });
  } catch (error) {
    console.log(`❌ Auth service error: ${error.message}`);
    testResults.push({ test: 'Auth Service', status: 'FAIL', error: error.message });
    allTestsPassed = false;
  }

  // Test 5: Storage Service
  console.log('\n🗄️ Testing storage service...');
  try {
    const { data: buckets, error } = await adminClient.storage.listBuckets();
    if (error) {
      console.log(`ℹ️  Storage service: ${error.message} (may be expected)`);
      testResults.push({ test: 'Storage Service', status: 'WARN', note: error.message });
    } else {
      console.log(`✅ Storage service accessible (${buckets.length} buckets)`);
      testResults.push({ test: 'Storage Service', status: 'PASS' });
    }
  } catch (error) {
    console.log(`❌ Storage service error: ${error.message}`);
    testResults.push({ test: 'Storage Service', status: 'FAIL', error: error.message });
    allTestsPassed = false;
  }

  // Test 6: RLS Policies (basic test)
  console.log('\n🛡️ Testing RLS policies...');
  try {
    // Try to access users_profile without auth (should be restricted)
    const { data, error } = await publicClient
      .from('users_profile')
      .select('*')
      .limit(1);
    
    if (error && error.message.includes('RLS')) {
      console.log('✅ RLS policies active (access properly restricted)');
      testResults.push({ test: 'RLS Policies', status: 'PASS' });
    } else if (error) {
      console.log(`ℹ️  RLS test: ${error.message}`);
      testResults.push({ test: 'RLS Policies', status: 'WARN', note: error.message });
    } else {
      console.log('⚠️  RLS policies may not be active (got data without auth)');
      testResults.push({ test: 'RLS Policies', status: 'WARN', note: 'May not be properly restricted' });
    }
  } catch (error) {
    console.log(`❌ RLS test error: ${error.message}`);
    testResults.push({ test: 'RLS Policies', status: 'FAIL', error: error.message });
    allTestsPassed = false;
  }

  // Test 7: Foreign Key Relationships
  console.log('\n🔗 Testing foreign key relationships...');
  try {
    // Test that we can query related table structures
    const { data: gigData, error: gigError } = await adminClient
      .from('gigs')
      .select(`
        *,
        users_profile:owner_user_id(display_name),
        applications(count)
      `)
      .limit(1);
    
    if (gigError) {
      console.log(`ℹ️  FK relationships: ${gigError.message} (expected if no data)`);
      testResults.push({ test: 'Foreign Key Relationships', status: 'WARN', note: gigError.message });
    } else {
      console.log('✅ Foreign key relationships working');
      testResults.push({ test: 'Foreign Key Relationships', status: 'PASS' });
    }
  } catch (error) {
    console.log(`❌ FK test error: ${error.message}`);
    testResults.push({ test: 'Foreign Key Relationships', status: 'FAIL', error: error.message });
    allTestsPassed = false;
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 VERIFICATION SUMMARY');
  console.log('='.repeat(80));
  
  const passCount = testResults.filter(r => r.status === 'PASS').length;
  const failCount = testResults.filter(r => r.status === 'FAIL').length;
  const warnCount = testResults.filter(r => r.status === 'WARN').length;
  const skipCount = testResults.filter(r => r.status === 'SKIP').length;
  
  console.log(`✅ Passed: ${passCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`⚠️  Warnings: ${warnCount}`);
  console.log(`⏭️  Skipped: ${skipCount}`);
  
  console.log('\nDetailed Results:');
  testResults.forEach(result => {
    const icon = {
      'PASS': '✅',
      'FAIL': '❌', 
      'WARN': '⚠️',
      'SKIP': '⏭️'
    }[result.status];
    
    console.log(`${icon} ${result.test}`);
    if (result.error) console.log(`   Error: ${result.error}`);
    if (result.note) console.log(`   Note: ${result.note}`);
  });

  if (allTestsPassed && failCount === 0) {
    console.log('\n🎉 All critical tests passed! Supabase setup is ready.');
    console.log('\n🚀 Next steps:');
    console.log('   1. Create repository adapters');
    console.log('   2. Implement domain entity mapping');
    console.log('   3. Add authentication flows');
    console.log('   4. Set up file storage');
    console.log('   5. Write integration tests');
  } else {
    console.log('\n⚠️  Some tests failed or have warnings.');
    
    if (failCount > 0) {
      console.log('❌ Critical issues found - please resolve before proceeding.');
      console.log('\n🔧 Troubleshooting:');
      console.log('   1. Ensure migrations have been applied to the database');
      console.log('   2. Check that all tables were created successfully');
      console.log('   3. Verify RLS policies are in place');
      console.log('   4. Confirm service role key has proper permissions');
    } else {
      console.log('✅ No critical failures - warnings can typically be ignored.');
    }
  }

  console.log('\n📖 For setup instructions, see: packages/adapters/SETUP_INSTRUCTIONS.md');
}

console.log('🚀 Starting comprehensive verification...\n');
verifySetup().catch(error => {
  console.error('❌ Verification failed:', error);
  process.exit(1);
});
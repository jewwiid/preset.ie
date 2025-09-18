const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkRequiredTables() {
  console.log('🔍 Checking all required tables for user creation...\n');

  const requiredTables = [
    'users',
    'users_profile', 
    'user_settings',
    'user_credits',
    'notification_preferences',
    'gig_notification_preferences',
    'notifications'
  ];

  const results = {};

  for (const tableName of requiredTables) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (error) {
        results[tableName] = { exists: false, error: error.message };
        console.log(`❌ ${tableName}: ${error.message}`);
      } else {
        results[tableName] = { exists: true, count: data?.length || 0 };
        console.log(`✅ ${tableName}: exists (${data?.length || 0} rows)`);
      }
    } catch (err) {
      results[tableName] = { exists: false, error: err.message };
      console.log(`❌ ${tableName}: ${err.message}`);
    }
  }

  console.log('\n📊 Summary:');
  const existingTables = Object.entries(results).filter(([_, result]) => result.exists);
  const missingTables = Object.entries(results).filter(([_, result]) => !result.exists);

  console.log(`✅ Existing tables: ${existingTables.length}`);
  console.log(`❌ Missing tables: ${missingTables.length}`);

  if (missingTables.length > 0) {
    console.log('\n🚨 Missing tables:');
    missingTables.forEach(([table, result]) => {
      console.log(`   - ${table}: ${result.error}`);
    });
  }

  return results;
}

async function testUserCreation() {
  console.log('\n🧪 Testing user creation process...\n');

  try {
    // Test creating a user via auth
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';

    console.log(`Creating test user: ${testEmail}`);

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true
    });

    if (authError) {
      console.log(`❌ Auth user creation failed: ${authError.message}`);
      return false;
    }

    console.log(`✅ Auth user created: ${authData.user.id}`);

    // Check if supporting records were created
    const userId = authData.user.id;

    // Check users table
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (usersError) {
      console.log(`❌ Users table record missing: ${usersError.message}`);
    } else {
      console.log(`✅ Users table record exists`);
    }

    // Check users_profile table
    const { data: profileData, error: profileError } = await supabase
      .from('users_profile')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (profileError) {
      console.log(`❌ Users profile record missing: ${profileError.message}`);
    } else {
      console.log(`✅ Users profile record exists`);
    }

    // Check notification_preferences table
    const { data: notifData, error: notifError } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (notifError) {
      console.log(`❌ Notification preferences record missing: ${notifError.message}`);
    } else {
      console.log(`✅ Notification preferences record exists`);
    }

    // Clean up test user
    console.log('\n🧹 Cleaning up test user...');
    await supabase.auth.admin.deleteUser(userId);
    console.log('✅ Test user cleaned up');

    return true;

  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`);
    return false;
  }
}

async function main() {
  try {
    const tableResults = await checkRequiredTables();
    const testPassed = await testUserCreation();

    console.log('\n🎯 Final Status:');
    const missingTables = Object.entries(tableResults).filter(([_, result]) => !result.exists);
    
    if (missingTables.length === 0 && testPassed) {
      console.log('✅ All tables exist and user creation works!');
    } else {
      console.log('❌ Issues found:');
      if (missingTables.length > 0) {
        console.log('   - Missing tables');
      }
      if (!testPassed) {
        console.log('   - User creation test failed');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

main();

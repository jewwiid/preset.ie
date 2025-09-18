const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testUserRoleEnum() {
  console.log('🧪 Testing user_role enum values...\n');

  const testRoles = ['CONTRIBUTOR', 'TALENT', 'ADMIN'];
  const results = {};

  for (const role of testRoles) {
    try {
      // Generate a proper UUID
      const testUserId = crypto.randomUUID();
      const testEmail = `test-${role.toLowerCase()}-${Date.now()}@example.com`;

      console.log(`Testing role: ${role}`);

      const { data, error } = await supabase
        .from('users')
        .insert({
          id: testUserId,
          email: testEmail,
          role: role
        });

      if (error) {
        results[role] = { success: false, error: error.message };
        console.log(`❌ ${role}: ${error.message}`);
      } else {
        results[role] = { success: true };
        console.log(`✅ ${role}: Success`);
        
        // Clean up test record
        await supabase.from('users').delete().eq('id', testUserId);
        console.log(`   Cleaned up test record`);
      }

    } catch (err) {
      results[role] = { success: false, error: err.message };
      console.log(`❌ ${role}: ${err.message}`);
    }
  }

  console.log('\n📊 Results:');
  const successful = Object.entries(results).filter(([_, result]) => result.success);
  const failed = Object.entries(results).filter(([_, result]) => !result.success);

  console.log(`✅ Successful: ${successful.length}`);
  console.log(`❌ Failed: ${failed.length}`);

  if (failed.length > 0) {
    console.log('\n🚨 Failed roles:');
    failed.forEach(([role, result]) => {
      console.log(`   - ${role}: ${result.error}`);
    });
  }

  return results;
}

async function testAuthUserCreation() {
  console.log('\n🧪 Testing auth user creation...\n');

  try {
    const testEmail = `auth-test-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';

    console.log(`Creating auth user: ${testEmail}`);

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
      console.log(`✅ Users table record exists with role: ${usersData.role}`);
    }

    // Clean up test user
    console.log('\n🧹 Cleaning up test user...');
    await supabase.auth.admin.deleteUser(userId);
    console.log('✅ Test user cleaned up');

    return true;

  } catch (error) {
    console.log(`❌ Auth test failed: ${error.message}`);
    return false;
  }
}

async function main() {
  try {
    const enumResults = await testUserRoleEnum();
    const authTestPassed = await testAuthUserCreation();

    console.log('\n🎯 Final Status:');
    const failedRoles = Object.entries(enumResults).filter(([_, result]) => !result.success);
    
    if (failedRoles.length === 0 && authTestPassed) {
      console.log('✅ All user_role enum values work and auth user creation succeeds!');
    } else {
      console.log('❌ Issues found:');
      if (failedRoles.length > 0) {
        console.log('   - Some user_role enum values failed');
      }
      if (!authTestPassed) {
        console.log('   - Auth user creation test failed');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

main();

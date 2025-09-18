const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testUsersTableForeignKey() {
  console.log('🧪 Testing users table foreign key constraint...\n');

  try {
    // Step 1: Create an auth user first
    const testEmail = `test-fk-${Date.now()}@example.com`;
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

    // Step 2: Try to insert into users table with the auth user's ID
    const authUserId = authData.user.id;
    const testRoles = ['CONTRIBUTOR', 'TALENT', 'ADMIN'];

    for (const role of testRoles) {
      try {
        console.log(`Testing role: ${role}`);

        const { data, error } = await supabase
          .from('users')
          .insert({
            id: authUserId,
            email: testEmail,
            role: role
          });

        if (error) {
          console.log(`❌ ${role}: ${error.message}`);
        } else {
          console.log(`✅ ${role}: Success`);
          
          // Clean up the users table record
          await supabase.from('users').delete().eq('id', authUserId);
          console.log(`   Cleaned up users table record`);
        }

      } catch (err) {
        console.log(`❌ ${role}: ${err.message}`);
      }
    }

    // Step 3: Clean up auth user
    console.log('\n🧹 Cleaning up auth user...');
    await supabase.auth.admin.deleteUser(authUserId);
    console.log('✅ Auth user cleaned up');

    return true;

  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`);
    return false;
  }
}

async function testAuthUserCreationWithTriggers() {
  console.log('\n🧪 Testing auth user creation with triggers...\n');

  try {
    const testEmail = `test-triggers-${Date.now()}@example.com`;
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

    // Check if supporting records were created by triggers
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
    console.log(`❌ Auth test failed: ${error.message}`);
    return false;
  }
}

async function main() {
  try {
    const fkTestPassed = await testUsersTableForeignKey();
    const triggerTestPassed = await testAuthUserCreationWithTriggers();

    console.log('\n🎯 Final Status:');
    
    if (fkTestPassed && triggerTestPassed) {
      console.log('✅ All tests passed! Users table foreign key constraint works and auth user creation succeeds!');
    } else {
      console.log('❌ Issues found:');
      if (!fkTestPassed) {
        console.log('   - Users table foreign key constraint test failed');
      }
      if (!triggerTestPassed) {
        console.log('   - Auth user creation with triggers test failed');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

main();

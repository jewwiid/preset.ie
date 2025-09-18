const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testWithoutTriggers() {
  console.log('🧪 Testing auth user creation without triggers...\n');

  try {
    const testEmail = `test-no-triggers-${Date.now()}@example.com`;
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

    console.log(`✅ Auth user created successfully: ${authData.user.id}`);
    const userId = authData.user.id;

    // Now manually test each function
    console.log('\n🧪 Testing handle_new_user function manually...');
    try {
      const { data, error } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: testEmail,
          role: 'TALENT'
        });

      if (error) {
        console.log(`❌ Manual users insert failed: ${error.message}`);
      } else {
        console.log(`✅ Manual users insert succeeded`);
      }
    } catch (err) {
      console.log(`❌ Manual users insert error: ${err.message}`);
    }

    // Test users_profile creation
    console.log('\n🧪 Testing users_profile creation...');
    try {
      const { data, error } = await supabase
        .from('users_profile')
        .insert({
          user_id: userId,
          display_name: 'Test User',
          handle: `test_user_${Date.now()}`
        });

      if (error) {
        console.log(`❌ Manual users_profile insert failed: ${error.message}`);
      } else {
        console.log(`✅ Manual users_profile insert succeeded`);
      }
    } catch (err) {
      console.log(`❌ Manual users_profile insert error: ${err.message}`);
    }

    // Test user_settings creation
    console.log('\n🧪 Testing user_settings creation...');
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .insert({
          user_id: userId
        });

      if (error) {
        console.log(`❌ Manual user_settings insert failed: ${error.message}`);
      } else {
        console.log(`✅ Manual user_settings insert succeeded`);
      }
    } catch (err) {
      console.log(`❌ Manual user_settings insert error: ${err.message}`);
    }

    // Test notification_preferences creation
    console.log('\n🧪 Testing notification_preferences creation...');
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .insert({
          user_id: userId
        });

      if (error) {
        console.log(`❌ Manual notification_preferences insert failed: ${error.message}`);
      } else {
        console.log(`✅ Manual notification_preferences insert succeeded`);
      }
    } catch (err) {
      console.log(`❌ Manual notification_preferences insert error: ${err.message}`);
    }

    // Clean up
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
    await testWithoutTriggers();
    console.log('\n🎯 Testing complete');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

main();


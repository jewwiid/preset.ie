const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testIndividualTriggers() {
  console.log('🔍 Testing individual triggers...\n');

  try {
    // Step 1: Create auth user without any triggers
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
    const userId = authData.user.id;

    // Step 2: Test handle_new_user function manually
    console.log('\n🧪 Testing handle_new_user function...');
    try {
      const { data, error } = await supabase.rpc('handle_new_user', {
        new_user_id: userId,
        new_user_email: testEmail
      });

      if (error) {
        console.log(`❌ handle_new_user failed: ${error.message}`);
      } else {
        console.log(`✅ handle_new_user succeeded`);
      }
    } catch (err) {
      console.log(`❌ handle_new_user error: ${err.message}`);
    }

    // Step 3: Test create_default_user_settings function manually
    console.log('\n🧪 Testing create_default_user_settings function...');
    try {
      const { data, error } = await supabase.rpc('create_default_user_settings', {
        new_user_id: userId
      });

      if (error) {
        console.log(`❌ create_default_user_settings failed: ${error.message}`);
      } else {
        console.log(`✅ create_default_user_settings succeeded`);
      }
    } catch (err) {
      console.log(`❌ create_default_user_settings error: ${err.message}`);
    }

    // Step 4: Test create_default_notification_preferences function manually
    console.log('\n🧪 Testing create_default_notification_preferences function...');
    try {
      const { data, error } = await supabase.rpc('create_default_notification_preferences', {
        new_user_id: userId
      });

      if (error) {
        console.log(`❌ create_default_notification_preferences failed: ${error.message}`);
      } else {
        console.log(`✅ create_default_notification_preferences succeeded`);
      }
    } catch (err) {
      console.log(`❌ create_default_notification_preferences error: ${err.message}`);
    }

    // Step 5: Check what records were actually created
    console.log('\n📊 Checking created records...');
    
    // Check users table
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (usersError) {
      console.log(`❌ Users table: ${usersError.message}`);
    } else {
      console.log(`✅ Users table: record exists with role ${usersData.role}`);
    }

    // Check users_profile table
    const { data: profileData, error: profileError } = await supabase
      .from('users_profile')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (profileError) {
      console.log(`❌ Users profile: ${profileError.message}`);
    } else {
      console.log(`✅ Users profile: record exists`);
    }

    // Check user_settings table
    const { data: settingsData, error: settingsError } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (settingsError) {
      console.log(`❌ User settings: ${settingsError.message}`);
    } else {
      console.log(`✅ User settings: record exists`);
    }

    // Check notification_preferences table
    const { data: notifData, error: notifError } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (notifError) {
      console.log(`❌ Notification preferences: ${notifError.message}`);
    } else {
      console.log(`✅ Notification preferences: record exists`);
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
    await testIndividualTriggers();
    console.log('\n🎯 Trigger testing complete');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

main();


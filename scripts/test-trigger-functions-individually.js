const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Supabase URL or Service Role Key is not set.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testTriggerFunctionsIndividually() {
  console.log('🧪 Testing trigger functions individually...\n');
  
  const testUserId = '550e8400-e29b-41d4-a716-446655440000'; // Fixed UUID for testing
  const testEmail = 'test-trigger@example.com';
  const testRole = 'TALENT';
  
  try {
    // Test 1: handle_new_user function
    console.log('Testing handle_new_user function...');
    const { error: handleNewUserError } = await supabase.rpc('handle_new_user_manual', {
      p_user_id: testUserId,
      p_email: testEmail,
      p_role: testRole
    });
    
    if (handleNewUserError) {
      console.log(`❌ handle_new_user failed: ${handleNewUserError.message}`);
    } else {
      console.log('✅ handle_new_user succeeded');
    }
    
    // Test 2: create_default_user_settings function
    console.log('Testing create_default_user_settings function...');
    const { error: createSettingsError } = await supabase.rpc('create_default_user_settings_manual', {
      p_user_id: testUserId
    });
    
    if (createSettingsError) {
      console.log(`❌ create_default_user_settings failed: ${createSettingsError.message}`);
    } else {
      console.log('✅ create_default_user_settings succeeded');
    }
    
    // Test 3: initialize_user_credits function
    console.log('Testing initialize_user_credits function...');
    const { error: initCreditsError } = await supabase.rpc('initialize_user_credits_manual', {
      p_user_id: testUserId,
      p_subscription_tier: 'FREE'
    });
    
    if (initCreditsError) {
      console.log(`❌ initialize_user_credits failed: ${initCreditsError.message}`);
    } else {
      console.log('✅ initialize_user_credits succeeded');
    }
    
    // Test 4: create_default_notification_preferences function
    console.log('Testing create_default_notification_preferences function...');
    const { error: createNotifError } = await supabase.rpc('create_default_notification_preferences_manual', {
      p_user_id: testUserId
    });
    
    if (createNotifError) {
      console.log(`❌ create_default_notification_preferences failed: ${createNotifError.message}`);
    } else {
      console.log('✅ create_default_notification_preferences succeeded');
    }
    
    // Clean up test data
    console.log('\nCleaning up test data...');
    await supabase.from('users').delete().eq('id', testUserId);
    await supabase.from('user_settings').delete().eq('user_id', testUserId);
    await supabase.from('user_credits').delete().eq('user_id', testUserId);
    await supabase.from('notification_preferences').delete().eq('user_id', testUserId);
    
    console.log('✅ Test data cleaned up');
    
  } catch (error) {
    console.error('An unexpected error occurred:', error.message);
  }
}

testTriggerFunctionsIndividually();


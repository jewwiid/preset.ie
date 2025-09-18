const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Supabase URL or Service Role Key is not set.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testWithoutAnyTriggers() {
  console.log('🧪 Testing user creation without any triggers...\n');
  
  const testEmail = `test-no-triggers-${Date.now()}@example.com`;
  const testPassword = 'Password123!';
  
  try {
    console.log(`Attempting to create auth user: ${testEmail}`);
    
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: {
        role: 'TALENT'
      }
    });

    if (authError) {
      console.log(`❌ Auth user creation failed: ${authError.message}`);
      console.log(`Error details:`, authError);
      return false;
    } else {
      const authUserId = authData.user.id;
      console.log(`✅ Auth user created successfully with ID: ${authUserId}`);
      
      // Check if the user was created in auth.users
      const { data: authUserData, error: authUserError } = await supabase.auth.admin.getUserById(authUserId);
      
      if (authUserError || !authUserData.user) {
        console.log(`❌ Auth user not found: ${authUserError?.message || 'Not found'}`);
      } else {
        console.log(`✅ Auth user confirmed: ${authUserData.user.email}`);
      }
      
      // Clean up
      await supabase.auth.admin.deleteUser(authUserId);
      console.log(`Cleaned up auth user: ${authUserId}`);
      
      return true;
    }
  } catch (error) {
    console.error('An unexpected error occurred:', error.message);
    console.error('Full error:', error);
    return false;
  }
}

testWithoutAnyTriggers();


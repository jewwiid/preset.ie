const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Supabase URL or Service Role Key is not set.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testSimpleUserCreation() {
  console.log('🧪 Testing simple user creation...\n');
  
  const testEmail = `test-simple-${Date.now()}@example.com`;
  const testPassword = 'Password123!';
  
  try {
    console.log(`Attempting to create auth user: ${testEmail}`);
    
    // Try creating user with minimal data
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
      
      // Wait a moment for triggers to run
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Check if the user was created in public.users
      const { data: publicUserData, error: publicUserError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUserId)
        .single();

      if (publicUserError || !publicUserData) {
        console.log(`❌ Public.users entry not found: ${publicUserError?.message || 'Not found'}`);
      } else {
        console.log(`✅ Public.users entry found:`, publicUserData);
      }
      
      // Check if the profile was created
      const { data: profileData, error: profileError } = await supabase
        .from('users_profile')
        .select('*')
        .eq('user_id', authUserId)
        .single();

      if (profileError || !profileData) {
        console.log(`❌ users_profile entry not found: ${profileError?.message || 'Not found'}`);
      } else {
        console.log(`✅ users_profile entry found:`, profileData);
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

testSimpleUserCreation();


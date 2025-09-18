const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: Supabase URL or Anon Key is not set.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAdminSignIn() {
  console.log('🧪 Testing admin sign-in...\n');
  
  const adminEmail = 'admin@preset.ie';
  const adminPassword = 'Admin123!@#';
  
  try {
    console.log(`Attempting to sign in with: ${adminEmail}`);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword
    });

    if (error) {
      console.log(`❌ Sign in failed: ${error.message}`);
      console.log(`Error details:`, error);
      return false;
    } else {
      console.log(`✅ Sign in successful!`);
      console.log(`User ID: ${data.user.id}`);
      console.log(`Email: ${data.user.email}`);
      console.log(`Role: ${data.user.user_metadata?.role || 'Not set'}`);
      
      // Test sign out
      await supabase.auth.signOut();
      console.log(`✅ Sign out successful`);
      
      return true;
    }
  } catch (error) {
    console.error('An unexpected error occurred:', error.message);
    console.error('Full error:', error);
    return false;
  }
}

testAdminSignIn();


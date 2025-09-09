const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://zbsmgymyfhnwjdnmlelr.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function getAdminId() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  // Sign in as admin to get the user ID
  const { data: { user }, error } = await supabase.auth.signInWithPassword({
    email: 'admin@preset.ie',
    password: 'admin123456'
  });
  
  if (error) {
    console.error('Error signing in:', error);
    return;
  }
  
  console.log('Admin User ID:', user.id);
  console.log('Admin Email:', user.email);
  
  // Check if user_credits exists
  const { data: credits } = await supabase
    .from('user_credits')
    .select('*')
    .eq('user_id', user.id)
    .single();
  
  if (credits) {
    console.log('Current Balance:', credits.current_balance);
  } else {
    console.log('No credits record found');
  }
}

getAdminId();
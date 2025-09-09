const { createClient } = require('@supabase/supabase-js');

// Configuration
const supabaseUrl = 'https://zbsmgymyfhnwjdnmlelr.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpic21neW15Zmhud2pkbm1sZWxyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzEwODg1MywiZXhwIjoyMDcyNjg0ODUzfQ.XkDZmk6mfJAGUEUl3uusETrtsJZ5fBPtHMrda7nD__U';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function makeUserAdmin(email) {
  try {
    console.log(`Making user ${email} an admin...`);
    
    // First, find the user by email
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('Error fetching users:', authError);
      return;
    }
    
    const user = authData.users.find(u => u.email === email);
    
    if (!user) {
      console.error(`User with email ${email} not found`);
      console.log('Available users:');
      authData.users.forEach(u => {
        console.log(`  - ${u.email} (${u.id})`);
      });
      return;
    }
    
    console.log(`Found user: ${user.id}`);
    
    // Check if user has a profile
    const { data: profile, error: profileError } = await supabase
      .from('users_profile')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error fetching profile:', profileError);
      return;
    }
    
    if (!profile) {
      // Create a profile for the user
      console.log('Creating profile for user...');
      const { error: createError } = await supabase
        .from('users_profile')
        .insert({
          user_id: user.id,
          display_name: email.split('@')[0],
          handle: email.split('@')[0] + Date.now(),
          role_flags: ['ADMIN', 'CONTRIBUTOR', 'TALENT'],
          subscription_tier: 'pro',
          created_at: new Date().toISOString()
        });
      
      if (createError) {
        console.error('Error creating profile:', createError);
        return;
      }
      
      console.log('✅ Profile created with admin privileges');
    } else {
      // Update existing profile to add ADMIN role
      const currentRoles = profile.role_flags || [];
      if (!currentRoles.includes('ADMIN')) {
        currentRoles.push('ADMIN');
      }
      
      const { error: updateError } = await supabase
        .from('users_profile')
        .update({
          role_flags: currentRoles,
          subscription_tier: 'pro' // Give admin pro tier
        })
        .eq('user_id', user.id);
      
      if (updateError) {
        console.error('Error updating profile:', updateError);
        return;
      }
      
      console.log('✅ Profile updated with admin privileges');
    }
    
    // Give the admin some credits to test with
    const { data: userCredits } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (!userCredits) {
      console.log('Creating user credits...');
      await supabase
        .from('user_credits')
        .insert({
          user_id: user.id,
          subscription_tier: 'pro',
          monthly_allowance: 1000,
          current_balance: 1000,
          consumed_this_month: 0,
          last_reset_at: new Date().toISOString()
        });
      console.log('✅ User credits created with 1000 credits');
    } else {
      await supabase
        .from('user_credits')
        .update({
          current_balance: 1000,
          subscription_tier: 'pro'
        })
        .eq('user_id', user.id);
      console.log('✅ User credits updated to 1000 credits');
    }
    
    console.log('\n🎉 Success! User is now an admin.');
    console.log('\nAdmin access details:');
    console.log(`  Email: ${email}`);
    console.log(`  User ID: ${user.id}`);
    console.log(`  Admin Dashboard: http://localhost:3000/admin`);
    console.log('\nThe user can now:');
    console.log('  ✓ Access the admin dashboard at /admin');
    console.log('  ✓ Manage platform credits');
    console.log('  ✓ View analytics and user data');
    console.log('  ✓ Moderate content');
    console.log('  ✓ Configure credit packages');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.log('Usage: node make-admin.js <email>');
  console.log('Example: node make-admin.js admin@preset.ie');
  process.exit(1);
}

// Validate email format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  console.error('Invalid email format');
  process.exit(1);
}

makeUserAdmin(email);
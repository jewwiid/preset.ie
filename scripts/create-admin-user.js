const { createClient } = require('@supabase/supabase-js');

// Configuration
const supabaseUrl = 'https://zbsmgymyfhnwjdnmlelr.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpic21neW15Zmhud2pkbm1sZWxyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzEwODg1MywiZXhwIjoyMDcyNjg0ODUzfQ.XkDZmk6mfJAGUEUl3uusETrtsJZ5fBPtHMrda7nD__U';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createAdminUser() {
  const email = 'admin@preset.ie';
  const password = 'AdminPreset2025!'; // Strong password for admin
  
  try {
    console.log('Creating admin user...');
    
    // Create the user in auth system
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
    });
    
    if (authError) {
      // Check if user already exists
      if (authError.message?.includes('already been registered')) {
        console.log('User already exists, updating to admin...');
        
        // Get the existing user
        const { data: { users } } = await supabase.auth.admin.listUsers();
        const existingUser = users.find(u => u.email === email);
        
        if (existingUser) {
          await makeAdmin(existingUser);
        }
        return;
      }
      throw authError;
    }
    
    const user = authData.user;
    console.log(`✅ Auth user created: ${user.id}`);
    
    // Create admin profile
    await makeAdmin(user);
    
  } catch (error) {
    console.error('Error creating admin:', error);
  }
}

async function makeAdmin(user) {
  try {
    // Create profile with admin privileges
    const { error: profileError } = await supabase
      .from('users_profile')
      .upsert({
        user_id: user.id,
        display_name: 'Platform Admin',
        handle: 'admin',
        bio: 'Platform administrator with full access',
        city: 'Dublin',
        role_flags: ['ADMIN', 'CONTRIBUTOR', 'TALENT'],
        style_tags: ['admin'],
        subscription_tier: 'pro',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });
    
    if (profileError) {
      console.error('Error creating profile:', profileError);
      return;
    }
    
    console.log('✅ Admin profile created');
    
    // Create user credits
    const { error: creditsError } = await supabase
      .from('user_credits')
      .upsert({
        user_id: user.id,
        subscription_tier: 'pro',
        monthly_allowance: 10000, // Generous allowance for admin
        current_balance: 10000,
        consumed_this_month: 0,
        last_reset_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });
    
    if (creditsError) {
      console.error('Error creating credits:', creditsError);
      return;
    }
    
    console.log('✅ Admin credits created (10,000 credits)');
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 ADMIN USER CREATED SUCCESSFULLY!');
    console.log('='.repeat(60));
    console.log('\n📧 Admin Login Credentials:');
    console.log('   Email: admin@preset.ie');
    console.log('   Password: AdminPreset2025!');
    console.log('\n🔗 Admin Dashboard URL:');
    console.log('   http://localhost:3000/admin');
    console.log('\n📝 Admin Capabilities:');
    console.log('   ✓ Full platform credit management');
    console.log('   ✓ User administration');
    console.log('   ✓ Analytics and monitoring');
    console.log('   ✓ Content moderation');
    console.log('   ✓ System configuration');
    console.log('\n⚠️  IMPORTANT: Change the password after first login!');
    console.log('='.repeat(60) + '\n');
    
  } catch (error) {
    console.error('Error in makeAdmin:', error);
  }
}

// Run the creation
createAdminUser();
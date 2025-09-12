#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

// Use service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixAdminAuth() {
  const adminEmail = 'admin@preset.ie';
  const adminPassword = 'Admin123!@#';
  
  console.log('🔧 Fixing admin authentication...');
  console.log('📧 Email:', adminEmail);
  console.log('🔑 Password:', adminPassword);
  console.log('');

  try {
    // Step 1: Check if user exists in auth.users
    console.log('Step 1: Checking for existing admin user...');
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Error listing users:', listError);
      return;
    }

    const existingUser = users.find(u => u.email === adminEmail);
    let userId;

    if (existingUser) {
      console.log('✓ Found existing admin user:', existingUser.id);
      userId = existingUser.id;
      
      // Update the password
      console.log('Step 2: Updating password...');
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        userId,
        { password: adminPassword }
      );
      
      if (updateError) {
        console.error('❌ Error updating password:', updateError);
        return;
      }
      console.log('✓ Password updated successfully');
    } else {
      // Create new user
      console.log('Step 2: Creating new admin user...');
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
        user_metadata: {
          role: 'admin'
        }
      });
      
      if (createError) {
        console.error('❌ Error creating user:', createError);
        return;
      }
      
      userId = newUser.user.id;
      console.log('✓ Admin user created:', userId);
    }

    // Step 3: Ensure user exists in public.users table
    console.log('Step 3: Checking public.users table...');
    const { data: publicUser, error: publicError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (publicError && publicError.code === 'PGRST116') {
      // User doesn't exist in public.users, create it
      console.log('Creating entry in public.users...');
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: adminEmail,
          role: 'admin'
        });
      
      if (insertError) {
        console.error('⚠️ Warning: Could not create public.users entry:', insertError.message);
        // Continue anyway as this table might not exist
      } else {
        console.log('✓ Created entry in public.users');
      }
    } else if (!publicError) {
      console.log('✓ Entry exists in public.users');
    }

    // Step 4: Ensure profile exists
    console.log('Step 4: Setting up admin profile...');
    const { data: profile, error: profileError } = await supabase
      .from('users_profile')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (profileError && profileError.code === 'PGRST116') {
      // Profile doesn't exist, create it
      console.log('Creating admin profile...');
      const { error: insertProfileError } = await supabase
        .from('users_profile')
        .insert({
          user_id: userId,
          display_name: 'Admin User',
          handle: `admin_${Date.now()}`, // Unique handle to avoid conflicts
          bio: 'Platform Administrator',
          city: 'Dublin',
          role_flags: ['ADMIN', 'CONTRIBUTOR', 'TALENT'],
          style_tags: [],
          subscription_tier: 'PRO',
          subscription_status: 'ACTIVE',
          verified_id: true
        });
      
      if (insertProfileError) {
        console.error('❌ Error creating profile:', insertProfileError);
        return;
      }
      console.log('✓ Admin profile created');
    } else if (!profileError) {
      // Update existing profile
      console.log('Updating existing profile...');
      const { error: updateProfileError } = await supabase
        .from('users_profile')
        .update({
          role_flags: ['ADMIN', 'CONTRIBUTOR', 'TALENT'],
          subscription_tier: 'PRO',
          subscription_status: 'ACTIVE',
          verified_id: true,
          display_name: profile.display_name || 'Admin User',
          bio: profile.bio || 'Platform Administrator'
        })
        .eq('user_id', userId);
      
      if (updateProfileError) {
        console.error('❌ Error updating profile:', updateProfileError);
        return;
      }
      console.log('✓ Admin profile updated');
    }

    // Step 5: Test the login
    console.log('\nStep 5: Testing login...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword
    });

    if (signInError) {
      console.error('❌ Login test failed:', signInError.message);
    } else if (signInData.user) {
      console.log('✅ Login test successful!');
      
      // Sign out after test
      await supabase.auth.signOut();
    }

    console.log('\n' + '='.repeat(50));
    console.log('✅ ADMIN ACCOUNT FIXED SUCCESSFULLY!');
    console.log('='.repeat(50));
    console.log('\n📧 Email: admin@preset.ie');
    console.log('🔑 Password: Admin123!@#');
    console.log('\n🔗 Sign in at: http://localhost:3000/auth/signin');
    console.log('🛡️ Admin panel: http://localhost:3000/admin');
    console.log('\n⚠️  IMPORTANT: Change the password after first login!');
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

// Run the fix
fixAdminAuth();
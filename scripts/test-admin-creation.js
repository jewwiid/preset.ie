#!/usr/bin/env node

/**
 * Test Admin Creation
 * This script tests creating the admin account after trigger fixes
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  console.error('Make sure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testAdminCreation() {
  try {
    console.log('🧪 Testing admin account creation...\n');
    
    // Check if admin user already exists
    console.log('1️⃣ Checking if admin user exists...');
    const { data: existingUsers, error: checkError } = await supabase.auth.admin.listUsers();
    
    if (checkError) {
      console.error('❌ Error checking existing users:', checkError);
      return;
    }
    
    const adminUser = existingUsers.users.find(user => user.email === 'admin@preset.ie');
    
    if (adminUser) {
      console.log('✅ Admin user already exists');
      console.log('📋 User ID:', adminUser.id);
      console.log('📋 Email:', adminUser.email);
      
      // Test sign in
      console.log('2️⃣ Testing sign in...');
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: 'admin@preset.ie',
        password: 'Admin123!@#'
      });
      
      if (signInError) {
        console.error('❌ Sign in failed:', signInError.message);
      } else {
        console.log('✅ Sign in successful!');
        console.log('📋 Session user:', signInData.user.email);
        console.log('📋 User role:', signInData.user.user_metadata?.role);
      }
      
      return;
    }
    
    // Create new admin user
    console.log('2️⃣ Creating new admin user...');
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: 'admin@preset.ie',
      password: 'Admin123!@#',
      email_confirm: true,
      user_metadata: {
        role: 'ADMIN'
      }
    });
    
    if (createError) {
      console.error('❌ Error creating admin user:', createError);
      return;
    }
    
    console.log('✅ Admin user created successfully');
    console.log('📋 User ID:', newUser.user.id);
    console.log('📋 Email:', newUser.user.email);
    
    // Create profile for the new user
    console.log('3️⃣ Creating admin profile...');
    const { data: profile, error: profileError } = await supabase
      .from('users_profile')
      .insert({
        user_id: newUser.user.id,
        display_name: 'Admin User',
        handle: 'admin',
        first_name: 'Admin',
        last_name: 'User'
      })
      .select();
    
    if (profileError) {
      console.error('❌ Error creating profile:', profileError);
    } else {
      console.log('✅ Profile created successfully');
    }
    
    // Test sign in
    console.log('4️⃣ Testing sign in...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'admin@preset.ie',
      password: 'Admin123!@#'
    });
    
    if (signInError) {
      console.error('❌ Sign in test failed:', signInError);
    } else {
      console.log('✅ Sign in test successful');
      console.log('📋 Session user:', signInData.user.email);
    }
    
    console.log('\n🎉 Admin account setup completed!');
    console.log('You can now sign in with:');
    console.log('📧 Email: admin@preset.ie');
    console.log('🔑 Password: Admin123!@#');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testAdminCreation();

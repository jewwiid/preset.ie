#!/usr/bin/env node

/**
 * Check Admin Exists
 * This script checks if the admin account exists in the database
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

async function checkAdminExists() {
  try {
    console.log('🔍 Checking if admin account exists...\n');
    
    // Check auth.users table
    console.log('1️⃣ Checking auth.users table...');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.log('❌ Error checking auth users:', authError.message);
    } else {
      const adminUser = authUsers.users.find(user => user.email === 'admin@preset.ie');
      if (adminUser) {
        console.log('✅ Admin user exists in auth.users');
        console.log('📋 User ID:', adminUser.id);
        console.log('📋 Email:', adminUser.email);
        console.log('📋 Created:', adminUser.created_at);
      } else {
        console.log('❌ Admin user NOT found in auth.users');
      }
    }
    
    // Check users table
    console.log('\n2️⃣ Checking users table...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'admin@preset.ie');
    
    if (usersError) {
      console.log('❌ Error checking users table:', usersError.message);
    } else {
      if (users && users.length > 0) {
        console.log('✅ Admin user exists in users table');
        console.log('📋 User ID:', users[0].id);
        console.log('📋 Role:', users[0].role);
      } else {
        console.log('❌ Admin user NOT found in users table');
      }
    }
    
    // Check users_profile table
    console.log('\n3️⃣ Checking users_profile table...');
    const { data: profiles, error: profilesError } = await supabase
      .from('users_profile')
      .select('*')
      .eq('handle', 'admin');
    
    if (profilesError) {
      console.log('❌ Error checking users_profile table:', profilesError.message);
    } else {
      if (profiles && profiles.length > 0) {
        console.log('✅ Admin profile exists in users_profile table');
        console.log('📋 Profile ID:', profiles[0].id);
        console.log('📋 Display Name:', profiles[0].display_name);
      } else {
        console.log('❌ Admin profile NOT found in users_profile table');
      }
    }
    
    // Test sign in
    console.log('\n4️⃣ Testing sign in...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'admin@preset.ie',
      password: 'Admin123!@#'
    });
    
    if (signInError) {
      console.log('❌ Sign in failed:', signInError.message);
    } else {
      console.log('✅ Sign in successful!');
      console.log('📋 Session user:', signInData.user.email);
    }
    
    console.log('\n📋 Summary:');
    console.log('If admin user is missing from auth.users, you need to create it');
    console.log('If admin user exists but sign in fails, check the password');
    
  } catch (error) {
    console.error('❌ Check failed:', error);
  }
}

// Run the check
checkAdminExists();

#!/usr/bin/env node

/**
 * Debug User Creation
 * This script debugs why user creation is failing
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

async function debugUserCreation() {
  try {
    console.log('🔍 Debugging user creation...\n');
    
    // Check if users table exists and is accessible
    console.log('1️⃣ Checking users table...');
    const { data: usersTest, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (usersError) {
      console.log('❌ Users table error:', usersError.message);
    } else {
      console.log('✅ Users table accessible');
    }
    
    // Check if users_profile table exists and is accessible
    console.log('2️⃣ Checking users_profile table...');
    const { data: profileTest, error: profileError } = await supabase
      .from('users_profile')
      .select('*')
      .limit(1);
    
    if (profileError) {
      console.log('❌ Users_profile table error:', profileError.message);
    } else {
      console.log('✅ Users_profile table accessible');
    }
    
    // Check if user_settings table exists and is accessible
    console.log('3️⃣ Checking user_settings table...');
    const { data: settingsTest, error: settingsError } = await supabase
      .from('user_settings')
      .select('*')
      .limit(1);
    
    if (settingsError) {
      console.log('❌ User_settings table error:', settingsError.message);
    } else {
      console.log('✅ User_settings table accessible');
    }
    
    // Check if user_credits table exists and is accessible
    console.log('4️⃣ Checking user_credits table...');
    const { data: creditsTest, error: creditsError } = await supabase
      .from('user_credits')
      .select('*')
      .limit(1);
    
    if (creditsError) {
      console.log('❌ User_credits table error:', creditsError.message);
    } else {
      console.log('✅ User_credits table accessible');
    }
    
    // Try to manually insert a test user to see what happens
    console.log('5️⃣ Testing manual user insertion...');
    const testUserId = '00000000-0000-0000-0000-000000000001';
    
    try {
      const { data: insertTest, error: insertError } = await supabase
        .from('users')
        .insert({
          id: testUserId,
          email: 'test@example.com',
          role: 'TALENT'
        })
        .select();
      
      if (insertError) {
        console.log('❌ Manual insert error:', insertError.message);
      } else {
        console.log('✅ Manual insert successful');
        // Clean up test data
        await supabase.from('users').delete().eq('id', testUserId);
      }
    } catch (err) {
      console.log('❌ Manual insert exception:', err.message);
    }
    
    // Check if there are any existing users
    console.log('6️⃣ Checking existing users...');
    const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.log('❌ List users error:', listError.message);
    } else {
      console.log(`✅ Found ${existingUsers.users.length} existing users`);
      existingUsers.users.forEach(user => {
        console.log(`   - ${user.email} (${user.id})`);
      });
    }
    
    console.log('\n📋 Summary:');
    console.log('If you see table errors above, those tables need to be fixed');
    console.log('If all tables are accessible, the issue might be with triggers or RLS policies');
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

// Run the debug
debugUserCreation();

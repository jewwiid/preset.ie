#!/usr/bin/env node

/**
 * Test Admin Signup
 * This script tests creating a user using the admin API
 */

const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config()

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testAdminSignup() {
  try {
    console.log('🧪 Testing admin signup...\n')
    
    const testEmail = 'test@example.com'
    const testPassword = 'TestPassword123!'
    
    // Step 1: Try to create user with admin API
    console.log('1️⃣ Creating user with admin API...')
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true
    })
    
    if (authError) {
      console.error('   ❌ Admin user creation failed:', authError.message)
      console.error('   Error details:', authError)
      
      // Check if user already exists
      console.log('\n   🔍 Checking if user already exists...')
      const { data: existingUsers } = await supabase.auth.admin.listUsers()
      const existingUser = existingUsers.users.find(u => u.email === testEmail)
      
      if (existingUser) {
        console.log('   ✅ User already exists, using existing user')
        authData = { user: existingUser }
      } else {
        console.log('   ❌ User does not exist and creation failed')
        return
      }
    } else {
      console.log('   ✅ Admin user creation successful')
      console.log('   User ID:', authData.user.id)
    }
    
    // Step 2: Create profile
    console.log('\n2️⃣ Creating user profile...')
    const { data: profileData, error: profileError } = await supabase
      .from('users_profile')
      .insert({
        user_id: authData.user.id,
        display_name: 'Test User',
        handle: 'test_user_' + Date.now(),
        role_flags: ['TALENT'],
        subscription_tier: 'FREE',
        subscription_status: 'ACTIVE',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (profileError) {
      console.error('   ❌ Profile creation failed:', profileError.message)
      console.error('   Error details:', profileError)
    } else {
      console.log('   ✅ Profile creation successful')
      console.log('   Profile ID:', profileData.id)
    }
    
    // Step 3: Clean up
    console.log('\n3️⃣ Cleaning up test data...')
    if (profileData) {
      await supabase
        .from('users_profile')
        .delete()
        .eq('id', profileData.id)
      console.log('   ✅ Profile deleted')
    }
    
    if (authData.user) {
      await supabase.auth.admin.deleteUser(authData.user.id)
      console.log('   ✅ User deleted')
    }
    
    console.log('\n✅ Admin signup test complete')
    
  } catch (error) {
    console.error('❌ Admin signup test failed:', error)
  }
}

testAdminSignup()

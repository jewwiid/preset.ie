#!/usr/bin/env node

/**
 * Test Signup Process
 * This script tests the signup process to identify issues
 */

const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config()

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables')
  console.error('   SUPABASE_URL:', supabaseUrl ? '✅' : '❌')
  console.error('   SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅' : '❌')
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌')
  process.exit(1)
}

// Create clients
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

async function testSignup() {
  try {
    console.log('🧪 Testing signup process...\n')
    
    const testEmail = 'test@example.com'
    const testPassword = 'TestPassword123!'
    
    // Step 1: Test basic connection
    console.log('1️⃣ Testing basic connection...')
    const { data: testData, error: testError } = await supabaseAnon
      .from('users_profile')
      .select('count')
      .limit(1)
    
    if (testError) {
      console.error('   ❌ Basic connection failed:', testError.message)
      return
    }
    
    console.log('   ✅ Basic connection successful')
    
    // Step 2: Test auth signup
    console.log('\n2️⃣ Testing auth signup...')
    const { data: signupData, error: signupError } = await supabaseAnon.auth.signUp({
      email: testEmail,
      password: testPassword
    })
    
    if (signupError) {
      console.error('   ❌ Auth signup failed:', signupError.message)
      console.error('   Error details:', signupError)
      
      // Check if it's a duplicate email error
      if (signupError.message.includes('already registered')) {
        console.log('   💡 User already exists, trying to sign in...')
        
        const { data: signinData, error: signinError } = await supabaseAnon.auth.signInWithPassword({
          email: testEmail,
          password: testPassword
        })
        
        if (signinError) {
          console.error('   ❌ Sign in also failed:', signinError.message)
        } else {
          console.log('   ✅ Sign in successful, user exists')
          signupData = signinData
        }
      }
    } else {
      console.log('   ✅ Auth signup successful')
      console.log('   User ID:', signupData.user?.id)
      console.log('   Email confirmed:', signupData.user?.email_confirmed_at ? 'Yes' : 'No')
    }
    
    if (!signupData?.user) {
      console.log('   ❌ No user data available, cannot proceed')
      return
    }
    
    // Step 3: Test profile creation
    console.log('\n3️⃣ Testing profile creation...')
    const { data: profileData, error: profileError } = await supabaseAnon
      .from('users_profile')
      .insert({
        user_id: signupData.user.id,
        display_name: 'Test User',
        handle: 'test_user_' + Date.now(),
        role_flags: ['TALENT'],
        subscription_tier: 'FREE'
      })
      .select()
      .single()
    
    if (profileError) {
      console.error('   ❌ Profile creation failed:', profileError.message)
      console.error('   Error details:', profileError)
      
      // Check specific error types
      if (profileError.message.includes('foreign key')) {
        console.log('   💡 Foreign key constraint - user might not exist in auth.users')
      } else if (profileError.message.includes('permission denied')) {
        console.log('   💡 Permission denied - RLS policy might be blocking')
      } else if (profileError.message.includes('duplicate key')) {
        console.log('   💡 Duplicate key - profile might already exist')
      }
    } else {
      console.log('   ✅ Profile creation successful')
      console.log('   Profile ID:', profileData.id)
      
      // Clean up test data
      console.log('\n4️⃣ Cleaning up test data...')
      await supabaseAdmin
        .from('users_profile')
        .delete()
        .eq('id', profileData.id)
      
      await supabaseAdmin.auth.admin.deleteUser(signupData.user.id)
      console.log('   ✅ Test data cleaned up')
    }
    
    console.log('\n✅ Signup test complete')
    
  } catch (error) {
    console.error('❌ Signup test failed:', error)
  }
}

testSignup()

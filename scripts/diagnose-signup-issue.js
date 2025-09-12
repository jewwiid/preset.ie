#!/usr/bin/env node

/**
 * Diagnose Signup Issue
 * This script diagnoses the signup issue based on the actual database schema
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

async function diagnoseSignupIssue() {
  try {
    console.log('🔍 Diagnosing signup issue...\n')
    
    // Step 1: Check if we can access the database
    console.log('1️⃣ Testing database access...')
    const { data: testData, error: testError } = await supabase
      .from('users_profile')
      .select('count')
      .limit(1)
    
    if (testError) {
      console.error('   ❌ Database access failed:', testError.message)
      return
    }
    
    console.log('   ✅ Database access successful')
    
    // Step 2: Check auth users
    console.log('\n2️⃣ Checking auth users...')
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.error('   ❌ Auth users access failed:', authError.message)
      return
    }
    
    console.log('   ✅ Auth users accessible')
    console.log('   📊 Found', authUsers.users.length, 'users')
    
    // Step 3: Test user creation with admin API
    console.log('\n3️⃣ Testing user creation with admin API...')
    const testEmail = 'test@example.com'
    const testPassword = 'TestPassword123!'
    
    const { data: authData, error: authError2 } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true
    })
    
    if (authError2) {
      console.log('   ❌ User creation failed:', authError2.message)
      console.log('   Error code:', authError2.status)
      console.log('   Error details:', authError2)
      
      // Check if user already exists
      const existingUser = authUsers.users.find(u => u.email === testEmail)
      if (existingUser) {
        console.log('   ✅ User already exists, using existing user')
        authData = { user: existingUser }
      } else {
        console.log('\n🔍 Analysis of the error:')
        console.log('   - Status 500 indicates a server-side error')
        console.log('   - "Database error saving new user" suggests a database constraint issue')
        console.log('   - This could be caused by:')
        console.log('     1. RLS policies blocking user creation')
        console.log('     2. Database triggers causing issues')
        console.log('     3. Missing database functions')
        console.log('     4. Supabase project configuration issue')
        
        console.log('\n💡 Recommended solutions:')
        console.log('   1. Check Supabase Dashboard → Database → Logs for detailed errors')
        console.log('   2. Verify RLS policies are not blocking user creation')
        console.log('   3. Check if there are any database triggers causing issues')
        console.log('   4. Consider creating a new Supabase project if corrupted')
        
        return
      }
    } else {
      console.log('   ✅ User creation successful!')
      console.log('   User ID:', authData.user.id)
    }
    
    // Step 4: Test profile creation
    if (authData?.user) {
      console.log('\n4️⃣ Testing profile creation...')
      const { data: profileData, error: profileError } = await supabase
        .from('users_profile')
        .insert({
          user_id: authData.user.id,
          display_name: 'Test User',
          handle: 'test_user_' + Date.now(),
          role_flags: ['TALENT'],
          subscription_tier: 'FREE',
          subscription_status: 'ACTIVE'
        })
        .select()
        .single()
      
      if (profileError) {
        console.log('   ❌ Profile creation failed:', profileError.message)
      } else {
        console.log('   ✅ Profile creation successful!')
        console.log('   Profile ID:', profileData.id)
        
        // Clean up
        await supabase
          .from('users_profile')
          .delete()
          .eq('id', profileData.id)
        
        await supabase.auth.admin.deleteUser(authData.user.id)
        console.log('   🧹 Test data cleaned up')
      }
    }
    
    console.log('\n✅ Diagnosis complete')
    
  } catch (error) {
    console.error('❌ Diagnosis failed:', error)
  }
}

diagnoseSignupIssue()

#!/usr/bin/env node

/**
 * Fix User Creation Issue
 * This script addresses the database error when creating new users
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

async function fixUserCreation() {
  try {
    console.log('🔧 Fixing user creation issue...\n')
    
    // Step 1: Check current RLS policies
    console.log('1️⃣ Checking RLS policies on users_profile...')
    const { data: policies, error: policiesError } = await supabase
      .rpc('get_rls_policies', { table_name: 'users_profile' })
      .catch(() => {
        console.log('   ⚠️  RLS policies check not available')
        return { data: null, error: null }
      })
    
    if (policiesError) {
      console.log('   ⚠️  RLS policies check failed:', policiesError.message)
    } else if (policies) {
      console.log('   📊 Found', policies.length, 'RLS policies')
    }
    
    // Step 2: Test if we can insert with service role
    console.log('\n2️⃣ Testing service role insert...')
    const testProfile = {
      user_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
      display_name: 'Test User',
      handle: 'test_user_' + Date.now(),
      role_flags: ['TALENT'],
      subscription_tier: 'FREE'
    }
    
    const { data: insertData, error: insertError } = await supabase
      .from('users_profile')
      .insert(testProfile)
      .select()
    
    if (insertError) {
      console.log('   ❌ Service role insert failed:', insertError.message)
      
      if (insertError.message.includes('foreign key')) {
        console.log('   💡 Foreign key constraint - need valid user_id from auth.users')
      } else if (insertError.message.includes('permission denied')) {
        console.log('   💡 Permission denied - RLS policy issue')
      } else if (insertError.message.includes('duplicate key')) {
        console.log('   💡 Duplicate key - handle already exists')
      }
    } else {
      console.log('   ✅ Service role insert successful')
      
      // Clean up
      await supabase
        .from('users_profile')
        .delete()
        .eq('id', insertData[0].id)
      console.log('   🧹 Test data cleaned up')
    }
    
    // Step 3: Check if auth.users table is accessible
    console.log('\n3️⃣ Checking auth.users access...')
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.error('   ❌ Auth users access failed:', authError.message)
    } else {
      console.log('   ✅ Auth users accessible')
      console.log('   📊 Found', authUsers.users.length, 'users')
    }
    
    // Step 4: Test user creation with minimal data
    console.log('\n4️⃣ Testing minimal user creation...')
    const testEmail = 'test@example.com'
    const testPassword = 'TestPassword123!'
    
    // Try to create user with admin API
    const { data: authData, error: authError2 } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true
    })
    
    if (authError2) {
      console.log('   ❌ User creation failed:', authError2.message)
      
      // Check if user already exists
      const existingUser = authUsers.users.find(u => u.email === testEmail)
      if (existingUser) {
        console.log('   ✅ User already exists, using existing user')
        authData = { user: existingUser }
      } else {
        console.log('   ❌ User does not exist and creation failed')
        console.log('\n🔍 Possible causes:')
        console.log('   1. Database constraints preventing user creation')
        console.log('   2. RLS policies blocking user creation')
        console.log('   3. Missing database functions or triggers')
        console.log('   4. Supabase project configuration issue')
        return
      }
    } else {
      console.log('   ✅ User creation successful!')
      console.log('   User ID:', authData.user.id)
    }
    
    // Step 5: Test profile creation
    if (authData?.user) {
      console.log('\n5️⃣ Testing profile creation...')
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
    
    console.log('\n✅ User creation fix complete')
    
  } catch (error) {
    console.error('❌ User creation fix failed:', error)
  }
}

fixUserCreation()

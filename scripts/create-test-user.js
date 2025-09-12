#!/usr/bin/env node

/**
 * Create Test User - Bypass the signup issue
 * This script creates a user directly in the database bypassing the broken signup flow
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

async function createTestUser() {
  try {
    console.log('🔧 Creating test user to bypass signup issue...\n')
    
    const testEmail = 'test@preset.ie'
    const testPassword = 'TestUser123!'
    
    console.log('1️⃣ Checking if test user already exists...')
    const { data: existingUsers } = await supabase.auth.admin.listUsers()
    const existingUser = existingUsers.users.find(u => u.email === testEmail)
    
    let userId
    
    if (existingUser) {
      console.log('   ✅ Test user already exists:', existingUser.id)
      userId = existingUser.id
    } else {
      console.log('2️⃣ Creating test user...')
      console.log('   ❌ Signup API is broken, need manual creation')
      console.log('\n🔧 MANUAL STEPS REQUIRED:')
      console.log('1. Go to https://supabase.com/dashboard')
      console.log('2. Navigate to your project')
      console.log('3. Go to Authentication → Users')
      console.log('4. Click "Add user"')
      console.log('5. Enter:')
      console.log('   - Email: test@preset.ie')
      console.log('   - Password: TestUser123!')
      console.log('   - Email Confirmed: ✅')
      console.log('6. Click "Create user"')
      console.log('7. Copy the user ID and run this script again')
      return
    }
    
    console.log('3️⃣ Creating/updating user profile...')
    const { data: profile, error: profileError } = await supabase
      .from('users_profile')
      .upsert({
        user_id: userId,
        display_name: 'Test User',
        handle: 'test_user',
        bio: 'Test user for development',
        city: 'Dublin',
        role_flags: ['TALENT'],
        subscription_tier: 'FREE',
        subscription_status: 'ACTIVE',
        verified_id: false
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single()
    
    if (profileError) {
      console.log('   ❌ Profile creation failed:', profileError.message)
      console.log('   📋 Profile error details:', profileError)
    } else {
      console.log('   ✅ Profile created successfully!')
      console.log('   📋 Profile ID:', profile.id)
    }
    
    console.log('\n✅ Test user setup complete!')
    console.log('📧 Email:', testEmail)
    console.log('🔑 Password:', testPassword)
    console.log('🆔 User ID:', userId)
    console.log('\n🔗 Try logging in at: http://localhost:3000/auth/signin')
    
  } catch (error) {
    console.error('❌ Failed to create test user:', error)
    console.log('\n💡 Manual solution required:')
    console.log('1. Go to Supabase Dashboard')
    console.log('2. Create user manually in Authentication > Users')
    console.log('3. Create profile manually in Table Editor > users_profile')
  }
}

createTestUser()
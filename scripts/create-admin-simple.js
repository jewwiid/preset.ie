#!/usr/bin/env node

/**
 * Create Admin User - Simple Approach
 * Create user through regular signup flow, then promote to admin
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

async function createAdminSimple() {
  try {
    console.log('🔧 Creating admin user with simple approach...\n')
    
    const adminEmail = 'admin@preset.ie'
    const adminPassword = 'Admin123!@#'
    const adminDisplayName = 'Admin User'
    const adminHandle = 'admin_user'
    
    // Step 1: Try to create auth user with minimal data
    console.log('1️⃣ Creating auth user...')
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true
    })
    
    if (authError) {
      console.error('   ❌ Auth user creation failed:', authError.message)
      
      // Try alternative approach - check if user already exists
      console.log('\n   🔍 Checking if user already exists...')
      const { data: existingUsers } = await supabase.auth.admin.listUsers()
      const existingUser = existingUsers.users.find(u => u.email === adminEmail)
      
      if (existingUser) {
        console.log('   ✅ User already exists, using existing user')
        authData = { user: existingUser }
      } else {
        console.log('   ❌ User does not exist and creation failed')
        return
      }
    } else {
      console.log('   ✅ Auth user created:', authData.user.id)
    }
    
    // Step 2: Create user profile
    console.log('\n2️⃣ Creating user profile...')
    const { data: profileData, error: profileError } = await supabase
      .from('users_profile')
      .insert({
        user_id: authData.user.id,
        display_name: adminDisplayName,
        handle: adminHandle,
        bio: 'Platform Administrator',
        city: 'Dublin',
        role_flags: ['ADMIN', 'CONTRIBUTOR', 'TALENT'],
        style_tags: ['Professional', 'Administrative'],
        subscription_tier: 'PRO',
        subscription_status: 'ACTIVE',
        verified_id: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (profileError) {
      console.error('   ❌ Profile creation failed:', profileError.message)
      
      // Check if profile already exists
      console.log('\n   🔍 Checking if profile already exists...')
      const { data: existingProfile } = await supabase
        .from('users_profile')
        .select('*')
        .eq('user_id', authData.user.id)
        .single()
      
      if (existingProfile) {
        console.log('   ✅ Profile already exists, updating to admin...')
        
        // Update existing profile to admin
        const { error: updateError } = await supabase
          .from('users_profile')
          .update({
            role_flags: ['ADMIN', 'CONTRIBUTOR', 'TALENT'],
            subscription_tier: 'PRO',
            verified_id: true,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', authData.user.id)
        
        if (updateError) {
          console.error('   ❌ Profile update failed:', updateError.message)
          return
        }
        
        console.log('   ✅ Profile updated to admin')
      } else {
        console.log('   ❌ Profile does not exist and creation failed')
        return
      }
    } else {
      console.log('   ✅ Profile created:', profileData.id)
    }
    
    // Step 3: Verify admin access
    console.log('\n3️⃣ Verifying admin access...')
    const { data: verifyData, error: verifyError } = await supabase
      .from('users_profile')
      .select('*')
      .eq('user_id', authData.user.id)
      .single()
    
    if (verifyError) {
      console.error('   ❌ Verification failed:', verifyError.message)
      return
    }
    
    console.log('   ✅ Admin user verified:')
    console.log('      - Email:', adminEmail)
    console.log('      - Display Name:', verifyData.display_name)
    console.log('      - Handle:', verifyData.handle)
    console.log('      - Roles:', verifyData.role_flags.join(', '))
    console.log('      - Subscription:', verifyData.subscription_tier)
    console.log('      - Verified ID:', verifyData.verified_id)
    
    console.log('\n🎉 Admin user ready!')
    console.log('\n📋 Login Credentials:')
    console.log('   Email:', adminEmail)
    console.log('   Password:', adminPassword)
    console.log('   Username:', adminHandle)
    
    console.log('\n🚀 Next Steps:')
    console.log('   1. Visit http://localhost:3000/auth/signin')
    console.log('   2. Sign in with the credentials above')
    console.log('   3. Visit http://localhost:3000/admin to access admin panel')
    
  } catch (error) {
    console.error('❌ Admin user creation failed:', error)
  }
}

createAdminSimple()

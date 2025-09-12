#!/usr/bin/env node

/**
 * Create Admin Profile
 * This script creates an admin profile for an existing auth user
 * Run this after creating the auth user via Supabase Dashboard
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

async function createAdminProfile() {
  try {
    console.log('🔧 Creating admin profile...\n')
    
    const adminEmail = 'admin@preset.ie'
    
    // Step 1: Find the admin user
    console.log('1️⃣ Finding admin user...')
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.error('   ❌ Error fetching users:', authError.message)
      return
    }
    
    const adminUser = authUsers.users.find(u => u.email === adminEmail)
    
    if (!adminUser) {
      console.error(`   ❌ Admin user with email ${adminEmail} not found`)
      console.log('\n📋 Available users:')
      authUsers.users.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email} (${user.id})`)
      })
      console.log('\n💡 Please create the admin user via Supabase Dashboard first')
      return
    }
    
    console.log('   ✅ Admin user found:', adminUser.email)
    console.log('   User ID:', adminUser.id)
    
    // Step 2: Check if profile already exists
    console.log('\n2️⃣ Checking existing profile...')
    const { data: existingProfile, error: profileError } = await supabase
      .from('users_profile')
      .select('*')
      .eq('user_id', adminUser.id)
      .single()
    
    if (profileError && profileError.code !== 'PGRST116') {
      console.error('   ❌ Error checking profile:', profileError.message)
      return
    }
    
    if (existingProfile) {
      console.log('   ✅ Profile already exists, updating to admin...')
      
      // Update existing profile to admin
      const { data: updatedProfile, error: updateError } = await supabase
        .from('users_profile')
        .update({
          role_flags: ['ADMIN', 'CONTRIBUTOR', 'TALENT'],
          subscription_tier: 'PRO',
          subscription_status: 'ACTIVE',
          verified_id: true,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', adminUser.id)
        .select()
        .single()
      
      if (updateError) {
        console.error('   ❌ Profile update failed:', updateError.message)
        return
      }
      
      console.log('   ✅ Profile updated to admin')
      console.log('   Updated profile:', updatedProfile)
    } else {
      console.log('   📝 Creating new admin profile...')
      
      // Create new admin profile
      const { data: newProfile, error: createError } = await supabase
        .from('users_profile')
        .insert({
          user_id: adminUser.id,
          display_name: 'Admin User',
          handle: 'admin_user',
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
      
      if (createError) {
        console.error('   ❌ Profile creation failed:', createError.message)
        return
      }
      
      console.log('   ✅ Admin profile created')
      console.log('   Profile ID:', newProfile.id)
    }
    
    // Step 3: Verify admin access
    console.log('\n3️⃣ Verifying admin access...')
    const { data: verifyProfile, error: verifyError } = await supabase
      .from('users_profile')
      .select('*')
      .eq('user_id', adminUser.id)
      .single()
    
    if (verifyError) {
      console.error('   ❌ Verification failed:', verifyError.message)
      return
    }
    
    console.log('   ✅ Admin profile verified:')
    console.log('      - Display Name:', verifyProfile.display_name)
    console.log('      - Handle:', verifyProfile.handle)
    console.log('      - Roles:', verifyProfile.role_flags.join(', '))
    console.log('      - Subscription:', verifyProfile.subscription_tier)
    console.log('      - Verified ID:', verifyProfile.verified_id)
    
    console.log('\n🎉 Admin profile setup complete!')
    console.log('\n📋 Login Credentials:')
    console.log('   Email:', adminEmail)
    console.log('   Password: (use the password you set in Supabase Dashboard)')
    console.log('   Username:', verifyProfile.handle)
    
    console.log('\n🚀 Next Steps:')
    console.log('   1. Visit http://localhost:3000/auth/signin')
    console.log('   2. Sign in with the admin credentials')
    console.log('   3. Visit http://localhost:3000/admin to access admin panel')
    console.log('   4. Test the verification system and other admin features')
    
  } catch (error) {
    console.error('❌ Admin profile creation failed:', error)
  }
}

createAdminProfile()

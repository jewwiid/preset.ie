#!/usr/bin/env node

/**
 * Promote User to Admin
 * This script promotes an existing user to admin role
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

async function promoteToAdmin() {
  try {
    console.log('🔧 Promoting user to admin...\n')
    
    // Get email from command line argument or use default
    const userEmail = process.argv[2] || 'admin@preset.ie'
    
    console.log(`📧 Looking for user: ${userEmail}`)
    
    // Step 1: Find the user by email
    console.log('1️⃣ Finding user by email...')
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.error('   ❌ Error fetching auth users:', authError.message)
      return
    }
    
    const targetUser = authUsers.users.find(u => u.email === userEmail)
    
    if (!targetUser) {
      console.error(`   ❌ User with email ${userEmail} not found`)
      console.log('\n📋 Available users:')
      authUsers.users.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email} (${user.id})`)
      })
      return
    }
    
    console.log('   ✅ User found:', targetUser.email)
    
    // Step 2: Check if profile exists
    console.log('\n2️⃣ Checking user profile...')
    const { data: existingProfile, error: profileError } = await supabase
      .from('users_profile')
      .select('*')
      .eq('user_id', targetUser.id)
      .single()
    
    if (profileError) {
      console.error('   ❌ Profile not found:', profileError.message)
      console.log('   💡 User needs to complete profile setup first')
      return
    }
    
    console.log('   ✅ Profile found:', existingProfile.display_name)
    
    // Step 3: Update profile to admin
    console.log('\n3️⃣ Promoting to admin...')
    const { data: updatedProfile, error: updateError } = await supabase
      .from('users_profile')
      .update({
        role_flags: ['ADMIN', 'CONTRIBUTOR', 'TALENT'],
        subscription_tier: 'PRO',
        subscription_status: 'ACTIVE',
        verified_id: true,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', targetUser.id)
      .select()
      .single()
    
    if (updateError) {
      console.error('   ❌ Promotion failed:', updateError.message)
      return
    }
    
    console.log('   ✅ User promoted to admin successfully!')
    
    // Step 4: Verify admin status
    console.log('\n4️⃣ Verifying admin status...')
    console.log('   📊 Updated profile:')
    console.log('      - Display Name:', updatedProfile.display_name)
    console.log('      - Handle:', updatedProfile.handle)
    console.log('      - Roles:', updatedProfile.role_flags.join(', '))
    console.log('      - Subscription:', updatedProfile.subscription_tier)
    console.log('      - Verified ID:', updatedProfile.verified_id)
    
    console.log('\n🎉 Admin promotion complete!')
    console.log('\n🚀 Next Steps:')
    console.log('   1. Sign in with the promoted user')
    console.log('   2. Visit http://localhost:3000/admin to access admin panel')
    console.log('   3. Test the verification system and other admin features')
    
  } catch (error) {
    console.error('❌ Admin promotion failed:', error)
  }
}

promoteToAdmin()

#!/usr/bin/env node

/**
 * Check Existing Users in Database
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

async function checkUsers() {
  try {
    console.log('🔍 Checking existing users...\n')
    
    // Check auth users
    console.log('1️⃣ Auth users:')
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.error('   ❌ Error fetching auth users:', authError.message)
    } else {
      console.log('   📊 Found', authUsers.users.length, 'auth users')
      authUsers.users.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email} (${user.id})`)
        console.log(`      - Created: ${new Date(user.created_at).toLocaleString()}`)
        console.log(`      - Confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`)
      })
    }
    
    // Check user profiles
    console.log('\n2️⃣ User profiles:')
    const { data: profiles, error: profileError } = await supabase
      .from('users_profile')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (profileError) {
      console.error('   ❌ Error fetching profiles:', profileError.message)
    } else {
      console.log('   📊 Found', profiles.length, 'user profiles')
      profiles.forEach((profile, index) => {
        console.log(`   ${index + 1}. ${profile.display_name} (@${profile.handle})`)
        console.log(`      - Email: ${profile.user_id}`)
        console.log(`      - Roles: ${profile.role_flags.join(', ')}`)
        console.log(`      - Subscription: ${profile.subscription_tier}`)
        console.log(`      - Created: ${new Date(profile.created_at).toLocaleString()}`)
      })
    }
    
    // Check if admin already exists
    console.log('\n3️⃣ Admin check:')
    const adminProfiles = profiles?.filter(p => p.role_flags.includes('ADMIN')) || []
    if (adminProfiles.length > 0) {
      console.log('   ✅ Admin users found:')
      adminProfiles.forEach(admin => {
        console.log(`      - ${admin.display_name} (@${admin.handle})`)
      })
    } else {
      console.log('   ❌ No admin users found')
    }
    
  } catch (error) {
    console.error('❌ Error checking users:', error)
  }
}

checkUsers()

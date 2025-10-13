#!/usr/bin/env node

// Script to reset admin user password
// Run with: node reset-admin-password.js

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://zbsmgymyfhnwjdnmlelr.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function resetAdminPassword() {
  try {
    console.log('🔧 Resetting admin password...')
    
    // Get the admin user by email
    const { data: users, error: listError } = await supabase.auth.admin.listUsers()
    
    if (listError) {
      console.error('❌ Error listing users:', listError)
      return
    }
    
    const adminUser = users.users.find(user => user.email === 'admin@preset.ie')
    
    if (!adminUser) {
      console.error('❌ Admin user not found')
      return
    }
    
    console.log('✅ Found admin user:', adminUser.id)
    
    // Update the user's password
    const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
      adminUser.id,
      {
        password: 'Admin123!',
        email_confirm: true
      }
    )
    
    if (updateError) {
      console.error('❌ Error updating password:', updateError)
      return
    }
    
    console.log('✅ Password updated successfully')
    console.log('')
    console.log('🎉 Admin user password reset!')
    console.log('📧 Email: admin@preset.ie')
    console.log('🔑 Password: Admin123!')
    console.log('')
    console.log('You can now sign in with these credentials.')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

resetAdminPassword()

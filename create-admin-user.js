#!/usr/bin/env node

// Script to create an admin user in Supabase Auth
// Run with: node create-admin-user.js

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://zbsmgymyfhnwjdnmlelr.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createAdminUser() {
  try {
    console.log('🔧 Creating admin user...')
    
    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'admin@preset.ie',
      password: 'Admin123!',
      email_confirm: true,
      user_metadata: {
        full_name: 'Admin User'
      }
    })
    
    if (authError) {
      console.error('❌ Error creating auth user:', authError)
      return
    }
    
    console.log('✅ Auth user created:', authData.user.id)
    
    // Update the existing profile to match the new auth user
    const { error: profileError } = await supabase
      .from('users_profile')
      .update({ 
        user_id: authData.user.id,
        display_name: 'Admin User',
        handle: 'admin',
        role_flags: ['ADMIN'],
        subscription_tier: 'PRO'
      })
      .eq('user_id', '550e8400-e29b-41d4-a716-446655440000')
    
    if (profileError) {
      console.error('❌ Error updating profile:', profileError)
      return
    }
    
    console.log('✅ Profile updated successfully')
    console.log('')
    console.log('🎉 Admin user created successfully!')
    console.log('📧 Email: admin@preset.ie')
    console.log('🔑 Password: Admin123!')
    console.log('')
    console.log('You can now sign in with these credentials.')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

createAdminUser()

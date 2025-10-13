#!/usr/bin/env node

// Comprehensive script to fix admin authentication
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://zbsmgymyfhnwjdnmlelr.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixAdminAuth() {
  try {
    console.log('🔧 Fixing admin authentication...')
    
    // Step 1: Get the admin user
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
    console.log('📧 Email confirmed:', adminUser.email_confirmed_at)
    console.log('🕒 Last sign in:', adminUser.last_sign_in_at)
    
    // Step 2: Update password with a simple, known password
    const newPassword = 'admin123'
    const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
      adminUser.id,
      {
        password: newPassword,
        email_confirm: true
      }
    )
    
    if (updateError) {
      console.error('❌ Error updating password:', updateError)
      return
    }
    
    console.log('✅ Password updated successfully')
    
    // Step 3: Test the authentication
    console.log('🧪 Testing authentication...')
    
    const testClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    
    const { data: authData, error: authError } = await testClient.auth.signInWithPassword({
      email: 'admin@preset.ie',
      password: newPassword
    })
    
    if (authError) {
      console.error('❌ Authentication test failed:', authError.message)
      return
    }
    
    console.log('✅ Authentication test successful!')
    console.log('')
    console.log('🎉 Admin authentication fixed!')
    console.log('📧 Email: admin@preset.ie')
    console.log('🔑 Password: admin123')
    console.log('')
    console.log('📝 Next steps:')
    console.log('1. Clear your browser cache completely')
    console.log('2. Go to http://localhost:3000/auth/signin')
    console.log('3. Sign in with the credentials above')
    console.log('')
    console.log('💡 If you still have issues, try:')
    console.log('- Use an incognito/private window')
    console.log('- Check browser developer tools Network tab')
    console.log('- Ensure requests go to https://zbsmgymyfhnwjdnmlelr.supabase.co')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

fixAdminAuth()

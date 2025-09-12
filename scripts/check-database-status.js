#!/usr/bin/env node

/**
 * Check Database Status and RLS Policies
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

async function checkDatabaseStatus() {
  try {
    console.log('🔍 Checking database status...\n')
    
    // Test basic connection
    console.log('1️⃣ Testing database connection...')
    const { data: testData, error: testError } = await supabase
      .from('users_profile')
      .select('count')
      .limit(1)
    
    if (testError) {
      console.error('   ❌ Database connection failed:', testError.message)
      return
    }
    
    console.log('   ✅ Database connection successful')
    
    // Check RLS policies
    console.log('\n2️⃣ Checking RLS policies...')
    const { data: policies, error: policiesError } = await supabase
      .rpc('get_rls_policies')
      .catch(() => {
        console.log('   ⚠️  RLS policies check not available (function may not exist)')
        return { data: null, error: null }
      })
    
    if (policiesError) {
      console.log('   ⚠️  RLS policies check failed:', policiesError.message)
    } else if (policies) {
      console.log('   📊 RLS policies found:', policies.length)
    }
    
    // Check if we can insert into users_profile
    console.log('\n3️⃣ Testing users_profile insert...')
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
      console.log('   ❌ Insert test failed:', insertError.message)
      
      // Check if it's a constraint error
      if (insertError.message.includes('foreign key')) {
        console.log('   💡 This is expected - the user_id needs to exist in auth.users first')
      }
    } else {
      console.log('   ✅ Insert test successful')
      
      // Clean up test data
      await supabase
        .from('users_profile')
        .delete()
        .eq('id', insertData[0].id)
      console.log('   🧹 Test data cleaned up')
    }
    
    // Check auth users table
    console.log('\n4️⃣ Checking auth users...')
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.error('   ❌ Auth users check failed:', authError.message)
    } else {
      console.log('   📊 Auth users count:', authUsers.users.length)
    }
    
    console.log('\n✅ Database status check complete')
    
  } catch (error) {
    console.error('❌ Database status check failed:', error)
  }
}

checkDatabaseStatus()

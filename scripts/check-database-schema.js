#!/usr/bin/env node

/**
 * Check Database Schema
 * This script checks the database schema to identify missing tables or constraints
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

async function checkDatabaseSchema() {
  try {
    console.log('🔍 Checking database schema...\n')
    
    // Check if users_profile table exists and has correct structure
    console.log('1️⃣ Checking users_profile table...')
    const { data: profileData, error: profileError } = await supabase
      .from('users_profile')
      .select('*')
      .limit(1)
    
    if (profileError) {
      console.error('   ❌ users_profile table error:', profileError.message)
      
      if (profileError.message.includes('relation "users_profile" does not exist')) {
        console.log('   💡 users_profile table does not exist!')
        console.log('   🔧 Need to run database migrations')
      }
    } else {
      console.log('   ✅ users_profile table exists')
    }
    
    // Check auth.users table (this should always exist)
    console.log('\n2️⃣ Checking auth.users table...')
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.error('   ❌ auth.users table error:', authError.message)
    } else {
      console.log('   ✅ auth.users table exists')
      console.log('   📊 Found', authUsers.users.length, 'users')
    }
    
    // Check if we can query the database directly
    console.log('\n3️⃣ Testing direct database queries...')
    
    // Try to get table information
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_table_info')
      .catch(() => {
        console.log('   ⚠️  get_table_info function not available')
        return { data: null, error: null }
      })
    
    if (tablesError) {
      console.log('   ⚠️  Table info query failed:', tablesError.message)
    } else if (tables) {
      console.log('   📊 Tables found:', tables.length)
    }
    
    // Check if we can create a simple test record
    console.log('\n4️⃣ Testing record creation...')
    const testData = {
      user_id: '00000000-0000-0000-0000-000000000000',
      display_name: 'Test',
      handle: 'test_' + Date.now(),
      role_flags: ['TALENT'],
      subscription_tier: 'FREE'
    }
    
    const { data: insertData, error: insertError } = await supabase
      .from('users_profile')
      .insert(testData)
      .select()
    
    if (insertError) {
      console.log('   ❌ Insert test failed:', insertError.message)
      
      if (insertError.message.includes('relation "users_profile" does not exist')) {
        console.log('   💡 SOLUTION: Run database migrations to create tables')
      } else if (insertError.message.includes('foreign key')) {
        console.log('   💡 SOLUTION: Foreign key constraint - need valid user_id')
      } else if (insertError.message.includes('permission denied')) {
        console.log('   💡 SOLUTION: RLS policy issue - check permissions')
      }
    } else {
      console.log('   ✅ Insert test successful')
      
      // Clean up
      await supabase
        .from('users_profile')
        .delete()
        .eq('id', insertData[0].id)
      console.log('   🧹 Test data cleaned up')
    }
    
    // Check Supabase project status
    console.log('\n5️⃣ Checking Supabase project status...')
    console.log('   Project URL:', supabaseUrl)
    console.log('   Service Key available:', supabaseServiceKey ? 'Yes' : 'No')
    
    console.log('\n✅ Database schema check complete')
    
  } catch (error) {
    console.error('❌ Database schema check failed:', error)
  }
}

checkDatabaseSchema()

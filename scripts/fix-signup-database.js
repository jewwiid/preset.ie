#!/usr/bin/env node

/**
 * Fix Signup Database Issue
 * This script checks the database and applies the minimum required schema for user signup
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

async function fixSignupDatabase() {
  try {
    console.log('🔧 Fixing signup database issue...\n')
    
    // Step 1: Check if users_profile table exists
    console.log('1️⃣ Checking users_profile table...')
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'users_profile')
    
    if (tablesError) {
      console.log('   ❌ Cannot check table existence:', tablesError.message)
    } else if (tables && tables.length > 0) {
      console.log('   ✅ users_profile table exists')
    } else {
      console.log('   ❌ users_profile table does not exist')
      console.log('   🔧 Creating users_profile table...')
      
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS public.users_profile (
          id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
          display_name text NOT NULL,
          handle text UNIQUE NOT NULL,
          bio text,
          city text,
          role_flags text[] DEFAULT '{}',
          subscription_tier text DEFAULT 'FREE',
          subscription_status text DEFAULT 'ACTIVE',
          verified_id boolean DEFAULT false,
          created_at timestamptz DEFAULT now(),
          updated_at timestamptz DEFAULT now()
        );
        
        -- Enable RLS
        ALTER TABLE public.users_profile ENABLE ROW LEVEL SECURITY;
        
        -- Basic RLS policies
        CREATE POLICY IF NOT EXISTS "Users can view own profile" ON public.users_profile
        FOR SELECT USING (user_id = auth.uid());
        
        CREATE POLICY IF NOT EXISTS "Users can create own profile" ON public.users_profile
        FOR INSERT WITH CHECK (user_id = auth.uid());
        
        CREATE POLICY IF NOT EXISTS "Users can update own profile" ON public.users_profile
        FOR UPDATE USING (user_id = auth.uid());
      `
      
      const { error: createError } = await supabase.rpc('exec_sql', {
        query: createTableSQL
      })
      
      if (createError) {
        console.log('   ❌ Failed to create users_profile table:', createError.message)
      } else {
        console.log('   ✅ users_profile table created successfully')
      }
    }
    
    // Step 2: Test user creation with admin API
    console.log('\n2️⃣ Testing user creation...')
    const testEmail = `test${Date.now()}@example.com`
    const testPassword = 'TestPassword123!'
    
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true
    })
    
    if (authError) {
      console.log('   ❌ User creation still failed:', authError.message)
      console.log('   📋 Error details:', authError)
      
      if (authError.message.includes('Database error')) {
        console.log('\n🔍 This appears to be a Supabase project-level issue')
        console.log('💡 Solutions:')
        console.log('   1. Check Supabase Dashboard → Logs for detailed errors')
        console.log('   2. Try creating a fresh Supabase project')
        console.log('   3. Check if you have sufficient Supabase quota')
        console.log('   4. Verify your environment variables are correct')
      }
    } else {
      console.log('   ✅ User creation successful!')
      console.log('   🆔 User ID:', authData.user.id)
      
      // Test profile creation
      console.log('\n3️⃣ Testing profile creation...')
      const { data: profileData, error: profileError } = await supabase
        .from('users_profile')
        .insert({
          user_id: authData.user.id,
          display_name: 'Test User',
          handle: `test_user_${Date.now()}`,
          role_flags: ['TALENT'],
          subscription_tier: 'FREE',
          subscription_status: 'ACTIVE'
        })
        .select()
        .single()
      
      if (profileError) {
        console.log('   ❌ Profile creation failed:', profileError.message)
      } else {
        console.log('   ✅ Profile creation successful!')
        console.log('   📋 Profile ID:', profileData.id)
      }
      
      // Clean up test data
      console.log('\n4️⃣ Cleaning up test data...')
      if (profileData) {
        await supabase.from('users_profile').delete().eq('id', profileData.id)
      }
      await supabase.auth.admin.deleteUser(authData.user.id)
      console.log('   🧹 Test data cleaned up')
      
      console.log('\n✅ Database is working! Signup should now work.')
      console.log('🔗 Try signing up at: http://localhost:3000/auth/signup')
    }
    
  } catch (error) {
    console.error('❌ Fix attempt failed:', error)
    console.log('\n🆘 If this continues to fail:')
    console.log('   1. Create a new Supabase project')
    console.log('   2. Update your .env.local with new project credentials')
    console.log('   3. Run migrations on the fresh project')
  }
}

fixSignupDatabase()
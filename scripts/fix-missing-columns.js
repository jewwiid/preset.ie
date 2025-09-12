#!/usr/bin/env node

/**
 * Fix Missing Columns
 * This script adds missing columns to the database
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

async function fixMissingColumns() {
  try {
    console.log('🔧 Adding missing columns to users_profile table...\n')
    
    console.log('1️⃣ Adding date_of_birth column...')
    const { error: dateOfBirthError } = await supabase.rpc('exec_sql', {
      query: `
        ALTER TABLE public.users_profile 
        ADD COLUMN IF NOT EXISTS date_of_birth date;
        
        COMMENT ON COLUMN public.users_profile.date_of_birth IS 'User date of birth for age verification and compliance';
      `
    })
    
    if (dateOfBirthError) {
      console.log('   ❌ Failed to add date_of_birth column:', dateOfBirthError.message)
    } else {
      console.log('   ✅ date_of_birth column added successfully')
    }
    
    console.log('\n2️⃣ Testing the fix...')
    const { data, error } = await supabase
      .from('users_profile')
      .select('id, display_name, date_of_birth')
      .limit(1)
    
    if (error) {
      console.log('   ❌ Test query failed:', error.message)
    } else {
      console.log('   ✅ Test query successful! Column exists.')
      console.log('   📋 Sample data:', data)
    }
    
    console.log('\n✅ Database fix complete!')
    console.log('🔗 Try refreshing your application now')
    
  } catch (error) {
    console.error('❌ Failed to fix database:', error)
  }
}

fixMissingColumns()
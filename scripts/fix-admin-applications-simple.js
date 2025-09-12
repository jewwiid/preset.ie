#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables. Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function addAdminApplicationsPolicy() {
  console.log('Adding admin applications policy...')
  
  try {
    // First policy for SELECT
    const { error: selectError } = await supabase.rpc('exec_sql', {
      statement: `CREATE POLICY IF NOT EXISTS "Admin users can view all applications" ON applications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users_profile 
            WHERE user_id = auth.uid() 
            AND 'ADMIN' = ANY(role_flags)
        )
    );`
    })

    if (selectError) {
      console.error('Error creating SELECT policy:', selectError)
    } else {
      console.log('Successfully added admin SELECT policy for applications!')
    }

    // Second policy for UPDATE
    const { error: updateError } = await supabase.rpc('exec_sql', {
      statement: `CREATE POLICY IF NOT EXISTS "Admin users can update all applications" ON applications
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users_profile 
            WHERE user_id = auth.uid() 
            AND 'ADMIN' = ANY(role_flags)
        )
    );`
    })

    if (updateError) {
      console.error('Error creating UPDATE policy:', updateError)
    } else {
      console.log('Successfully added admin UPDATE policy for applications!')
    }

  } catch (error) {
    console.error('Error:', error)
  }
}

addAdminApplicationsPolicy()
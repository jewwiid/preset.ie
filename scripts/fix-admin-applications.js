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
  
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `
-- Add admin access policy for applications table
CREATE POLICY IF NOT EXISTS "Admin users can view all applications" ON applications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users_profile 
            WHERE user_id = auth.uid() 
            AND 'ADMIN' = ANY(role_flags)
        )
    );

-- Add admin update policy for applications (in case needed for moderation)
CREATE POLICY IF NOT EXISTS "Admin users can update all applications" ON applications
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users_profile 
            WHERE user_id = auth.uid() 
            AND 'ADMIN' = ANY(role_flags)
        )
    );
    `
  })

  if (error) {
    console.error('Error:', error)
  } else {
    console.log('Successfully added admin applications policies!')
  }
}

addAdminApplicationsPolicy()
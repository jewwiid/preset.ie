#!/usr/bin/env node

/**
 * Check Existing Schema
 * This script checks what columns actually exist in the database
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  console.error('Make sure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkExistingSchema() {
  try {
    console.log('🔍 Checking existing database schema...\n');
    
    // Check if users_profile table exists and what columns it has
    const { data: profileColumns, error: profileError } = await supabase
      .from('users_profile')
      .select('*')
      .limit(1);
    
    if (profileError) {
      console.log('❌ users_profile table error:', profileError.message);
    } else {
      console.log('✅ users_profile table exists');
      if (profileColumns && profileColumns.length > 0) {
        console.log('📋 Existing columns:', Object.keys(profileColumns[0]));
      } else {
        console.log('📋 Table is empty, checking structure...');
        // Try to get column info by attempting to insert a test record
        const { error: insertError } = await supabase
          .from('users_profile')
          .insert({
            user_id: '00000000-0000-0000-0000-000000000000',
            display_name: 'test',
            handle: 'test123'
          });
        
        if (insertError) {
          console.log('📋 Column structure from error:', insertError.message);
        }
      }
    }
    
    // Check if users table exists
    const { data: usersColumns, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (usersError) {
      console.log('❌ users table error:', usersError.message);
    } else {
      console.log('✅ users table exists');
      if (usersColumns && usersColumns.length > 0) {
        console.log('📋 Existing columns:', Object.keys(usersColumns[0]));
      }
    }
    
    // Check if gigs table exists
    const { data: gigsColumns, error: gigsError } = await supabase
      .from('gigs')
      .select('*')
      .limit(1);
    
    if (gigsError) {
      console.log('❌ gigs table error:', gigsError.message);
    } else {
      console.log('✅ gigs table exists');
      if (gigsColumns && gigsColumns.length > 0) {
        console.log('📋 Existing columns:', Object.keys(gigsColumns[0]));
      }
    }
    
  } catch (error) {
    console.error('❌ Schema check failed:', error);
  }
}

// Run the check
checkExistingSchema();

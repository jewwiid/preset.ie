#!/usr/bin/env node

/**
 * Check User Settings Table
 * This script checks what columns are missing from the user_settings table
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

// Expected columns for user_settings table
const expectedColumns = [
  'id',
  'user_id',
  'profile_id',
  'email_notifications',
  'push_notifications',
  'message_notifications',
  'allow_stranger_messages',
  'privacy_level',
  'created_at',
  'updated_at'
];

async function checkUserSettings() {
  try {
    console.log('🔍 Checking user_settings table...\n');
    
    // First check if the table exists
    const { data: tableTest, error: tableError } = await supabase
      .from('user_settings')
      .select('*')
      .limit(1);
    
    if (tableError) {
      if (tableError.message.includes('does not exist')) {
        console.log('❌ user_settings table does not exist');
        console.log('🔧 Need to create the entire table');
        return;
      } else {
        console.log('⚠️  user_settings table error:', tableError.message);
      }
    } else {
      console.log('✅ user_settings table exists');
    }
    
    const missingColumns = [];
    
    for (const column of expectedColumns) {
      try {
        const { data, error } = await supabase
          .from('user_settings')
          .select(column)
          .limit(1);
        
        if (error) {
          if (error.message.includes('does not exist')) {
            missingColumns.push(column);
            console.log(`❌ Missing: user_settings.${column}`);
          } else {
            console.log(`⚠️  user_settings.${column}: ${error.message}`);
          }
        } else {
          console.log(`✅ user_settings.${column} exists`);
        }
      } catch (err) {
        console.log(`❌ Error checking user_settings.${column}:`, err.message);
        missingColumns.push(column);
      }
    }
    
    console.log('\n📋 Summary:');
    if (missingColumns.length === 0) {
      console.log('✅ All user_settings columns exist!');
    } else {
      console.log(`❌ Found ${missingColumns.length} missing columns:`);
      missingColumns.forEach(column => {
        console.log(`   - user_settings.${column}`);
      });
      
      console.log('\n🔧 To fix missing columns, run:');
      console.log('   fix-user-settings-table.sql');
    }
    
  } catch (error) {
    console.error('❌ Check failed:', error);
  }
}

// Run the check
checkUserSettings();

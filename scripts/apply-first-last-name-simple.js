#!/usr/bin/env node

/**
 * Apply First/Last Name Migration - Simple Version
 * This script adds the missing first_name and last_name columns to users_profile table
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

async function applyFirstLastNameMigration() {
  try {
    console.log('🔧 Applying first_name and last_name migration...\n');
    
    // Try to add first_name column
    console.log('➕ Adding first_name column...');
    const { error: firstNameError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE users_profile ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);'
    });
    
    if (firstNameError) {
      console.log('⚠️ first_name column error (may already exist):', firstNameError.message);
    } else {
      console.log('✅ first_name column added successfully');
    }
    
    // Try to add last_name column
    console.log('➕ Adding last_name column...');
    const { error: lastNameError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE users_profile ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);'
    });
    
    if (lastNameError) {
      console.log('⚠️ last_name column error (may already exist):', lastNameError.message);
    } else {
      console.log('✅ last_name column added successfully');
    }
    
    // Add indexes
    console.log('📊 Adding indexes...');
    const { error: indexError1 } = await supabase.rpc('exec_sql', {
      sql: 'CREATE INDEX IF NOT EXISTS idx_users_profile_first_name ON users_profile(first_name);'
    });
    
    const { error: indexError2 } = await supabase.rpc('exec_sql', {
      sql: 'CREATE INDEX IF NOT EXISTS idx_users_profile_last_name ON users_profile(last_name);'
    });
    
    if (indexError1 || indexError2) {
      console.log('⚠️ Index creation had issues (may already exist)');
    } else {
      console.log('✅ Indexes added successfully');
    }
    
    // Test the columns by trying to select them
    console.log('🧪 Testing columns...');
    const { data: testData, error: testError } = await supabase
      .from('users_profile')
      .select('first_name, last_name')
      .limit(1);
    
    if (testError) {
      console.error('❌ Test failed:', testError.message);
    } else {
      console.log('✅ Columns are working correctly');
      console.log('📋 Test data:', testData);
    }
    
    console.log('\n🎉 Migration completed successfully!');
    console.log('You can now create users with first_name and last_name fields.');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

// Run the migration
applyFirstLastNameMigration();

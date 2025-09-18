#!/usr/bin/env node

/**
 * Test Missing Columns Migration
 * This script tests if the missing columns can be added safely
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

async function testMissingColumns() {
  try {
    console.log('🧪 Testing missing columns migration...\n');
    
    // Test 1: Try to select style_tags from users_profile
    console.log('1️⃣ Testing style_tags column...');
    const { data: styleTest, error: styleError } = await supabase
      .from('users_profile')
      .select('style_tags')
      .limit(1);
    
    if (styleError) {
      console.log('❌ style_tags column missing:', styleError.message);
    } else {
      console.log('✅ style_tags column exists');
    }
    
    // Test 2: Try to select vibe_tags from users_profile
    console.log('2️⃣ Testing vibe_tags column...');
    const { data: vibeTest, error: vibeError } = await supabase
      .from('users_profile')
      .select('vibe_tags')
      .limit(1);
    
    if (vibeError) {
      console.log('❌ vibe_tags column missing:', vibeError.message);
    } else {
      console.log('✅ vibe_tags column exists');
    }
    
    // Test 3: Try to select first_name from users_profile
    console.log('3️⃣ Testing first_name column...');
    const { data: firstNameTest, error: firstNameError } = await supabase
      .from('users_profile')
      .select('first_name')
      .limit(1);
    
    if (firstNameError) {
      console.log('❌ first_name column missing:', firstNameError.message);
    } else {
      console.log('✅ first_name column exists');
    }
    
    // Test 4: Try to select purpose from gigs
    console.log('4️⃣ Testing purpose column in gigs...');
    const { data: purposeTest, error: purposeError } = await supabase
      .from('gigs')
      .select('purpose')
      .limit(1);
    
    if (purposeError) {
      console.log('❌ purpose column missing:', purposeError.message);
    } else {
      console.log('✅ purpose column exists');
    }
    
    console.log('\n📋 Summary:');
    console.log('- If you see ❌ errors above, those columns need to be added');
    console.log('- Run the add-missing-columns.sql migration to fix them');
    console.log('- After running the migration, try the fixed schema again');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testMissingColumns();

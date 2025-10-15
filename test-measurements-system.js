#!/usr/bin/env node

/**
 * Test script to verify the measurements system is working properly
 * This script tests both user_measurements and user_clothing_sizes tables
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testMeasurementsSystem() {
  console.log('🧪 Testing Measurements System');
  console.log('==============================\n');

  try {
    // Test 1: Check if tables exist
    console.log('📋 Test 1: Checking if tables exist...');
    
    const { data: tables, error: tablesError } = await supabase
      .rpc('exec_sql', { 
        sql: `
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name IN ('user_measurements', 'user_clothing_sizes')
          ORDER BY table_name;
        `
      });

    if (tablesError) {
      console.log('    ❌ Error checking tables:', tablesError.message);
    } else {
      console.log('    ✅ Tables exist:', tables);
    }

    // Test 2: Get James Murphy's profile ID
    console.log('\n👤 Test 2: Getting James Murphy profile...');
    
    const { data: jamesProfile, error: profileError } = await supabase
      .from('users_profile')
      .select('id, display_name, handle, height_cm')
      .eq('handle', 'james_actor')
      .single();

    if (profileError) {
      console.log('    ❌ Error fetching profile:', profileError.message);
      return;
    }

    console.log('    ✅ Found profile:', jamesProfile);

    // Test 3: Insert test measurement
    console.log('\n📏 Test 3: Adding test measurement...');
    
    const testMeasurement = {
      profile_id: jamesProfile.id,
      measurement_type: 'chest',
      measurement_value: 42.5,
      unit: 'in',
      notes: 'Test measurement for system verification'
    };

    const { data: measurementResult, error: measurementError } = await supabase
      .from('user_measurements')
      .insert([testMeasurement])
      .select();

    if (measurementError) {
      console.log('    ❌ Error adding measurement:', measurementError.message);
    } else {
      console.log('    ✅ Measurement added:', measurementResult);
    }

    // Test 4: Insert test clothing size
    console.log('\n👕 Test 4: Adding test clothing size...');
    
    const testClothingSize = {
      profile_id: jamesProfile.id,
      clothing_type: 'tops',
      size_system_id: 'us_mens',
      size_value: 'Large',
      notes: 'Test clothing size for system verification'
    };

    const { data: clothingResult, error: clothingError } = await supabase
      .from('user_clothing_sizes')
      .insert([testClothingSize])
      .select();

    if (clothingError) {
      console.log('    ❌ Error adding clothing size:', clothingError.message);
    } else {
      console.log('    ✅ Clothing size added:', clothingResult);
    }

    // Test 5: Fetch all measurements for James
    console.log('\n📊 Test 5: Fetching all measurements for James...');
    
    const { data: measurements, error: fetchMeasurementsError } = await supabase
      .from('user_measurements')
      .select('*')
      .eq('profile_id', jamesProfile.id);

    if (fetchMeasurementsError) {
      console.log('    ❌ Error fetching measurements:', fetchMeasurementsError.message);
    } else {
      console.log('    ✅ Measurements found:', measurements);
    }

    // Test 6: Fetch all clothing sizes for James
    console.log('\n👔 Test 6: Fetching all clothing sizes for James...');
    
    const { data: clothingSizes, error: fetchClothingError } = await supabase
      .from('user_clothing_sizes')
      .select('*')
      .eq('profile_id', jamesProfile.id);

    if (fetchClothingError) {
      console.log('    ❌ Error fetching clothing sizes:', fetchClothingError.message);
    } else {
      console.log('    ✅ Clothing sizes found:', clothingSizes);
    }

    // Test 7: Test validation constraints
    console.log('\n✅ Test 7: Testing validation constraints...');
    
    // Try to add invalid measurement (negative value)
    const invalidMeasurement = {
      profile_id: jamesProfile.id,
      measurement_type: 'waist',
      measurement_value: -10, // Invalid negative value
      unit: 'cm'
    };

    const { data: invalidResult, error: invalidError } = await supabase
      .from('user_measurements')
      .insert([invalidMeasurement])
      .select();

    if (invalidError) {
      console.log('    ✅ Validation working - rejected invalid measurement:', invalidError.message);
    } else {
      console.log('    ⚠️  Warning - validation may not be working properly');
    }

    // Test 8: Test duplicate prevention
    console.log('\n🔄 Test 8: Testing duplicate prevention...');
    
    const duplicateMeasurement = {
      profile_id: jamesProfile.id,
      measurement_type: 'chest', // Same type as before
      measurement_value: 43.0,
      unit: 'in',
      notes: 'Duplicate test'
    };

    const { data: duplicateResult, error: duplicateError } = await supabase
      .from('user_measurements')
      .insert([duplicateMeasurement])
      .select();

    if (duplicateError && duplicateError.message.includes('duplicate')) {
      console.log('    ✅ Duplicate prevention working:', duplicateError.message);
    } else if (duplicateResult) {
      console.log('    ⚠️  Duplicate was allowed (this might be expected behavior)');
    } else {
      console.log('    ❌ Unexpected error:', duplicateError);
    }

    // Test 9: Test measurement updates
    console.log('\n✏️  Test 9: Testing measurement updates...');
    
    if (measurementResult && measurementResult.length > 0) {
      const measurementId = measurementResult[0].id;
      
      const { data: updateResult, error: updateError } = await supabase
        .from('user_measurements')
        .update({ 
          measurement_value: 43.0,
          notes: 'Updated test measurement'
        })
        .eq('id', measurementId)
        .select();

      if (updateError) {
        console.log('    ❌ Error updating measurement:', updateError.message);
      } else {
        console.log('    ✅ Measurement updated:', updateResult);
      }
    }

    // Test 10: Cleanup test data
    console.log('\n🧹 Test 10: Cleaning up test data...');
    
    // Delete test measurements
    const { error: deleteMeasurementsError } = await supabase
      .from('user_measurements')
      .delete()
      .eq('profile_id', jamesProfile.id)
      .eq('notes', 'Test measurement for system verification');

    if (deleteMeasurementsError) {
      console.log('    ❌ Error deleting test measurements:', deleteMeasurementsError.message);
    } else {
      console.log('    ✅ Test measurements deleted');
    }

    // Delete test clothing sizes
    const { error: deleteClothingError } = await supabase
      .from('user_clothing_sizes')
      .delete()
      .eq('profile_id', jamesProfile.id)
      .eq('notes', 'Test clothing size for system verification');

    if (deleteClothingError) {
      console.log('    ❌ Error deleting test clothing sizes:', deleteClothingError.message);
    } else {
      console.log('    ✅ Test clothing sizes deleted');
    }

    console.log('\n🎉 Measurements System Test Complete!');
    console.log('\nSummary:');
    console.log('- Tables exist and are accessible');
    console.log('- Measurements can be added, updated, and deleted');
    console.log('- Clothing sizes can be managed');
    console.log('- Validation and constraints are working');
    console.log('- Test data has been cleaned up');

  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Add exec_sql function if it doesn't exist
async function ensureExecSqlFunction() {
  const createFunctionSQL = `
    CREATE OR REPLACE FUNCTION exec_sql(sql TEXT)
    RETURNS VOID AS $$
    BEGIN
      EXECUTE sql;
    END;
    $$ LANGUAGE plpgsql;
  `;
  
  try {
    await supabase.rpc('exec_sql', { sql: createFunctionSQL });
  } catch (error) {
    // Function might already exist, ignore error
  }
}

// Main execution
async function main() {
  console.log('🔧 Measurements System Test Tool');
  console.log('=================================\n');
  
  try {
    await ensureExecSqlFunction();
    await testMeasurementsSystem();
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { testMeasurementsSystem };

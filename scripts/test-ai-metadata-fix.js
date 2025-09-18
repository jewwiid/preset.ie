#!/usr/bin/env node

/**
 * Test AI Metadata Fix
 * This script tests if the ai_metadata column fix works
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

async function testAiMetadataFix() {
  try {
    console.log('🧪 Testing ai_metadata column fix...\n');
    
    // Test 1: Try to select ai_metadata from media table
    console.log('1️⃣ Testing ai_metadata column...');
    const { data: aiMetadataTest, error: aiMetadataError } = await supabase
      .from('media')
      .select('ai_metadata')
      .limit(1);
    
    if (aiMetadataError) {
      console.log('❌ ai_metadata column still missing:', aiMetadataError.message);
      console.log('🔧 Run fix-ai-metadata-column.sql to fix this');
    } else {
      console.log('✅ ai_metadata column exists');
    }
    
    // Test 2: Try to insert a record with ai_metadata
    console.log('2️⃣ Testing ai_metadata insertion...');
    const testData = {
      owner_user_id: '00000000-0000-0000-0000-000000000000',
      type: 'IMAGE',
      bucket: 'test-bucket',
      path: 'test/path.jpg',
      ai_metadata: {
        cameraAngle: 'low-angle',
        lensType: 'wide',
        lightingStyle: 'natural',
        directorStyle: 'cinematic',
        colorPalette: 'warm',
        aspectRatio: '16:9'
      }
    };
    
    const { data: insertTest, error: insertError } = await supabase
      .from('media')
      .insert(testData)
      .select();
    
    if (insertError) {
      if (insertError.message.includes('foreign key constraint')) {
        console.log('✅ ai_metadata insertion works (foreign key error is expected)');
      } else {
        console.log('❌ ai_metadata insertion failed:', insertError.message);
      }
    } else {
      console.log('✅ ai_metadata insertion works');
      // Clean up test data
      await supabase.from('media').delete().eq('id', insertTest[0].id);
    }
    
    // Test 3: Test cinematic_tags generated column
    console.log('3️⃣ Testing cinematic_tags generated column...');
    const { data: cinematicTest, error: cinematicError } = await supabase
      .from('media')
      .select('cinematic_tags')
      .limit(1);
    
    if (cinematicError) {
      console.log('⚠️  cinematic_tags column issue:', cinematicError.message);
    } else {
      console.log('✅ cinematic_tags column exists');
    }
    
    console.log('\n🎉 AI metadata fix test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testAiMetadataFix();

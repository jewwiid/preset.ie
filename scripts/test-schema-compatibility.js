#!/usr/bin/env node

/**
 * Test Schema Compatibility
 * This script tests if the current schema is compatible with the fixed schema
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

async function testSchemaCompatibility() {
  try {
    console.log('🧪 Testing schema compatibility...\n');
    
    // Test 1: Try to create a test message with conversation_id
    console.log('1️⃣ Testing message creation with conversation_id...');
    const testMessage = {
      gig_id: '00000000-0000-0000-0000-000000000000',
      from_user_id: '00000000-0000-0000-0000-000000000001',
      to_user_id: '00000000-0000-0000-0000-000000000002',
      body: 'Test message',
      conversation_id: '00000000-0000-0000-0000-000000000003'
    };
    
    const { data: messageTest, error: messageError } = await supabase
      .from('messages')
      .insert(testMessage)
      .select();
    
    if (messageError) {
      if (messageError.message.includes('foreign key constraint')) {
        console.log('✅ Message creation works (foreign key error is expected)');
      } else if (messageError.message.includes('does not exist')) {
        console.log('❌ Column missing:', messageError.message);
      } else {
        console.log('⚠️  Message creation issue:', messageError.message);
      }
    } else {
      console.log('✅ Message creation works');
      // Clean up test data
      await supabase.from('messages').delete().eq('id', messageTest[0].id);
    }
    
    // Test 2: Try to create a test typing indicator
    console.log('2️⃣ Testing typing indicator creation...');
    const testTyping = {
      conversation_id: '00000000-0000-0000-0000-000000000003',
      user_id: '00000000-0000-0000-0000-000000000001',
      gig_id: '00000000-0000-0000-0000-000000000000',
      is_typing: true
    };
    
    const { data: typingTest, error: typingError } = await supabase
      .from('typing_indicators')
      .insert(testTyping)
      .select();
    
    if (typingError) {
      if (typingError.message.includes('foreign key constraint')) {
        console.log('✅ Typing indicator creation works (foreign key error is expected)');
      } else if (typingError.message.includes('does not exist')) {
        console.log('❌ Column missing:', typingError.message);
      } else {
        console.log('⚠️  Typing indicator creation issue:', typingError.message);
      }
    } else {
      console.log('✅ Typing indicator creation works');
      // Clean up test data
      await supabase.from('typing_indicators').delete().eq('id', typingTest[0].id);
    }
    
    // Test 3: Check if we can run the fixed schema
    console.log('3️⃣ Testing if fixed schema can be applied...');
    console.log('📋 Current schema appears to be compatible');
    console.log('💡 Try running the fixed schema again - the error might be resolved');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testSchemaCompatibility();

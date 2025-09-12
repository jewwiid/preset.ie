#!/usr/bin/env node

/**
 * Test if typing_indicators table exists and is accessible
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testTable() {
  try {
    console.log('🔍 Testing typing_indicators table access...');
    
    // Try to select from the table
    const { data, error } = await supabase
      .from('typing_indicators')
      .select('id, conversation_id, user_id')
      .limit(1);

    if (error) {
      if (error.code === '42P01') {
        console.log('❌ Table does not exist in database');
        console.log('Error:', error.message);
        return false;
      } else {
        console.log('⚠️  Table exists but has access issues:', error.message);
        console.log('Error code:', error.code);
        return true; // Table exists but has other issues
      }
    } else {
      console.log('✅ Table exists and is accessible!');
      console.log('Current records:', data?.length || 0);
      return true;
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    return false;
  }
}

async function testMessageTable() {
  try {
    console.log('🔍 Testing messages table for conversation_id column...');
    
    const { data, error } = await supabase
      .from('messages')
      .select('id, conversation_id, from_user_id, to_user_id')
      .limit(1);

    if (error) {
      console.log('❌ Messages table issue:', error.message);
      return false;
    } else {
      console.log('✅ Messages table accessible');
      const hasConversationId = data && data.length > 0 && data[0].conversation_id !== undefined;
      console.log('Has conversation_id column:', hasConversationId);
      return true;
    }
  } catch (error) {
    console.error('❌ Messages table error:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🧪 Running typing_indicators table tests...\n');
  
  const typingTableExists = await testTable();
  const messageTableOk = await testMessageTable();
  
  console.log('\n📊 Test Results:');
  console.log('typing_indicators table:', typingTableExists ? '✅ OK' : '❌ MISSING');
  console.log('messages table:', messageTableOk ? '✅ OK' : '❌ ISSUES');
  
  if (!typingTableExists) {
    console.log('\n🔧 Resolution:');
    console.log('1. Go to your Supabase Dashboard > SQL Editor');
    console.log('2. Run the SQL from typing-indicators-fix.sql');
    console.log('3. Or run migration 051_realtime_messaging_enhancements.sql');
  }
  
  return typingTableExists && messageTableOk;
}

if (require.main === module) {
  runTests()
    .then(allOk => {
      if (allOk) {
        console.log('\n🎉 All tests passed!');
        process.exit(0);
      } else {
        console.log('\n💥 Some tests failed - see resolution steps above');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = { runTests };
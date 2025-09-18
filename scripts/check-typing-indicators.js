#!/usr/bin/env node

/**
 * Check Typing Indicators Table
 * This script checks if the typing_indicators table exists
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

async function checkTypingIndicators() {
  try {
    console.log('🔍 Checking typing_indicators table...\n');
    
    // Try to select from typing_indicators table
    const { data, error } = await supabase
      .from('typing_indicators')
      .select('*')
      .limit(1);
    
    if (error) {
      if (error.message.includes('does not exist')) {
        console.log('❌ typing_indicators table does not exist');
        console.log('🔧 Run fix-messages-conversation-id.sql to create it');
      } else {
        console.log('⚠️  typing_indicators table error:', error.message);
      }
    } else {
      console.log('✅ typing_indicators table exists');
      console.log('📋 Columns:', Object.keys(data[0] || {}));
    }
    
    // Check if generate_conversation_id function exists
    console.log('\n🔍 Checking generate_conversation_id function...');
    try {
      const { data: funcTest, error: funcError } = await supabase.rpc('generate_conversation_id', {
        gig_uuid: '00000000-0000-0000-0000-000000000000',
        user1_uuid: '00000000-0000-0000-0000-000000000001',
        user2_uuid: '00000000-0000-0000-0000-000000000002'
      });
      
      if (funcError) {
        console.log('❌ generate_conversation_id function error:', funcError.message);
      } else {
        console.log('✅ generate_conversation_id function exists');
      }
    } catch (err) {
      console.log('❌ generate_conversation_id function missing:', err.message);
    }
    
  } catch (error) {
    console.error('❌ Check failed:', error);
  }
}

// Run the check
checkTypingIndicators();

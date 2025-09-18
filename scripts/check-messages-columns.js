#!/usr/bin/env node

/**
 * Check Messages Columns
 * This script checks what columns are missing from the messages table
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

// Expected columns for messages table
const expectedColumns = [
  'id',
  'gig_id',
  'from_user_id',
  'to_user_id',
  'body',
  'attachments',
  'conversation_id',
  'status',
  'created_at',
  'read_at',
  'updated_at'
];

async function checkMessagesColumns() {
  try {
    console.log('🔍 Checking messages table columns...\n');
    
    const missingColumns = [];
    
    for (const column of expectedColumns) {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select(column)
          .limit(1);
        
        if (error) {
          if (error.message.includes('does not exist')) {
            missingColumns.push(column);
            console.log(`❌ Missing: messages.${column}`);
          } else {
            console.log(`⚠️  messages.${column}: ${error.message}`);
          }
        } else {
          console.log(`✅ messages.${column} exists`);
        }
      } catch (err) {
        console.log(`❌ Error checking messages.${column}:`, err.message);
        missingColumns.push(column);
      }
    }
    
    console.log('\n📋 Summary:');
    if (missingColumns.length === 0) {
      console.log('✅ All messages columns exist!');
    } else {
      console.log(`❌ Found ${missingColumns.length} missing columns:`);
      missingColumns.forEach(column => {
        console.log(`   - messages.${column}`);
      });
      
      console.log('\n🔧 To fix missing columns, run:');
      console.log('   fix-messages-conversation-id.sql');
    }
    
  } catch (error) {
    console.error('❌ Check failed:', error);
  }
}

// Run the check
checkMessagesColumns();

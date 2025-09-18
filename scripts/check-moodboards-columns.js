#!/usr/bin/env node

/**
 * Check Moodboards Columns
 * This script checks what columns are missing from the moodboards table
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

// Expected columns for moodboards table
const expectedColumns = [
  'id',
  'gig_id',
  'owner_user_id',
  'title',
  'summary',
  'palette',
  'items',
  'vibe_ids',
  'vibe_summary',
  'mood_descriptors',
  'tags',
  'ai_analysis_status',
  'ai_analyzed_at',
  'is_public',
  'source_breakdown',
  'enhancement_log',
  'total_cost',
  'generated_prompts',
  'ai_provider',
  'created_at',
  'updated_at'
];

async function checkMoodboardsColumns() {
  try {
    console.log('🔍 Checking moodboards table columns...\n');
    
    const missingColumns = [];
    
    for (const column of expectedColumns) {
      try {
        const { data, error } = await supabase
          .from('moodboards')
          .select(column)
          .limit(1);
        
        if (error) {
          if (error.message.includes('does not exist')) {
            missingColumns.push(column);
            console.log(`❌ Missing: moodboards.${column}`);
          } else {
            console.log(`⚠️  moodboards.${column}: ${error.message}`);
          }
        } else {
          console.log(`✅ moodboards.${column} exists`);
        }
      } catch (err) {
        console.log(`❌ Error checking moodboards.${column}:`, err.message);
        missingColumns.push(column);
      }
    }
    
    console.log('\n📋 Summary:');
    if (missingColumns.length === 0) {
      console.log('✅ All moodboards columns exist!');
    } else {
      console.log(`❌ Found ${missingColumns.length} missing columns:`);
      missingColumns.forEach(column => {
        console.log(`   - moodboards.${column}`);
      });
      
      console.log('\n🔧 To fix missing columns, run:');
      console.log('   fix-moodboards-vibe-ids.sql');
    }
    
  } catch (error) {
    console.error('❌ Check failed:', error);
  }
}

// Run the check
checkMoodboardsColumns();

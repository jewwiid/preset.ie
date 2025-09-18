#!/usr/bin/env node

/**
 * Check All Missing Columns
 * This script checks for common missing columns that might cause errors
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

// Common columns that might be missing
const columnsToCheck = [
  { table: 'media', column: 'ai_metadata' },
  { table: 'media', column: 'exif_json' },
  { table: 'media', column: 'blurhash' },
  { table: 'media', column: 'palette' },
  { table: 'media', column: 'duration' },
  { table: 'media', column: 'width' },
  { table: 'media', column: 'height' },
  { table: 'users_profile', column: 'style_tags' },
  { table: 'users_profile', column: 'vibe_tags' },
  { table: 'users_profile', column: 'first_name' },
  { table: 'users_profile', column: 'last_name' },
  { table: 'users_profile', column: 'header_banner_url' },
  { table: 'users_profile', column: 'header_banner_position' },
  { table: 'gigs', column: 'style_tags' },
  { table: 'gigs', column: 'vibe_tags' },
  { table: 'gigs', column: 'purpose' },
  { table: 'gigs', column: 'comp_type' },
  { table: 'gigs', column: 'comp_details' },
  { table: 'gigs', column: 'usage_rights' },
  { table: 'gigs', column: 'safety_notes' },
  { table: 'gigs', column: 'max_applicants' },
  { table: 'gigs', column: 'application_deadline' },
  { table: 'gigs', column: 'start_time' },
  { table: 'gigs', column: 'end_time' },
  { table: 'gigs', column: 'city' },
  { table: 'gigs', column: 'country' },
  { table: 'gigs', column: 'radius_meters' },
  { table: 'gigs', column: 'boost_level' }
];

async function checkAllMissingColumns() {
  try {
    console.log('🔍 Checking for missing columns...\n');
    
    const missingColumns = [];
    
    for (const { table, column } of columnsToCheck) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select(column)
          .limit(1);
        
        if (error) {
          if (error.message.includes('does not exist')) {
            missingColumns.push({ table, column, error: error.message });
            console.log(`❌ Missing: ${table}.${column}`);
          } else {
            console.log(`⚠️  ${table}.${column}: ${error.message}`);
          }
        } else {
          console.log(`✅ ${table}.${column} exists`);
        }
      } catch (err) {
        console.log(`❌ Error checking ${table}.${column}:`, err.message);
        missingColumns.push({ table, column, error: err.message });
      }
    }
    
    console.log('\n📋 Summary:');
    if (missingColumns.length === 0) {
      console.log('✅ All columns exist!');
    } else {
      console.log(`❌ Found ${missingColumns.length} missing columns:`);
      missingColumns.forEach(({ table, column }) => {
        console.log(`   - ${table}.${column}`);
      });
      
      console.log('\n🔧 To fix missing columns, run the appropriate migration:');
      console.log('   - For ai_metadata: fix-ai-metadata-column.sql');
      console.log('   - For other columns: add-missing-columns.sql');
    }
    
  } catch (error) {
    console.error('❌ Check failed:', error);
  }
}

// Run the check
checkAllMissingColumns();

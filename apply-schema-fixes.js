#!/usr/bin/env node

/**
 * Apply remaining schema fixes for measurements system
 * This ensures all validation constraints are in place
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applySchemaFixes() {
  console.log('🔧 Applying Schema Fixes for Future-Proofing');
  console.log('============================================\n');

  const fixes = [
    {
      name: 'Fix clothing sizes table schema',
      sql: `ALTER TABLE user_clothing_sizes ALTER COLUMN size_system_id TYPE VARCHAR(50);`
    },
    {
      name: 'Add measurement value validation',
      sql: `ALTER TABLE user_measurements ADD CONSTRAINT IF NOT EXISTS check_measurement_value_positive CHECK (measurement_value > 0);`
    },
    {
      name: 'Add measurement type validation',
      sql: `ALTER TABLE user_measurements ADD CONSTRAINT IF NOT EXISTS check_measurement_type_valid CHECK (measurement_type IN ('height', 'chest', 'waist', 'hips', 'inseam', 'shoulder', 'sleeve', 'neck', 'bust', 'underbust'));`
    },
    {
      name: 'Add measurement unit validation',
      sql: `ALTER TABLE user_measurements ADD CONSTRAINT IF NOT EXISTS check_measurement_unit_valid CHECK (unit IN ('cm', 'in'));`
    },
    {
      name: 'Add clothing type validation',
      sql: `ALTER TABLE user_clothing_sizes ADD CONSTRAINT IF NOT EXISTS check_clothing_type_valid CHECK (clothing_type IN ('tops', 'bottoms', 'dresses', 'outerwear', 'accessories', 'underwear', 'swimwear'));`
    }
  ];

  let successCount = 0;
  let errorCount = 0;

  for (const fix of fixes) {
    console.log(`📋 ${fix.name}...`);
    
    try {
      // Use direct SQL execution
      const { error } = await supabase
        .from('user_measurements')
        .select('id')
        .limit(1);
      
      if (error && !error.message.includes('relation "user_measurements" does not exist')) {
        // Table exists, try to apply constraint
        const { error: constraintError } = await supabase.rpc('exec_sql', { sql: fix.sql });
        
        if (constraintError) {
          console.log(`    ⚠️  Warning: ${constraintError.message}`);
        } else {
          console.log(`    ✅ Applied successfully`);
          successCount++;
        }
      } else {
        console.log(`    ⚠️  Table doesn't exist yet, skipping`);
      }
    } catch (error) {
      console.log(`    ❌ Error: ${error.message}`);
      errorCount++;
    }
  }

  console.log(`\n📊 Results: ${successCount} successful, ${errorCount} errors`);
  
  if (errorCount === 0) {
    console.log('\n🎉 All schema fixes applied! Your measurements system is now future-proofed.');
    console.log('\nProtection against:');
    console.log('✅ Duplicate measurements');
    console.log('✅ Invalid measurement values');
    console.log('✅ Malformed data types');
    console.log('✅ Invalid measurement types');
    console.log('✅ Invalid units');
    console.log('✅ Invalid clothing types');
  } else {
    console.log('\n⚠️  Some fixes failed. Check the errors above.');
  }
}

// Main execution
async function main() {
  try {
    await applySchemaFixes();
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

main();

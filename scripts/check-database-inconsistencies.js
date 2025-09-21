#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function checkDatabaseInconsistencies() {
  console.log('🔍 Checking Remote Database for Inconsistencies...\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing required environment variables:');
    console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '❌');
    console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '❌');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    console.log('✅ Connected to Supabase database\n');

    // 1. Check if playground_projects table exists
    console.log('1️⃣ Checking playground_projects table...');
    const { data: playgroundTable, error: playgroundError } = await supabase
      .rpc('exec_sql', { 
        sql: `
          SELECT 
            column_name, 
            data_type, 
            is_nullable, 
            column_default
          FROM information_schema.columns 
          WHERE table_name = 'playground_projects' 
          ORDER BY ordinal_position;
        `
      });

    if (playgroundError) {
      console.error('❌ Error checking playground_projects:', playgroundError.message);
    } else if (!playgroundTable || playgroundTable.length === 0) {
      console.error('❌ playground_projects table does not exist!');
    } else {
      console.log('✅ playground_projects table exists with columns:');
      playgroundTable.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
      });
    }
    console.log('');

    // 2. Check required columns for API
    console.log('2️⃣ Checking required columns for playground API...');
    const requiredColumns = [
      'id', 'user_id', 'title', 'prompt', 'style', 'generated_images', 
      'credits_used', 'created_at', 'updated_at', 'last_generated_at',
      'aspect_ratio', 'resolution', 'status', 'metadata'
    ];

    if (playgroundTable && playgroundTable.length > 0) {
      const existingColumns = playgroundTable.map(col => col.column_name);
      const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
      
      if (missingColumns.length > 0) {
        console.error('❌ Missing required columns:', missingColumns.join(', '));
      } else {
        console.log('✅ All required columns exist');
      }
    }
    console.log('');

    // 3. Check user_credits table
    console.log('3️⃣ Checking user_credits table...');
    const { data: userCreditsTable, error: creditsError } = await supabase
      .rpc('exec_sql', { 
        sql: `
          SELECT column_name, data_type, is_nullable 
          FROM information_schema.columns 
          WHERE table_name = 'user_credits' 
          ORDER BY ordinal_position;
        `
      });

    if (creditsError) {
      console.error('❌ Error checking user_credits:', creditsError.message);
    } else if (!userCreditsTable || userCreditsTable.length === 0) {
      console.error('❌ user_credits table does not exist!');
    } else {
      console.log('✅ user_credits table exists');
    }
    console.log('');

    // 4. Check RLS policies
    console.log('4️⃣ Checking RLS policies...');
    const { data: rlsPolicies, error: rlsError } = await supabase
      .rpc('exec_sql', { 
        sql: `
          SELECT 
            schemaname,
            tablename,
            policyname,
            permissive,
            roles,
            cmd,
            qual
          FROM pg_policies 
          WHERE tablename IN ('playground_projects', 'user_credits', 'playground_gallery')
          ORDER BY tablename, policyname;
        `
      });

    if (rlsError) {
      console.error('❌ Error checking RLS policies:', rlsError.message);
    } else {
      console.log(`✅ Found ${rlsPolicies?.length || 0} RLS policies`);
      if (rlsPolicies && rlsPolicies.length > 0) {
        rlsPolicies.forEach(policy => {
          console.log(`   - ${policy.tablename}.${policy.policyname} (${policy.cmd})`);
        });
      }
    }
    console.log('');

    // 5. Check indexes
    console.log('5️⃣ Checking indexes...');
    const { data: indexes, error: indexError } = await supabase
      .rpc('exec_sql', { 
        sql: `
          SELECT 
            schemaname,
            tablename,
            indexname,
            indexdef
          FROM pg_indexes 
          WHERE tablename IN ('playground_projects', 'user_credits', 'playground_gallery')
          AND schemaname = 'public'
          ORDER BY tablename, indexname;
        `
      });

    if (indexError) {
      console.error('❌ Error checking indexes:', indexError.message);
    } else {
      console.log(`✅ Found ${indexes?.length || 0} indexes`);
      if (indexes && indexes.length > 0) {
        indexes.forEach(idx => {
          console.log(`   - ${idx.tablename}.${idx.indexname}`);
        });
      }
    }
    console.log('');

    // 6. Check table constraints
    console.log('6️⃣ Checking table constraints...');
    const { data: constraints, error: constraintError } = await supabase
      .rpc('exec_sql', { 
        sql: `
          SELECT 
            table_name,
            constraint_name,
            constraint_type
          FROM information_schema.table_constraints 
          WHERE table_name IN ('playground_projects', 'user_credits', 'playground_gallery')
          AND table_schema = 'public'
          ORDER BY table_name, constraint_type;
        `
      });

    if (constraintError) {
      console.error('❌ Error checking constraints:', constraintError.message);
    } else {
      console.log(`✅ Found ${constraints?.length || 0} constraints`);
      if (constraints && constraints.length > 0) {
        constraints.forEach(constraint => {
          console.log(`   - ${constraint.table_name}.${constraint.constraint_name} (${constraint.constraint_type})`);
        });
      }
    }
    console.log('');

    // 7. Test basic operations
    console.log('7️⃣ Testing basic database operations...');
    
    // Test user_credits query
    try {
      const { data: testUserCredits, error: testCreditsError } = await supabase
        .from('user_credits')
        .select('*')
        .limit(1);
      
      if (testCreditsError) {
        console.error('❌ Error querying user_credits:', testCreditsError.message);
      } else {
        console.log('✅ user_credits table is queryable');
      }
    } catch (error) {
      console.error('❌ Exception querying user_credits:', error.message);
    }

    // Test playground_projects query
    try {
      const { data: testPlayground, error: testPlaygroundError } = await supabase
        .from('playground_projects')
        .select('*')
        .limit(1);
      
      if (testPlaygroundError) {
        console.error('❌ Error querying playground_projects:', testPlaygroundError.message);
      } else {
        console.log('✅ playground_projects table is queryable');
      }
    } catch (error) {
      console.error('❌ Exception querying playground_projects:', error.message);
    }
    console.log('');

    // 8. Check migration status
    console.log('8️⃣ Checking migration status...');
    const { data: migrations, error: migrationError } = await supabase
      .rpc('exec_sql', { 
        sql: `
          SELECT version, name 
          FROM supabase_migrations.schema_migrations 
          ORDER BY version DESC 
          LIMIT 10;
        `
      });

    if (migrationError) {
      console.error('❌ Error checking migrations:', migrationError.message);
    } else {
      console.log(`✅ Found ${migrations?.length || 0} recent migrations`);
      if (migrations && migrations.length > 0) {
        migrations.forEach(migration => {
          console.log(`   - ${migration.version}: ${migration.name || 'unnamed'}`);
        });
      }
    }
    console.log('');

    // 9. Summary
    console.log('📊 SUMMARY');
    console.log('================');
    
    let issues = [];
    
    if (!playgroundTable || playgroundTable.length === 0) {
      issues.push('playground_projects table missing');
    }
    
    if (!userCreditsTable || userCreditsTable.length === 0) {
      issues.push('user_credits table missing');
    }

    if (playgroundTable && playgroundTable.length > 0) {
      const existingColumns = playgroundTable.map(col => col.column_name);
      const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
      if (missingColumns.length > 0) {
        issues.push(`playground_projects missing columns: ${missingColumns.join(', ')}`);
      }
    }

    if (issues.length === 0) {
      console.log('✅ No major inconsistencies found');
    } else {
      console.log('❌ Issues found:');
      issues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue}`);
      });
    }

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

// Run the check
checkDatabaseInconsistencies().catch(console.error);

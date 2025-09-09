#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration(migrationPath, migrationName) {
  try {
    console.log(`\n📋 Running migration: ${migrationName}`);
    
    // Read the SQL file
    const sql = await fs.readFile(migrationPath, 'utf8');
    
    // Split by semicolons but be careful with functions
    const statements = sql
      .split(/;\s*$/m)
      .filter(stmt => stmt.trim())
      .map(stmt => stmt.trim() + ';');
    
    // Execute each statement
    for (const statement of statements) {
      if (statement.trim()) {
        const { error } = await supabase.rpc('exec_sql', {
          sql_query: statement
        }).single();
        
        if (error) {
          // Try direct execution as fallback
          const { error: directError } = await supabase.from('_migrations').select('*').limit(1);
          if (directError && directError.message.includes('exec_sql')) {
            console.log('   ⚠️  exec_sql not available, using direct connection...');
            // For now, we'll log the SQL and handle it differently
            console.log('   📝 Statement to execute manually or via psql:', statement.substring(0, 100) + '...');
          } else {
            throw error;
          }
        }
      }
    }
    
    console.log(`   ✅ ${migrationName} completed`);
    return true;
  } catch (error) {
    console.error(`   ❌ Error in ${migrationName}:`, error.message);
    return false;
  }
}

async function testTableExists(tableName) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (error && error.message.includes('does not exist')) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

async function main() {
  console.log('🚀 Running Phase 1 & 2 Database Migrations\n');
  console.log('📍 Supabase URL:', supabaseUrl);
  
  // Check current table status
  console.log('\n📊 Checking existing tables...');
  const tables = ['domain_events', 'users', 'profiles'];
  for (const table of tables) {
    const exists = await testTableExists(table);
    console.log(`   ${exists ? '✅' : '❌'} ${table}`);
  }
  
  // Migrations to run
  const migrations = [
    {
      file: '010_domain_events_table.sql',
      name: 'Domain Events Table (Phase 1)'
    },
    {
      file: '011_users_and_profiles_tables.sql',
      name: 'Users & Profiles Tables (Phase 2)'
    }
  ];
  
  console.log('\n🔄 Starting migrations...');
  
  let allSuccess = true;
  for (const migration of migrations) {
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', migration.file);
    
    // Check if file exists
    try {
      await fs.access(migrationPath);
    } catch {
      console.error(`❌ Migration file not found: ${migration.file}`);
      allSuccess = false;
      continue;
    }
    
    const success = await runMigration(migrationPath, migration.name);
    if (!success) {
      allSuccess = false;
    }
  }
  
  // Verify tables were created
  console.log('\n🔍 Verifying table creation...');
  for (const table of tables) {
    const exists = await testTableExists(table);
    console.log(`   ${exists ? '✅' : '❌'} ${table}`);
    if (!exists) {
      allSuccess = false;
    }
  }
  
  if (allSuccess) {
    console.log('\n✨ All migrations completed successfully!');
  } else {
    console.log('\n⚠️  Some migrations failed. Please check the logs above.');
    console.log('\n💡 Alternative: Run migrations directly using psql:');
    console.log('   psql $SUPABASE_DB_URL -f supabase/migrations/010_domain_events_table.sql');
    console.log('   psql $SUPABASE_DB_URL -f supabase/migrations/011_users_and_profiles_tables.sql');
  }
}

main().catch(console.error);
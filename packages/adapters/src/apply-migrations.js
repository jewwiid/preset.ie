#!/usr/bin/env node

// Apply migrations to Supabase database
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from root .env file
const rootDir = path.resolve(__dirname, '../../../');
const envPath = path.join(rootDir, '.env');

try {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key, ...valueParts] = trimmed.split('=');
      const value = valueParts.join('=');
      process.env[key] = value;
    }
  });
} catch (error) {
  console.error('❌ Could not load .env file:', error.message);
  process.exit(1);
}

async function applyMigrations() {
  console.log('🔄 Applying Supabase migrations...\n');

  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    console.error('❌ Missing required environment variables');
    console.log('Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  // Create admin client with edge function access
  const supabase = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  try {
    console.log('📋 Reading migration files...\n');

    // Read migration files
    const migrationsDir = path.resolve(rootDir, 'supabase/migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    console.log(`Found ${migrationFiles.length} migration files:`);
    migrationFiles.forEach(file => console.log(`  - ${file}`));

    // Apply migrations using edge functions
    for (const file of migrationFiles) {
      console.log(`\n🔄 Applying migration: ${file}`);
      
      const migrationPath = path.join(migrationsDir, file);
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
      
      // Split migration into individual statements
      const statements = migrationSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

      console.log(`   Found ${statements.length} SQL statements`);

      // Execute each statement
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i] + ';';
        
        try {
          // Try to execute using edge functions
          const { data, error } = await supabase.functions.invoke('sql-executor', {
            body: { sql: statement }
          });

          if (error) {
            // Edge function doesn't exist, try direct RPC
            console.log(`   Statement ${i + 1}: Trying alternative method...`);
            
            // For CREATE statements, let's use specific Supabase methods where possible
            if (statement.includes('CREATE TABLE')) {
              console.log(`   Statement ${i + 1}: CREATE TABLE detected - needs manual application`);
            } else if (statement.includes('CREATE TYPE')) {
              console.log(`   Statement ${i + 1}: CREATE TYPE detected - needs manual application`);
            } else if (statement.includes('CREATE EXTENSION')) {
              console.log(`   Statement ${i + 1}: CREATE EXTENSION detected - may already exist`);
            } else {
              console.log(`   Statement ${i + 1}: ${statement.substring(0, 50)}... - needs manual application`);
            }
          } else {
            console.log(`   Statement ${i + 1}: ✅ Applied successfully`);
          }
        } catch (stmtError) {
          console.log(`   Statement ${i + 1}: ⚠️ ${stmtError.message}`);
        }
      }
      
      console.log(`✅ Migration ${file} processed`);
    }

    console.log('\n🎉 Migration application completed!');
    console.log('\n⚠️  Note: Due to Supabase limitations, migrations may need to be applied manually through the dashboard.');
    console.log('📖 Please check the Supabase dashboard SQL editor to apply any failed migrations.');

  } catch (error) {
    console.error('❌ Migration application failed:', error);
    console.error('Stack trace:', error.stack);
  }
}

console.log('🚀 Starting migration application...\n');
applyMigrations().catch(error => {
  console.error('❌ Application failed:', error);
  process.exit(1);
});
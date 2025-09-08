#!/usr/bin/env node

// Check what schema already exists in the database
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

async function checkExistingSchema() {
  console.log('🔍 Checking existing database schema...\n');

  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    console.error('❌ Missing required environment variables');
    process.exit(1);
  }

  // Create admin client
  const supabase = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  try {
    console.log('📊 Checking existing tables...');
    
    // List of expected tables
    const expectedTables = [
      'users_profile', 'gigs', 'applications', 'media', 'moodboards', 
      'moodboard_items', 'messages', 'showcases', 'showcase_media', 
      'reviews', 'subscriptions', 'reports'
    ];

    const existingTables = [];
    const missingTables = [];

    for (const tableName of expectedTables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact' })
          .limit(1);
        
        if (error) {
          if (error.message.includes('does not exist') || error.message.includes('schema cache')) {
            console.log(`❌ Table ${tableName}: Does not exist`);
            missingTables.push(tableName);
          } else {
            console.log(`✅ Table ${tableName}: Exists (${error.message})`);
            existingTables.push(tableName);
          }
        } else {
          console.log(`✅ Table ${tableName}: Exists and accessible`);
          existingTables.push(tableName);
        }
      } catch (tableError) {
        console.log(`❌ Table ${tableName}: Error checking - ${tableError.message}`);
        missingTables.push(tableName);
      }
    }

    console.log('\n📊 Schema Analysis:');
    console.log(`✅ Existing tables: ${existingTables.length}/${expectedTables.length}`);
    console.log(`❌ Missing tables: ${missingTables.length}/${expectedTables.length}`);

    if (existingTables.length > 0) {
      console.log('\n✅ Existing tables:');
      existingTables.forEach(table => console.log(`   - ${table}`));
    }

    if (missingTables.length > 0) {
      console.log('\n❌ Missing tables:');
      missingTables.forEach(table => console.log(`   - ${table}`));
    }

    // Check for custom types by trying to use them
    console.log('\n🎭 Checking custom types...');
    const customTypes = [
      'user_role', 'subscription_tier', 'subscription_status', 
      'gig_status', 'compensation_type', 'application_status',
      'showcase_visibility', 'media_type'
    ];

    console.log('ℹ️  Custom types cannot be directly tested via Supabase client');
    console.log('   The error "type already exists" suggests some types are created');

    // Provide recommendations
    console.log('\n💡 Recommendations:');
    
    if (existingTables.length === 0 && missingTables.length === expectedTables.length) {
      console.log('🔧 No tables exist but types might. Try this modified migration:');
      console.log('   1. Remove or comment out the CREATE TYPE statements');
      console.log('   2. Keep only CREATE TABLE statements');
      console.log('   3. Apply the modified migration');
    } else if (existingTables.length > 0 && missingTables.length > 0) {
      console.log('🔧 Partial schema exists. Options:');
      console.log('   1. Create only missing tables individually');
      console.log('   2. Drop existing and recreate all (risky if data exists)');
      console.log('   3. Check what\'s missing and apply incrementally');
    } else if (missingTables.length === 0) {
      console.log('🎉 All tables exist! Schema is complete.');
      console.log('   Run the verification script: node src/verify-setup.js');
    }

    // Generate a safe migration for missing tables
    if (missingTables.length > 0) {
      console.log('\n📝 Generating safe migration for missing tables...');
      
      const migrationPath = path.resolve(rootDir, 'supabase/migrations/001_initial_schema.sql');
      const fullMigration = fs.readFileSync(migrationPath, 'utf8');
      
      // Extract CREATE TABLE statements for missing tables
      const tableStatements = [];
      const lines = fullMigration.split('\n');
      let currentTable = '';
      let inTable = false;
      
      for (const line of lines) {
        if (line.trim().startsWith('CREATE TABLE')) {
          const tableName = line.match(/CREATE TABLE (\w+)/)?.[1];
          if (tableName && missingTables.includes(tableName)) {
            inTable = true;
            currentTable = line;
          } else {
            inTable = false;
          }
        } else if (inTable) {
          currentTable += '\n' + line;
          if (line.trim() === ');') {
            tableStatements.push(currentTable);
            inTable = false;
            currentTable = '';
          }
        }
      }
      
      if (tableStatements.length > 0) {
        const safeMigration = `-- Safe migration for missing tables only\n-- Generated: ${new Date().toISOString()}\n\n${tableStatements.join('\n\n')}`;
        
        const safeMigrationPath = path.resolve(__dirname, 'safe-migration.sql');
        fs.writeFileSync(safeMigrationPath, safeMigration);
        
        console.log(`💾 Safe migration saved to: ${safeMigrationPath}`);
        console.log('   Copy this content to Supabase Dashboard SQL Editor');
      }
    }

  } catch (error) {
    console.error('❌ Schema check failed:', error);
    console.error('Stack trace:', error.stack);
  }
}

console.log('🚀 Starting schema analysis...\n');
checkExistingSchema().catch(error => {
  console.error('❌ Analysis failed:', error);
  process.exit(1);
});
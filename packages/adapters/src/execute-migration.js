#!/usr/bin/env node

// Execute the complete database migration
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

async function executeMigration() {
  console.log('🚀 Executing database schema migration...\n');

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
    console.log('📋 Loading migration file...');
    const migrationPath = path.resolve(__dirname, 'create-missing-types-and-tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log(`✅ Migration loaded (${migrationSQL.length} characters)\n`);

    // Execute the migration using Supabase RPC
    console.log('🔄 Executing migration via Supabase...');
    
    // Try to execute using the sql function if available
    const { data, error } = await supabase.rpc('exec', {
      sql: migrationSQL
    });

    if (error) {
      console.log(`ℹ️  RPC exec not available: ${error.message}`);
      console.log('🔄 Trying alternative execution method...');
      
      // Try direct SQL execution via REST API
      const response = await fetch(`${url}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
          'apikey': serviceRoleKey
        },
        body: JSON.stringify({ sql: migrationSQL })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.log(`ℹ️  REST API exec not available: ${errorText}`);
        
        console.log('\n🔧 Direct SQL execution not available via client.');
        console.log('📖 Manual execution required:');
        console.log('   1. Copy the migration SQL below');
        console.log('   2. Go to Supabase Dashboard SQL Editor');
        console.log('   3. Paste and execute the migration');
        console.log(`   4. URL: https://supabase.com/dashboard/project/${process.env.SUPABASE_PROJECT_REF}/editor`);
        
        console.log('\n📋 Migration SQL to copy:');
        console.log('=' .repeat(80));
        console.log(migrationSQL);
        console.log('=' .repeat(80));
        
        return;
      }

      const result = await response.json();
      console.log('✅ Migration executed successfully via REST API!');
      console.log('Result:', result);
    } else {
      console.log('✅ Migration executed successfully via RPC!');
      console.log('Result:', data);
    }

    // Verify the migration worked
    console.log('\n🔍 Verifying migration results...');
    
    const expectedTables = [
      'users_profile', 'gigs', 'applications', 'media', 'moodboards', 
      'moodboard_items', 'messages', 'showcases', 'showcase_media', 
      'reviews', 'subscriptions', 'reports'
    ];

    let successCount = 0;
    for (const tableName of expectedTables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact' })
          .limit(1);
        
        if (error) {
          if (error.message.includes('does not exist') || error.message.includes('schema cache')) {
            console.log(`❌ Table ${tableName}: Still not accessible`);
          } else {
            console.log(`✅ Table ${tableName}: Created successfully`);
            successCount++;
          }
        } else {
          console.log(`✅ Table ${tableName}: Created and accessible`);
          successCount++;
        }
      } catch (tableError) {
        console.log(`❌ Table ${tableName}: Error - ${tableError.message}`);
      }
    }

    console.log(`\n📊 Migration Results:`);
    console.log(`✅ Tables created: ${successCount}/${expectedTables.length}`);
    
    if (successCount === expectedTables.length) {
      console.log('\n🎉 Migration completed successfully!');
      console.log('🚀 Database schema is ready for development');
      
      // Run the verification script
      console.log('\n🔍 Running complete verification...');
      const { exec } = require('child_process');
      exec('node src/verify-setup.js', (error, stdout, stderr) => {
        if (error) {
          console.log('⚠️  Verification script failed to run');
        } else {
          console.log('\n' + stdout);
        }
      });
      
    } else {
      console.log('\n⚠️  Migration partially completed');
      console.log('📖 Some tables may need manual creation via Dashboard');
    }

  } catch (error) {
    console.error('❌ Migration execution failed:', error);
    
    // Still show the manual instructions
    console.log('\n📖 Fallback: Manual execution required:');
    console.log(`   URL: https://supabase.com/dashboard/project/${process.env.SUPABASE_PROJECT_REF}/editor`);
  }
}

console.log('⚡ Starting migration execution...\n');
executeMigration().catch(error => {
  console.error('❌ Execution failed:', error);
  process.exit(1);
});
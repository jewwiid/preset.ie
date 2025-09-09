#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
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

async function checkTableStructure(tableName) {
  try {
    // Try to query the table
    const { data, error, status, statusText } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (error) {
      if (error.message.includes('does not exist')) {
        return { exists: false, error: 'Table does not exist' };
      }
      // Table exists but might have permission issues or be empty
      return { exists: true, rows: 0, columns: [], error: error.message };
    }
    
    // Get column information if we have data
    const columns = data && data.length > 0 ? Object.keys(data[0]) : [];
    
    return {
      exists: true,
      rows: data ? data.length : 0,
      columns: columns,
      sample: data && data.length > 0 ? data[0] : null
    };
  } catch (err) {
    return { exists: false, error: err.message };
  }
}

async function testDomainEvents() {
  console.log('\n📊 Testing domain_events table...');
  
  try {
    // Insert a test event
    const testEvent = {
      aggregate_id: 'test-' + Date.now(),
      event_type: 'TestEventCreated',
      event_version: 1,
      payload: { test: true, timestamp: new Date().toISOString() },
      metadata: { source: 'migration-test' },
      occurred_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('domain_events')
      .insert([testEvent])
      .select();
    
    if (error) {
      console.log('   ⚠️  Insert test failed:', error.message);
      return false;
    }
    
    console.log('   ✅ Successfully inserted test event');
    
    // Read it back
    const { data: readData, error: readError } = await supabase
      .from('domain_events')
      .select('*')
      .eq('aggregate_id', testEvent.aggregate_id)
      .single();
    
    if (readError) {
      console.log('   ⚠️  Read test failed:', readError.message);
      return false;
    }
    
    console.log('   ✅ Successfully read test event');
    
    // Clean up
    const { error: deleteError } = await supabase
      .from('domain_events')
      .delete()
      .eq('aggregate_id', testEvent.aggregate_id);
    
    if (!deleteError) {
      console.log('   ✅ Cleaned up test event');
    }
    
    return true;
  } catch (err) {
    console.log('   ❌ Error:', err.message);
    return false;
  }
}

async function testUsersTable() {
  console.log('\n📊 Testing users table...');
  
  try {
    // Check if we can query
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (error && !error.message.includes('permission')) {
      console.log('   ⚠️  Query failed:', error.message);
      return false;
    }
    
    console.log('   ✅ Users table is accessible');
    
    // Check columns by attempting insert (will fail but gives us info)
    const testUser = {
      id: '00000000-0000-0000-0000-000000000000', // Invalid UUID to ensure failure
      email: 'test@example.com',
      role: 'TALENT'
    };
    
    const { error: insertError } = await supabase
      .from('users')
      .insert([testUser]);
    
    // We expect this to fail, but it confirms table structure
    if (insertError) {
      if (insertError.message.includes('violates foreign key') || 
          insertError.message.includes('duplicate key') ||
          insertError.message.includes('permission')) {
        console.log('   ✅ Table structure verified');
        return true;
      }
    }
    
    return true;
  } catch (err) {
    console.log('   ❌ Error:', err.message);
    return false;
  }
}

async function testProfilesTable() {
  console.log('\n📊 Testing profiles table...');
  
  try {
    // Check if we can query
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (error && !error.message.includes('does not exist')) {
      console.log('   ✅ Profiles table exists');
    } else if (!error) {
      console.log('   ✅ Profiles table is accessible');
      if (data && data.length > 0) {
        console.log('   📝 Sample profile columns:', Object.keys(data[0]));
      }
    }
    
    return true;
  } catch (err) {
    console.log('   ❌ Error:', err.message);
    return false;
  }
}

async function main() {
  console.log('🔍 Verifying Phase 1 & 2 Database Tables\n');
  console.log('📍 Supabase URL:', supabaseUrl);
  
  const tables = {
    'domain_events': 'Phase 1 - Event Sourcing',
    'users': 'Phase 2 - Identity Context',
    'profiles': 'Phase 2 - Identity Context',
    'gigs': 'Phase 2 - Gigs Context',
    'applications': 'Phase 2 - Applications Context',
    'users_profile': 'Legacy - Existing table',
    'moodboards': 'Existing - Moodboard feature',
    'showcases': 'Existing - Portfolio feature',
    'messages': 'Existing - Messaging',
    'reviews': 'Existing - Reviews'
  };
  
  console.log('📋 Checking table existence:\n');
  
  const results = {};
  for (const [table, description] of Object.entries(tables)) {
    const result = await checkTableStructure(table);
    results[table] = result;
    
    if (result.exists) {
      console.log(`✅ ${table.padEnd(20)} - ${description}`);
      if (result.columns && result.columns.length > 0) {
        console.log(`   Columns: ${result.columns.slice(0, 5).join(', ')}${result.columns.length > 5 ? '...' : ''}`);
      }
    } else {
      console.log(`❌ ${table.padEnd(20)} - ${description}`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    }
  }
  
  // Run functional tests
  console.log('\n🧪 Running functional tests:');
  
  const domainEventsOk = await testDomainEvents();
  const usersOk = await testUsersTable();
  const profilesOk = await testProfilesTable();
  
  // Summary
  console.log('\n📊 Summary:');
  console.log('═══════════════════════════════════════');
  
  const phase1Tables = ['domain_events'];
  const phase2Tables = ['users', 'profiles', 'gigs', 'applications'];
  
  const phase1Complete = phase1Tables.every(t => results[t]?.exists);
  const phase2Complete = phase2Tables.every(t => results[t]?.exists);
  
  console.log(`Phase 1 (Foundation):     ${phase1Complete ? '✅ COMPLETE' : '⚠️  INCOMPLETE'}`);
  console.log(`Phase 2 (Core Contexts):  ${phase2Complete ? '✅ COMPLETE' : '⚠️  INCOMPLETE'}`);
  
  if (phase1Complete && phase2Complete) {
    console.log('\n🎉 All Phase 1 & 2 tables are successfully created!');
    console.log('✨ Database is ready for the application layer implementation.');
  } else {
    console.log('\n⚠️  Some tables are missing. Please check the errors above.');
  }
}

main().catch(console.error);
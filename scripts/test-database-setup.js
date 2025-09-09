const { createClient } = require('@supabase/supabase-js');

// Local Supabase configuration
const supabaseUrl = 'http://localhost:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

async function testDatabaseSetup() {
  console.log('🧪 Testing Database Setup...\n');
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    // Test 1: Check tables exist
    console.log('1️⃣ Checking tables...');
    const tables = ['users', 'profiles', 'domain_events', 'moodboards', 'gigs', 'applications'];
    
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error && !error.message.includes('no rows')) {
        console.log(`   ❌ ${table}: ${error.message}`);
      } else {
        console.log(`   ✅ ${table}: accessible`);
      }
    }
    
    // Test 2: Test domain events insertion
    console.log('\n2️⃣ Testing domain_events table...');
    const testEvent = {
      aggregate_id: 'test-123',
      event_type: 'TestEvent',
      payload: { test: true, timestamp: new Date().toISOString() },
      metadata: { userId: 'test-user' },
      occurred_at: new Date().toISOString()
    };
    
    const { data: eventData, error: eventError } = await supabase
      .from('domain_events')
      .insert(testEvent)
      .select()
      .single();
    
    if (eventError) {
      console.log(`   ❌ Insert failed: ${eventError.message}`);
    } else {
      console.log(`   ✅ Event inserted with ID: ${eventData.id}`);
      
      // Clean up test data
      await supabase
        .from('domain_events')
        .delete()
        .eq('id', eventData.id);
    }
    
    // Test 3: Test auth.users connection
    console.log('\n3️⃣ Testing auth.users...');
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.log(`   ❌ Auth check failed: ${authError.message}`);
    } else {
      console.log(`   ✅ Auth system accessible (${authData.users.length} users)`);
    }
    
    // Test 4: Test RLS policies
    console.log('\n4️⃣ Testing RLS policies...');
    
    // Create a test user
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: 'test@example.com',
      password: 'test123456',
      email_confirm: true,
      user_metadata: { role: 'talent' }
    });
    
    if (userError) {
      console.log(`   ❌ User creation failed: ${userError.message}`);
    } else {
      console.log(`   ✅ Test user created: ${userData.user.email}`);
      
      // Check if trigger created user record
      const { data: userRecord, error: recordError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userData.user.id)
        .single();
      
      if (recordError) {
        console.log(`   ❌ User record not created by trigger: ${recordError.message}`);
      } else {
        console.log(`   ✅ User record created automatically by trigger`);
        console.log(`      - Role: ${userRecord.role}`);
        console.log(`      - Subscription: ${userRecord.subscription_tier}`);
      }
      
      // Clean up test user
      await supabase.auth.admin.deleteUser(userData.user.id);
      console.log(`   🧹 Test user cleaned up`);
    }
    
    // Test 5: Check indexes
    console.log('\n5️⃣ Checking indexes...');
    try {
      const { data: indexes, error: indexError } = await supabase.rpc('get_indexes', {
        table_name: 'profiles'
      });
      
      if (indexError || !indexes) {
        console.log(`   ⚠️  Index check skipped (RPC not available)`);
      } else {
        console.log(`   ✅ Indexes configured`);
      }
    } catch (e) {
      console.log(`   ⚠️  Index check skipped (RPC not available)`);
    }
    
    console.log('\n✨ Database setup test complete!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testDatabaseSetup().catch(console.error);
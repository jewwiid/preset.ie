const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTriggers() {
  console.log('🔍 Checking triggers on auth.users...\n');

  try {
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          trigger_name,
          event_manipulation,
          action_timing,
          action_statement
        FROM information_schema.triggers 
        WHERE event_object_table = 'users' 
        AND event_object_schema = 'auth'
        ORDER BY trigger_name;
      `
    });

    if (error) {
      console.log(`❌ Error checking triggers: ${error.message}`);
      return;
    }

    if (data && data.length > 0) {
      console.log('✅ Triggers found on auth.users:');
      data.forEach(trigger => {
        console.log(`   - ${trigger.trigger_name} (${trigger.event_manipulation} ${trigger.action_timing})`);
      });
    } else {
      console.log('⚠️  No triggers found on auth.users');
    }

  } catch (err) {
    console.log(`❌ Error: ${err.message}`);
  }
}

async function checkFunctions() {
  console.log('\n🔍 Checking user creation functions...\n');

  const functions = [
    'handle_new_user',
    'create_default_user_settings', 
    'initialize_user_credits',
    'create_default_notification_preferences'
  ];

  for (const funcName of functions) {
    try {
      const { data, error } = await supabase.rpc('exec_sql', {
        sql: `
          SELECT 
            routine_name,
            routine_type,
            data_type
          FROM information_schema.routines 
          WHERE routine_name = '${funcName}'
          AND routine_schema = 'public';
        `
      });

      if (error) {
        console.log(`❌ ${funcName}: ${error.message}`);
      } else if (data && data.length > 0) {
        console.log(`✅ ${funcName}: exists`);
      } else {
        console.log(`❌ ${funcName}: not found`);
      }
    } catch (err) {
      console.log(`❌ ${funcName}: ${err.message}`);
    }
  }
}

async function checkTableConstraints() {
  console.log('\n🔍 Checking table constraints...\n');

  const tables = ['users', 'users_profile', 'user_settings', 'user_credits'];

  for (const tableName of tables) {
    try {
      const { data, error } = await supabase.rpc('exec_sql', {
        sql: `
          SELECT 
            constraint_name,
            constraint_type
          FROM information_schema.table_constraints 
          WHERE table_name = '${tableName}'
          AND table_schema = 'public';
        `
      });

      if (error) {
        console.log(`❌ ${tableName}: ${error.message}`);
      } else if (data && data.length > 0) {
        console.log(`✅ ${tableName}: ${data.length} constraints`);
        data.forEach(constraint => {
          console.log(`   - ${constraint.constraint_name} (${constraint.constraint_type})`);
        });
      } else {
        console.log(`⚠️  ${tableName}: no constraints found`);
      }
    } catch (err) {
      console.log(`❌ ${tableName}: ${err.message}`);
    }
  }
}

async function testDirectUserInsert() {
  console.log('\n🧪 Testing direct user insertion...\n');

  try {
    const testUserId = '00000000-0000-0000-0000-000000000001';
    const testEmail = `test-direct-${Date.now()}@example.com`;

    // Try to insert directly into users table
    const { data, error } = await supabase
      .from('users')
      .insert({
        id: testUserId,
        email: testEmail,
        role: 'USER'
      });

    if (error) {
      console.log(`❌ Direct users insert failed: ${error.message}`);
    } else {
      console.log(`✅ Direct users insert succeeded`);
      
      // Clean up
      await supabase.from('users').delete().eq('id', testUserId);
      console.log('✅ Test record cleaned up');
    }

  } catch (err) {
    console.log(`❌ Direct insert test failed: ${err.message}`);
  }
}

async function checkRLSPolicies() {
  console.log('\n🔍 Checking RLS policies...\n');

  const tables = ['users', 'users_profile', 'user_settings', 'user_credits', 'notification_preferences'];

  for (const tableName of tables) {
    try {
      const { data, error } = await supabase.rpc('exec_sql', {
        sql: `
          SELECT 
            policyname,
            permissive,
            roles,
            cmd,
            qual
          FROM pg_policies 
          WHERE tablename = '${tableName}'
          AND schemaname = 'public';
        `
      });

      if (error) {
        console.log(`❌ ${tableName}: ${error.message}`);
      } else if (data && data.length > 0) {
        console.log(`✅ ${tableName}: ${data.length} policies`);
        data.forEach(policy => {
          console.log(`   - ${policy.policyname} (${policy.cmd})`);
        });
      } else {
        console.log(`⚠️  ${tableName}: no RLS policies found`);
      }
    } catch (err) {
      console.log(`❌ ${tableName}: ${err.message}`);
    }
  }
}

async function main() {
  console.log('🔧 Comprehensive User Creation Debug\n');
  
  try {
    await checkTriggers();
    await checkFunctions();
    await checkTableConstraints();
    await checkRLSPolicies();
    await testDirectUserInsert();

    console.log('\n🎯 Debug Complete');
    console.log('Review the output above to identify potential issues with user creation.');

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

main();

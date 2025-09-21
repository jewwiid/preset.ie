#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function checkForeignKeys() {
  console.log('🔍 Checking Foreign Key Constraints...\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing environment variables');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    console.log('✅ Connected to Supabase database\n');

    // 1. Check what table the foreign key references
    console.log('1️⃣ Checking playground_projects foreign key constraint...');
    
    // Get the constraint details by trying to insert with a bad user_id
    try {
      const { data, error } = await supabase
        .from('playground_projects')
        .insert({
          user_id: '00000000-0000-0000-0000-000000000000',
          title: 'FK Test',
          prompt: 'Test prompt',
          style: 'realistic',
          generated_images: [],
          credits_used: 0,
          aspect_ratio: '1:1',
          resolution: '1024x1024',
          status: 'draft',
          metadata: {}
        })
        .select();
      
      if (error) {
        console.log('❌ Foreign key constraint details:');
        console.log('   Message:', error.message);
        console.log('   Details:', error.details);
        console.log('   Code:', error.code);
        
        // Parse the error message to understand the constraint
        if (error.details && error.details.includes('is not present in table')) {
          const match = error.details.match(/is not present in table "(\w+)"/);
          if (match) {
            console.log(`   ➡️  References table: ${match[1]}`);
          }
        }
      }
    } catch (error) {
      console.error('Exception during FK test:', error.message);
    }
    console.log('');

    // 2. Check auth.users table
    console.log('2️⃣ Checking auth.users table...');
    try {
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        console.error('❌ Cannot access auth.users:', authError.message);
      } else {
        console.log(`✅ Found ${authUsers.users?.length || 0} users in auth.users`);
        if (authUsers.users && authUsers.users.length > 0) {
          console.log('   First few user IDs:');
          authUsers.users.slice(0, 3).forEach((user, index) => {
            console.log(`   ${index + 1}. ${user.id} (${user.email})`);
          });
        }
      }
    } catch (error) {
      console.error('❌ Auth users exception:', error.message);
    }
    console.log('');

    // 3. Check users table (if it exists)
    console.log('3️⃣ Checking users table...');
    try {
      const { data: usersTable, error: usersError } = await supabase
        .from('users')
        .select('id')
        .limit(3);
      
      if (usersError) {
        console.log('❌ users table error:', usersError.message);
        if (usersError.code === '42P01') {
          console.log('   ℹ️  users table does not exist');
        }
      } else {
        console.log(`✅ Found ${usersTable?.length || 0} users in users table`);
        if (usersTable && usersTable.length > 0) {
          console.log('   First few user IDs:');
          usersTable.forEach((user, index) => {
            console.log(`   ${index + 1}. ${user.id}`);
          });
        }
      }
    } catch (error) {
      console.error('❌ Users table exception:', error.message);
    }
    console.log('');

    // 4. Check users_profile table
    console.log('4️⃣ Checking users_profile table...');
    try {
      const { data: profilesTable, error: profilesError } = await supabase
        .from('users_profile')
        .select('id, user_id')
        .limit(3);
      
      if (profilesError) {
        console.log('❌ users_profile table error:', profilesError.message);
        if (profilesError.code === '42P01') {
          console.log('   ℹ️  users_profile table does not exist');
        }
      } else {
        console.log(`✅ Found ${profilesTable?.length || 0} profiles in users_profile table`);
        if (profilesTable && profilesTable.length > 0) {
          console.log('   First few profile IDs and user_ids:');
          profilesTable.forEach((profile, index) => {
            console.log(`   ${index + 1}. Profile ID: ${profile.id}, User ID: ${profile.user_id}`);
          });
        }
      }
    } catch (error) {
      console.error('❌ Users profile exception:', error.message);
    }
    console.log('');

    // 5. Test with a real auth user
    console.log('5️⃣ Testing with real auth user...');
    try {
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authUsers && authUsers.users && authUsers.users.length > 0) {
        const realUser = authUsers.users[0];
        console.log(`   Using user: ${realUser.id} (${realUser.email})`);
        
        const { data: insertData, error: insertError } = await supabase
          .from('playground_projects')
          .insert({
            user_id: realUser.id,
            title: 'Real User FK Test',
            prompt: 'Test prompt with real user',
            style: 'realistic',
            generated_images: [],
            credits_used: 0,
            aspect_ratio: '1:1',
            resolution: '1024x1024',
            status: 'draft',
            metadata: {}
          })
          .select()
          .single();
        
        if (insertError) {
          console.error('   ❌ Real user insert failed:', insertError.message);
          console.error('   Details:', insertError.details);
          console.error('   Code:', insertError.code);
        } else {
          console.log('   ✅ Real user insert successful');
          console.log('   Inserted ID:', insertData.id);
          
          // Clean up
          await supabase
            .from('playground_projects')
            .delete()
            .eq('id', insertData.id);
          console.log('   ✅ Test data cleaned up');
        }
      }
    } catch (error) {
      console.error('❌ Real user test exception:', error.message);
    }

    console.log('\n📊 FOREIGN KEY ANALYSIS');
    console.log('======================');
    console.log('The playground_projects table has a foreign key constraint that references');
    console.log('a specific table for user_id validation. Based on the error message,');
    console.log('it appears to reference either:');
    console.log('1. auth.users (Supabase auth table)');
    console.log('2. users (custom users table)');
    console.log('3. users_profile (user profile table)');
    console.log('');
    console.log('If inserts are failing, ensure:');
    console.log('1. The user exists in the referenced table');
    console.log('2. The user_id format matches exactly');
    console.log('3. RLS policies allow the operation');

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

checkForeignKeys().catch(console.error);

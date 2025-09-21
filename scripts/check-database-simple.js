#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function checkDatabase() {
  console.log('🔍 Checking Database Tables and Schema...\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing environment variables');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    console.log('✅ Connected to Supabase database\n');

    // 1. Test playground_projects table
    console.log('1️⃣ Testing playground_projects table...');
    try {
      const { data: playgroundData, error: playgroundError } = await supabase
        .from('playground_projects')
        .select('id, user_id, title, prompt, style, generated_images, credits_used, created_at, updated_at, last_generated_at, aspect_ratio, resolution, status, metadata')
        .limit(1);
      
      if (playgroundError) {
        console.error('❌ playground_projects error:', playgroundError.message);
        console.error('   Details:', playgroundError.details);
        console.error('   Hint:', playgroundError.hint);
      } else {
        console.log('✅ playground_projects table exists and is accessible');
        console.log('   Sample data count:', playgroundData?.length || 0);
      }
    } catch (error) {
      console.error('❌ playground_projects exception:', error.message);
    }
    console.log('');

    // 2. Test user_credits table
    console.log('2️⃣ Testing user_credits table...');
    try {
      const { data: creditsData, error: creditsError } = await supabase
        .from('user_credits')
        .select('id, user_id, current_balance, subscription_tier')
        .limit(1);
      
      if (creditsError) {
        console.error('❌ user_credits error:', creditsError.message);
        console.error('   Details:', creditsError.details);
        console.error('   Hint:', creditsError.hint);
      } else {
        console.log('✅ user_credits table exists and is accessible');
        console.log('   Sample data count:', creditsData?.length || 0);
      }
    } catch (error) {
      console.error('❌ user_credits exception:', error.message);
    }
    console.log('');

    // 3. Test insert operation on playground_projects
    console.log('3️⃣ Testing playground_projects insert operation...');
    try {
      const testData = {
        user_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
        title: 'Test Project',
        prompt: 'Test prompt',
        style: 'realistic',
        generated_images: [],
        credits_used: 0,
        aspect_ratio: '1:1',
        resolution: '1024x1024',
        status: 'draft',
        metadata: {}
      };

      const { data: insertData, error: insertError } = await supabase
        .from('playground_projects')
        .insert(testData)
        .select()
        .single();
      
      if (insertError) {
        console.error('❌ Insert test failed:', insertError.message);
        console.error('   Details:', insertError.details);
        console.error('   Hint:', insertError.hint);
        console.error('   Code:', insertError.code);
        
        // Check if it's a foreign key constraint error
        if (insertError.code === '23503') {
          console.log('   ℹ️  This is likely a foreign key constraint error (user doesn\'t exist)');
        }
      } else {
        console.log('✅ Insert test successful');
        console.log('   Inserted ID:', insertData?.id);
        
        // Clean up test data
        await supabase
          .from('playground_projects')
          .delete()
          .eq('id', insertData.id);
        console.log('   ✅ Test data cleaned up');
      }
    } catch (error) {
      console.error('❌ Insert test exception:', error.message);
    }
    console.log('');

    // 4. Test with a real user if available
    console.log('4️⃣ Checking for existing users...');
    try {
      const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
      
      if (usersError) {
        console.error('❌ Cannot list users:', usersError.message);
      } else {
        console.log(`✅ Found ${users.users?.length || 0} users in auth.users`);
        
        if (users.users && users.users.length > 0) {
          const firstUser = users.users[0];
          console.log('   First user ID:', firstUser.id);
          
          // Test with real user ID
          console.log('   Testing insert with real user ID...');
          const realTestData = {
            user_id: firstUser.id,
            title: 'Real User Test Project',
            prompt: 'Test prompt with real user',
            style: 'realistic',
            generated_images: [],
            credits_used: 0,
            aspect_ratio: '1:1',
            resolution: '1024x1024',
            status: 'draft',
            metadata: {}
          };

          const { data: realInsertData, error: realInsertError } = await supabase
            .from('playground_projects')
            .insert(realTestData)
            .select()
            .single();
          
          if (realInsertError) {
            console.error('   ❌ Real user insert failed:', realInsertError.message);
            console.error('   Details:', realInsertError.details);
            console.error('   Code:', realInsertError.code);
          } else {
            console.log('   ✅ Real user insert successful');
            console.log('   Inserted ID:', realInsertData?.id);
            
            // Clean up
            await supabase
              .from('playground_projects')
              .delete()
              .eq('id', realInsertData.id);
            console.log('   ✅ Real test data cleaned up');
          }
        }
      }
    } catch (error) {
      console.error('❌ User check exception:', error.message);
    }
    console.log('');

    // 5. Check specific columns that the API uses
    console.log('5️⃣ Testing specific API columns...');
    try {
      // Try to select with all the columns the API tries to insert
      const { data: columnTest, error: columnError } = await supabase
        .from('playground_projects')
        .select(`
          id,
          user_id,
          title,
          prompt,
          style,
          aspect_ratio,
          resolution,
          generated_images,
          credits_used,
          status,
          last_generated_at,
          metadata
        `)
        .limit(1);
      
      if (columnError) {
        console.error('❌ Column test failed:', columnError.message);
        console.error('   This suggests missing columns in the table');
      } else {
        console.log('✅ All required API columns are present');
      }
    } catch (error) {
      console.error('❌ Column test exception:', error.message);
    }

    console.log('\n📊 DIAGNOSIS COMPLETE');
    console.log('================');
    console.log('If insert operations are failing, it\'s likely due to:');
    console.log('1. Missing foreign key references (user doesn\'t exist in auth.users)');
    console.log('2. RLS policies preventing insert operations');
    console.log('3. Missing required columns or constraints');
    console.log('4. Authentication/authorization issues');

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

checkDatabase().catch(console.error);

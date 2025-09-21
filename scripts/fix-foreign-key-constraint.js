#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function fixForeignKeyConstraint() {
  console.log('🔧 Fixing Foreign Key Constraint for playground_projects...\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing environment variables');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    console.log('✅ Connected to Supabase database\n');

    // 1. First, let's see what constraints exist
    console.log('1️⃣ Checking current foreign key constraints...');
    
    // The playground_projects table should reference auth.users, not a custom users table
    // Let's drop the incorrect constraint and add the correct one
    
    console.log('2️⃣ Dropping incorrect foreign key constraint...');
    try {
      const { data: dropResult, error: dropError } = await supabase
        .rpc('exec_sql', { 
          sql: `ALTER TABLE playground_projects DROP CONSTRAINT IF EXISTS playground_projects_user_id_fkey;`
        });
      
      if (dropError) {
        console.log('❌ Could not drop constraint via RPC:', dropError.message);
        console.log('   This is expected - we\'ll use a migration file instead');
      } else {
        console.log('✅ Dropped incorrect foreign key constraint');
      }
    } catch (error) {
      console.log('❌ Exception dropping constraint:', error.message);
    }
    
    console.log('3️⃣ Adding correct foreign key constraint...');
    try {
      const { data: addResult, error: addError } = await supabase
        .rpc('exec_sql', { 
          sql: `ALTER TABLE playground_projects ADD CONSTRAINT playground_projects_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;`
        });
      
      if (addError) {
        console.log('❌ Could not add constraint via RPC:', addError.message);
        console.log('   This is expected - we\'ll use a migration file instead');
      } else {
        console.log('✅ Added correct foreign key constraint');
      }
    } catch (error) {
      console.log('❌ Exception adding constraint:', error.message);
    }
    
    console.log('\n📝 MIGRATION FILE NEEDED');
    console.log('========================');
    console.log('Since RPC execution may not work, create a migration file with:');
    console.log('');
    console.log('-- Drop incorrect foreign key constraint');
    console.log('ALTER TABLE playground_projects DROP CONSTRAINT IF EXISTS playground_projects_user_id_fkey;');
    console.log('');
    console.log('-- Add correct foreign key constraint to auth.users');
    console.log('ALTER TABLE playground_projects ADD CONSTRAINT playground_projects_user_id_fkey');
    console.log('  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;');
    console.log('');
    
    // Test with auth user after potential fix
    console.log('4️⃣ Testing with auth user ID...');
    try {
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authUsers && authUsers.users && authUsers.users.length > 0) {
        const authUser = authUsers.users[0];
        console.log(`   Testing with auth user: ${authUser.id} (${authUser.email})`);
        
        const { data: insertData, error: insertError } = await supabase
          .from('playground_projects')
          .insert({
            user_id: authUser.id,
            title: 'Auth User Test',
            prompt: 'Test with auth user ID',
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
          console.error('   ❌ Auth user insert still fails:', insertError.message);
          console.error('   Details:', insertError.details);
          console.error('   Code:', insertError.code);
          
          if (insertError.details && insertError.details.includes('users')) {
            console.log('   ➡️  Still referencing wrong table - migration needed');
          }
        } else {
          console.log('   ✅ Auth user insert successful!');
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
      console.error('❌ Auth user test exception:', error.message);
    }

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

fixForeignKeyConstraint().catch(console.error);

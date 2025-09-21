#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function fixStatusConstraint() {
  console.log('🔧 Fixing playground_projects status constraint...\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing environment variables');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    console.log('✅ Connected to Supabase database\n');

    // Test current constraint by trying to insert with 'processing' status
    console.log('1️⃣ Testing current constraint...');
    try {
      const testUserId = '550e8400-e29b-41d4-a716-446655440000'; // Known user
      const { data: testInsert, error: testError } = await supabase
        .from('playground_projects')
        .insert({
          user_id: testUserId,
          title: 'Constraint Test',
          prompt: 'Testing processing status',
          style: 'realistic',
          generated_images: [],
          credits_used: 0,
          aspect_ratio: '1:1',
          resolution: '1024x1024',
          status: 'processing', // This should fail with current constraint
          metadata: {}
        })
        .select()
        .single();
      
      if (testError) {
        if (testError.message.includes('check constraint')) {
          console.log('❌ Confirmed: constraint blocks "processing" status');
          console.log('   Error:', testError.message);
        } else {
          console.log('❌ Different error:', testError.message);
        }
      } else {
        console.log('✅ Processing status already works!');
        console.log('   Test insert ID:', testInsert.id);
        
        // Clean up successful test
        await supabase
          .from('playground_projects')
          .delete()
          .eq('id', testInsert.id);
        console.log('   ✅ Test data cleaned up');
        
        console.log('\n🎉 Constraint is already fixed! No action needed.');
        return;
      }
    } catch (error) {
      console.error('❌ Test failed:', error.message);
    }

    console.log('\n2️⃣ The constraint needs to be updated manually in Supabase Dashboard');
    console.log('   Go to: https://supabase.com/dashboard/project/[your-project]/editor');
    console.log('   Run this SQL:');
    console.log('');
    console.log('   -- Drop existing constraint');
    console.log('   ALTER TABLE playground_projects DROP CONSTRAINT IF EXISTS playground_projects_status_check;');
    console.log('');
    console.log('   -- Add updated constraint');
    console.log('   ALTER TABLE playground_projects ADD CONSTRAINT playground_projects_status_check');
    console.log('     CHECK (status IN (\'draft\', \'generated\', \'saved\', \'published\', \'processing\'));');
    console.log('');
    
    console.log('3️⃣ After running the SQL, test again with this script');

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

fixStatusConstraint().catch(console.error);

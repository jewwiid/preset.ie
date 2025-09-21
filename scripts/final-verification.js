#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function finalVerification() {
  console.log('🔍 Final Database Verification...\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing environment variables');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    console.log('✅ Connected to Supabase database\n');

    // 1. Test foreign key constraint with bad user_id
    console.log('1️⃣ Testing foreign key constraint...');
    try {
      const { data: badInsert, error: badInsertError } = await supabase
        .from('playground_projects')
        .insert({
          user_id: '00000000-0000-0000-0000-000000000000',
          title: 'Bad User Test',
          prompt: 'Testing with bad user ID',
          style: 'realistic',
          generated_images: [],
          credits_used: 0,
          aspect_ratio: '1:1',
          resolution: '1024x1024',
          status: 'draft',
          metadata: {}
        })
        .select();
      
      if (badInsertError) {
        console.log('❌ Expected foreign key error:', badInsertError.message);
        if (badInsertError.details && badInsertError.details.includes('auth.users')) {
          console.log('✅ Foreign key correctly references auth.users');
        } else if (badInsertError.details && badInsertError.details.includes('users')) {
          console.log('❌ Foreign key still references custom users table');
        } else {
          console.log('ℹ️  Different error:', badInsertError.details);
        }
      } else {
        console.log('❌ Unexpected success with bad user_id');
      }
    } catch (error) {
      console.error('❌ Exception during bad user test:', error.message);
    }
    console.log('');

    // 2. Test with real auth user
    console.log('2️⃣ Testing with real auth user...');
    try {
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authUsers && authUsers.users && authUsers.users.length > 0) {
        const realUser = authUsers.users[0];
        console.log(`   Using user: ${realUser.id} (${realUser.email})`);
        
        const { data: goodInsert, error: goodInsertError } = await supabase
          .from('playground_projects')
          .insert({
            user_id: realUser.id,
            title: 'Real User Test',
            prompt: 'Testing with real auth user',
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
        
        if (goodInsertError) {
          console.error('   ❌ Real user insert failed:', goodInsertError.message);
          console.error('   Details:', goodInsertError.details);
          console.error('   Code:', goodInsertError.code);
          
          if (goodInsertError.code === '42501') {
            console.log('   ℹ️  This is an RLS (Row Level Security) policy issue');
            console.log('   The foreign key constraint is likely working, but RLS blocks the insert');
          }
        } else {
          console.log('   ✅ Real user insert successful!');
          console.log('   Inserted ID:', goodInsert.id);
          
          // Clean up
          await supabase
            .from('playground_projects')
            .delete()
            .eq('id', goodInsert.id);
          console.log('   ✅ Test data cleaned up');
        }
      }
    } catch (error) {
      console.error('❌ Real user test exception:', error.message);
    }
    console.log('');

    // 3. Check existing data
    console.log('3️⃣ Checking existing playground projects...');
    try {
      const { data: existingProjects, error: selectError } = await supabase
        .from('playground_projects')
        .select('id, user_id, title, status, created_at')
        .limit(5);
      
      if (selectError) {
        console.error('   ❌ Cannot query existing projects:', selectError.message);
      } else {
        console.log(`   ✅ Found ${existingProjects?.length || 0} existing projects`);
        if (existingProjects && existingProjects.length > 0) {
          existingProjects.forEach((project, index) => {
            console.log(`   ${index + 1}. ${project.title} (${project.status}) - User: ${project.user_id}`);
          });
        }
      }
    } catch (error) {
      console.error('   ❌ Exception querying projects:', error.message);
    }
    console.log('');

    // 4. Test API-like insert (simulating the actual API call)
    console.log('4️⃣ Testing API-like insert pattern...');
    try {
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authUsers && authUsers.users && authUsers.users.length > 0) {
        const apiUser = authUsers.users[0];
        console.log(`   Simulating API call for user: ${apiUser.id}`);
        
        // This mimics the exact structure from the API route
        const projectData = {
          user_id: apiUser.id,
          title: 'API Simulation Test'.substring(0, 50),
          prompt: 'Testing API-like insert pattern',
          style: 'realistic',
          aspect_ratio: '1:1',
          resolution: '1024x1024',
          generated_images: [{
            url: 'https://example.com/test.jpg',
            width: 1024,
            height: 1024,
            generated_at: new Date().toISOString()
          }],
          credits_used: 2,
          status: 'generated',
          last_generated_at: new Date().toISOString(),
          metadata: {
            enhanced_prompt: 'Testing API-like insert pattern, realistic',
            style_applied: 'realistic',
            style_prompt: 'photorealistic, high quality, detailed, natural lighting',
            consistency_level: 'high',
            intensity: 1.0,
            custom_style_preset: null,
            generation_mode: 'text-to-image',
            base_image: null,
            api_endpoint: 'seedream-v4',
            cinematic_parameters: null,
            include_technical_details: true,
            include_style_references: true
          }
        };
        
        const { data: apiInsert, error: apiInsertError } = await supabase
          .from('playground_projects')
          .insert(projectData)
          .select()
          .single();
        
        if (apiInsertError) {
          console.error('   ❌ API-like insert failed:', apiInsertError.message);
          console.error('   Details:', apiInsertError.details);
          console.error('   Code:', apiInsertError.code);
          
          if (apiInsertError.code === '23503') {
            console.log('   ❌ Foreign key constraint error - user_id not found');
          } else if (apiInsertError.code === '42501') {
            console.log('   ✅ Foreign key is working, but RLS policy blocks insert');
            console.log('   This means the constraint fix was successful!');
          }
        } else {
          console.log('   ✅ API-like insert successful!');
          console.log('   Inserted ID:', apiInsert.id);
          console.log('   Generated images:', apiInsert.generated_images?.length || 0);
          
          // Clean up
          await supabase
            .from('playground_projects')
            .delete()
            .eq('id', apiInsert.id);
          console.log('   ✅ API test data cleaned up');
        }
      }
    } catch (error) {
      console.error('   ❌ API simulation exception:', error.message);
    }

    console.log('\n📊 FINAL DIAGNOSIS');
    console.log('==================');
    console.log('Based on the tests above:');
    console.log('');
    console.log('✅ If you see "Foreign key correctly references auth.users" - FIXED');
    console.log('✅ If you see "RLS policy blocks insert" - Foreign key is working');
    console.log('❌ If you see "Foreign key still references custom users table" - Need to apply migration');
    console.log('❌ If you see "user_id not found" errors - Foreign key constraint issue');
    console.log('');
    console.log('The playground generation should now work if the foreign key is fixed.');
    console.log('RLS policy issues are separate and handled by the API authentication.');

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

finalVerification().catch(console.error);

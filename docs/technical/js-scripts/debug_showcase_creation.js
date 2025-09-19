// Debug showcase creation issue
// Run with: node debug_showcase_creation.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Make sure you have NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugShowcaseCreation() {
  console.log('🔍 Debugging Showcase Creation Issue...\n');

  try {
    // 1. Check showcases table structure
    console.log('📋 Checking showcases table structure...');
    const { data: showcases, error: showcasesError } = await supabase
      .from('showcases')
      .select('*')
      .limit(1);

    if (showcasesError) {
      console.error('❌ Error accessing showcases table:', showcasesError);
      return;
    }

    console.log('✅ Showcases table accessible');
    if (showcases && showcases.length > 0) {
      console.log('Sample showcase record:', showcases[0]);
    }

    // 2. Check showcase_media table
    console.log('\n📋 Checking showcase_media table...');
    const { data: media, error: mediaError } = await supabase
      .from('showcase_media')
      .select('*')
      .limit(1);

    if (mediaError) {
      console.error('❌ Error accessing showcase_media table:', mediaError);
    } else {
      console.log('✅ Showcase_media table accessible');
    }

    // 3. Check showcase_like_counts table
    console.log('\n📋 Checking showcase_like_counts table...');
    const { data: likes, error: likesError } = await supabase
      .from('showcase_like_counts')
      .select('*')
      .limit(1);

    if (likesError) {
      console.error('❌ Error accessing showcase_like_counts table:', likesError);
    } else {
      console.log('✅ Showcase_like_counts table accessible');
    }

    // 4. Test creating a simple showcase
    console.log('\n🧪 Testing showcase creation...');
    
    // First, get a test user
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    if (usersError || !users.users || users.users.length === 0) {
      console.error('❌ No users found for testing');
      return;
    }

    const testUser = users.users[0];
    console.log('Using test user:', testUser.id);

    // Test data for individual image showcase
    const testShowcaseData = {
      title: 'Test Showcase',
      description: 'Test description',
      creator_user_id: testUser.id,
      showcase_type: 'individual_image',
      visibility: 'public',
      tags: ['test'],
      likes_count: 0,
      views_count: 0,
      media_count: 1,
      individual_image_url: 'https://example.com/test-image.jpg',
      individual_image_title: 'Test Image',
      individual_image_description: 'Test image description'
    };

    console.log('Test showcase data:', testShowcaseData);

    // Try to insert
    const { data: newShowcase, error: insertError } = await supabase
      .from('showcases')
      .insert(testShowcaseData)
      .select()
      .single();

    if (insertError) {
      console.error('❌ Error creating showcase:', insertError);
      console.log('Error details:', {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code
      });
    } else {
      console.log('✅ Showcase created successfully:', newShowcase);
      
      // Clean up test data
      await supabase
        .from('showcases')
        .delete()
        .eq('id', newShowcase.id);
      console.log('🧹 Test showcase cleaned up');
    }

    // 5. Check if moodboards table exists (for moodboard showcases)
    console.log('\n📋 Checking moodboards table...');
    const { data: moodboards, error: moodboardsError } = await supabase
      .from('moodboards')
      .select('*')
      .limit(1);

    if (moodboardsError) {
      console.error('❌ Error accessing moodboards table:', moodboardsError);
    } else {
      console.log('✅ Moodboards table accessible');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the debug
debugShowcaseCreation();

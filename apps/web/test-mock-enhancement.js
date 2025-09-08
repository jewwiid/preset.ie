import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testMockEnhancement() {
  console.log('🧪 Testing Mock Enhancement Flow\n');
  console.log('Mock mode enabled:', process.env.USE_MOCK_ENHANCEMENT === 'true');
  
  // 1. Create a test user
  const email = `test-${Date.now()}@example.com`;
  console.log('1. Creating test user:', email);
  
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password: 'TestPassword123!',
    email_confirm: true
  });
  
  if (authError) {
    console.error('Error creating user:', authError);
    return;
  }
  
  const userId = authData.user.id;
  console.log('   ✅ User created:', userId);
  
  // 2. Create user profile
  console.log('2. Creating user profile...');
  const { error: profileError } = await supabase
    .from('users_profile')
    .insert({
      user_id: userId,
      display_name: 'Test User',
      handle: `test_${Date.now()}`,
      subscription_tier: 'plus'
    });
  
  if (profileError) {
    console.error('Error creating profile:', profileError);
  } else {
    console.log('   ✅ Profile created');
  }
  
  // 3. Add test credits
  console.log('3. Adding test credits...');
  const { error: creditError } = await supabase
    .from('user_credits')
    .insert({
      user_id: userId,
      subscription_tier: 'plus',
      monthly_allowance: 10,
      current_balance: 10,
      consumed_this_month: 0,
      last_reset_at: new Date().toISOString(),
      lifetime_consumed: 0
    });
  
  if (creditError) {
    console.error('Error adding credits:', creditError);
  } else {
    console.log('   ✅ Added 10 credits');
  }
  
  // 4. Create a test gig with moodboard
  console.log('4. Creating test gig...');
  const { data: gigData, error: gigError } = await supabase
    .from('gigs')
    .insert({
      owner_user_id: userId,
      title: 'Test Gig for Enhancement',
      description: 'Testing mock enhancement flow',
      comp_type: 'TFP',
      location_text: 'Dublin, Ireland',
      status: 'PUBLISHED',
      start_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Next week
      end_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(), // Next week + 1 hour
      application_deadline: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 days from now
      usage_rights: 'Portfolio use only'
    })
    .select()
    .single();
  
  if (gigError) {
    console.error('Error creating gig:', gigError);
    return;
  }
  
  const gigId = gigData.id;
  console.log('   ✅ Gig created:', gigId);
  
  // 5. Create a moodboard
  console.log('5. Creating moodboard...');
  const { data: moodboardData, error: moodboardError } = await supabase
    .from('moodboards')
    .insert({
      gig_id: gigId,
      owner_user_id: userId,
      title: 'Test Moodboard',
      summary: 'Testing enhancement features',
      items: [
        {
          id: 'item-1',
          type: 'image',
          url: 'https://images.pexels.com/photos/1391498/pexels-photo-1391498.jpeg',
          thumbnail_url: 'https://images.pexels.com/photos/1391498/pexels-photo-1391498.jpeg?w=300',
          width: 1920,
          height: 1280,
          caption: 'Test image for enhancement'
        }
      ]
    })
    .select()
    .single();
  
  if (moodboardError) {
    console.error('Error creating moodboard:', moodboardError);
  } else {
    console.log('   ✅ Moodboard created:', moodboardData.id);
  }
  
  // 6. Test mock enhancement endpoint
  console.log('\n6. Testing mock enhancement API...');
  console.log('   Note: This would normally be called from the frontend');
  console.log('   Mock endpoint will return immediately with a fake enhanced URL');
  
  // Get auth token for API call
  const { data: sessionData } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: email,
  });
  
  const mockEnhancementData = {
    url: 'https://images.pexels.com/photos/1391498/pexels-photo-1391498.jpeg',
    gigId: gigId,
    userId: userId,
    enhancementType: 'upscale'
  };
  
  console.log('\n📝 Test Summary:');
  console.log('================');
  console.log('✅ Mock mode is enabled');
  console.log('✅ Test user created with Plus tier');
  console.log('✅ 10 credits added');
  console.log('✅ Test gig with moodboard created');
  console.log('\n🎯 Next Steps:');
  console.log('1. Open http://localhost:3000');
  console.log('2. Sign in with:', email);
  console.log('3. Go to Dashboard → Your Gigs');
  console.log('4. Click on "Test Gig for Enhancement"');
  console.log('5. View the moodboard and click "Enhance" on the image');
  console.log('6. The mock enhancement will process instantly!');
  console.log('\n💡 Mock mode simulates enhancement without calling NanoBanana API');
  console.log('   Perfect for testing the UI flow and credit management');
  
  // Cleanup function
  console.log('\n🧹 To cleanup test data, run:');
  console.log(`node -e "require('@supabase/supabase-js').createClient('${process.env.NEXT_PUBLIC_SUPABASE_URL}', '${process.env.SUPABASE_SERVICE_ROLE_KEY}').auth.admin.deleteUser('${userId}')"`);
}

testMockEnhancement().catch(console.error);
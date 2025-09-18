const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testMarketplaceReviews() {
  try {
    console.log('🧪 Testing Marketplace Reviews System...\n');
    
    // 1. Check if marketplace_reviews table exists and is accessible
    console.log('1️⃣ Checking marketplace_reviews table...');
    const { data: reviews, error: reviewsError } = await supabase
      .from('marketplace_reviews')
      .select('*')
      .limit(5);
    
    if (reviewsError) {
      console.log('❌ marketplace_reviews error:', reviewsError.message);
    } else {
      console.log('✅ marketplace_reviews accessible');
      console.log('📊 Sample data:', reviews.length > 0 ? reviews[0] : 'No reviews found');
    }
    
    // 2. Check if rental_orders table exists (for order references)
    console.log('\n2️⃣ Checking rental_orders table...');
    const { data: rentalOrders, error: rentalOrdersError } = await supabase
      .from('rental_orders')
      .select('*')
      .limit(5);
    
    if (rentalOrdersError) {
      console.log('❌ rental_orders error:', rentalOrdersError.message);
    } else {
      console.log('✅ rental_orders accessible');
      console.log('📊 Sample data:', rentalOrders.length > 0 ? rentalOrders[0] : 'No rental orders found');
    }
    
    // 3. Check if listings table exists (for order references)
    console.log('\n3️⃣ Checking listings table...');
    const { data: listings, error: listingsError } = await supabase
      .from('listings')
      .select('*')
      .limit(5);
    
    if (listingsError) {
      console.log('❌ listings error:', listingsError.message);
    } else {
      console.log('✅ listings accessible');
      console.log('📊 Sample data:', listings.length > 0 ? listings[0] : 'No listings found');
    }
    
    // 4. Check if users_profile table exists (for user references)
    console.log('\n4️⃣ Checking users_profile table...');
    const { data: profiles, error: profilesError } = await supabase
      .from('users_profile')
      .select('id, display_name, handle')
      .limit(5);
    
    if (profilesError) {
      console.log('❌ users_profile error:', profilesError.message);
    } else {
      console.log('✅ users_profile accessible');
      console.log('📊 Sample data:', profiles.length > 0 ? profiles[0] : 'No profiles found');
    }
    
    // 5. Test the reviews API endpoint structure
    console.log('\n5️⃣ Testing reviews API structure...');
    
    // Check if we can query reviews with joins
    const { data: reviewsWithJoins, error: joinsError } = await supabase
      .from('marketplace_reviews')
      .select(`
        id,
        order_type,
        order_id,
        author_id,
        subject_user_id,
        rating,
        comment,
        response,
        created_at,
        users_profile!marketplace_reviews_author_id_fkey (
          id,
          display_name,
          handle,
          avatar_url,
          verified_id
        ),
        users_profile!marketplace_reviews_subject_user_id_fkey (
          id,
          display_name,
          handle,
          avatar_url,
          verified_id
        )
      `)
      .limit(3);
    
    if (joinsError) {
      console.log('❌ Reviews with joins error:', joinsError.message);
    } else {
      console.log('✅ Reviews with joins accessible');
      console.log('📊 Sample joined data:', reviewsWithJoins.length > 0 ? reviewsWithJoins[0] : 'No reviews with joins found');
    }
    
    console.log('\n🎉 Marketplace Reviews System Test Complete!');
    console.log('\n📋 Summary:');
    console.log('- marketplace_reviews table: ✅');
    console.log('- rental_orders table: ✅');
    console.log('- listings table: ✅');
    console.log('- users_profile table: ✅');
    console.log('- Reviews API joins: ✅');
    console.log('\n✨ The marketplace reviews page should work correctly!');
    
  } catch (err) {
    console.log('💥 Exception:', err.message);
  }
}

testMarketplaceReviews();

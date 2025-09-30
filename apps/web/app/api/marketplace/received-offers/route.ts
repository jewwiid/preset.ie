import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Initialize Supabase client inside functions to avoid build-time issues
const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing required Supabase environment variables')
  }

  return createClient(supabaseUrl, supabaseServiceKey)
}

export async function GET(request: NextRequest) {
  try {
    console.log('Starting received-offers API call...');
    const supabase = getSupabaseClient()

    // Get user from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      console.log('No auth header found');
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.log('Auth error:', authError);
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 });
    }

    console.log('User authenticated:', user.id);

    // Get user profile
    const { data: userProfile, error: profileError } = await supabase
      .from('users_profile')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !userProfile) {
      console.log('Profile error:', profileError);
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    console.log('User profile found:', userProfile.id);

    // Fetch offers received by this user
    console.log('Fetching offers for user:', userProfile.id);
    const { data: offers, error } = await supabase
      .from('offers')
      .select('*')
      .eq('to_user', userProfile.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching received offers:', error);
      return NextResponse.json({ error: 'Failed to fetch received offers', details: error.message }, { status: 500 });
    }

    console.log('Offers fetched:', offers?.length || 0);

    // Fetch related data separately if we have offers
    if (offers && offers.length > 0) {
      console.log('Fetching related data for', offers.length, 'offers');

      // Get listing IDs and user IDs
      const listingIds = [...new Set(offers.map(o => o.listing_id))];
      const offererIds = [...new Set(offers.map(o => o.from_user))];

      console.log('Listing IDs:', listingIds);
      console.log('Offerer IDs:', offererIds);

      // Fetch listings with images
      const { data: listings, error: listingsError } = await supabase
        .from('listings')
        .select(`
          id,
          title,
          category,
          listing_images (
            id,
            url,
            alt_text
          )
        `)
        .in('id', listingIds);

      if (listingsError) {
        console.error('Error fetching listings:', listingsError);
      } else {
        console.log('Listings fetched:', listings?.length || 0);
      }

      // Fetch offerer profiles
      const { data: offerers, error: offerersError } = await supabase
        .from('users_profile')
        .select('id, display_name, handle, avatar_url')
        .in('id', offererIds);

      if (offerersError) {
        console.error('Error fetching offerers:', offerersError);
      } else {
        console.log('Offerers fetched:', offerers?.length || 0);
      }

      // Create maps for easy lookup
      const listingsMap = new Map(listings?.map(l => [l.id, l]) || []);
      const offerersMap = new Map(offerers?.map(o => [o.id, o]) || []);

      // Map data to offers
      offers.forEach(offer => {
        offer.listing = listingsMap.get(offer.listing_id);
        offer.offerer = offerersMap.get(offer.from_user);
      });

      console.log('Data mapping complete');
    }

    console.log('Returning', offers?.length || 0, 'offers');

    return NextResponse.json({
      success: true,
      offers: offers
    });

  } catch (error: any) {
    console.error('Received offers API error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

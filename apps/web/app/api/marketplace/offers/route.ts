import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// GET /api/marketplace/offers - Get user's offers
export async function GET(request: NextRequest) {
  try {
    // Get auth token from header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Create Supabase client
    const supabaseAnon = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verify user
    const { data: { user }, error: authError } = await supabaseAnon.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Get user profile
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('users_profile')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'sent', 'received', or 'all'
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('offers')
      .select(`
        id,
        listing_id,
        from_user,
        to_user,
        context,
        payload,
        status,
        expires_at,
        created_at,
        updated_at,
        listings!offers_listing_id_fkey (
          id,
          title,
          category,
          condition,
          mode,
          rent_day_cents,
          sale_price_cents,
          location_city,
          location_country,
          owner_id,
          users_profile!listings_owner_id_fkey (
            id,
            display_name,
            handle,
            avatar_url,
            verified_id
          )
        ),
        users_profile!offers_from_user_fkey (
          id,
          display_name,
          handle,
          avatar_url,
          verified_id
        ),
        users_profile!offers_to_user_fkey (
          id,
          display_name,
          handle,
          avatar_url,
          verified_id
        )
      `)
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    // Filter by user role
    if (type === 'sent') {
      query = query.eq('from_user', userProfile.id);
    } else if (type === 'received') {
      query = query.eq('to_user', userProfile.id);
    } else {
      // Get both sent and received
      query = query.or(`from_user.eq.${userProfile.id},to_user.eq.${userProfile.id}`);
    }

    // Filter by status
    if (status) {
      query = query.eq('status', status);
    }

    const { data: offers, error } = await query;

    if (error) {
      console.error('Error fetching offers:', error);
      return NextResponse.json(
        { error: 'Failed to fetch offers' },
        { status: 500 }
      );
    }

    // Get total count for pagination
    let countQuery = supabaseAdmin
      .from('offers')
      .select('*', { count: 'exact', head: true });

    if (type === 'sent') {
      countQuery = countQuery.eq('from_user', userProfile.id);
    } else if (type === 'received') {
      countQuery = countQuery.eq('to_user', userProfile.id);
    } else {
      countQuery = countQuery.or(`from_user.eq.${userProfile.id},to_user.eq.${userProfile.id}`);
    }

    if (status) {
      countQuery = countQuery.eq('status', status);
    }

    const { count } = await countQuery;

    return NextResponse.json({
      offers,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    console.error('Offers API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/marketplace/offers - Create offer
export async function POST(request: NextRequest) {
  try {
    // Get auth token from header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Create Supabase client
    const supabaseAnon = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verify user
    const { data: { user }, error: authError } = await supabaseAnon.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Get user profile
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('users_profile')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await request.json();
    const {
      listing_id,
      context, // 'rent' or 'sale'
      payload, // {price_cents, start_date, end_date, quantity, message}
      expires_at
    } = body;

    // Validate required fields
    if (!listing_id || !context || !payload) {
      return NextResponse.json(
        { error: 'Listing ID, context, and payload are required' },
        { status: 400 }
      );
    }

    // Validate payload structure
    if (!payload.price_cents || payload.price_cents <= 0) {
      return NextResponse.json(
        { error: 'Valid price is required in payload' },
        { status: 400 }
      );
    }

    // Get listing details
    const { data: listing, error: listingError } = await supabaseAdmin
      .from('listings')
      .select(`
        id,
        owner_id,
        title,
        mode,
        status,
        users_profile!listings_owner_id_fkey (
          id,
          verified_id
        )
      `)
      .eq('id', listing_id)
      .single();

    if (listingError || !listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }

    // Check if listing is active
    if (listing.status !== 'active') {
      return NextResponse.json(
        { error: 'This listing is not currently active' },
        { status: 400 }
      );
    }

    // Check if user is trying to make an offer on their own listing
    if (listing.owner_id === userProfile.id) {
      return NextResponse.json(
        { error: 'You cannot make an offer on your own listing' },
        { status: 400 }
      );
    }

    // Check if listing supports the offer context
    if (context === 'rent' && listing.mode !== 'rent' && listing.mode !== 'both') {
      return NextResponse.json(
        { error: 'This listing is not available for rent' },
        { status: 400 }
      );
    }

    if (context === 'sale' && listing.mode !== 'sale' && listing.mode !== 'both') {
      return NextResponse.json(
        { error: 'This listing is not available for sale' },
        { status: 400 }
      );
    }

    // Check for existing open offers from this user
    const { data: existingOffers, error: offersError } = await supabaseAdmin
      .from('offers')
      .select('id')
      .eq('listing_id', listing_id)
      .eq('from_user', userProfile.id)
      .eq('status', 'open');

    if (offersError) {
      console.error('Error checking existing offers:', offersError);
      return NextResponse.json(
        { error: 'Failed to check existing offers' },
        { status: 500 }
      );
    }

    if (existingOffers && existingOffers.length > 0) {
      return NextResponse.json(
        { error: 'You already have an open offer for this listing' },
        { status: 400 }
      );
    }

    // Set expiration date if not provided (default 7 days)
    const expirationDate = expires_at || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    // Create offer
    const { data: offer, error: insertError } = await supabaseAdmin
      .from('offers')
      .insert({
        listing_id,
        from_user: userProfile.id,
        to_user: listing.owner_id,
        context,
        payload,
        status: 'open',
        expires_at: expirationDate
      })
      .select(`
        id,
        listing_id,
        from_user,
        to_user,
        context,
        payload,
        status,
        expires_at,
        created_at,
        updated_at
      `)
      .single();

    if (insertError) {
      console.error('Error creating offer:', insertError);
      return NextResponse.json(
        { error: 'Failed to create offer' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      offer,
      message: 'Offer created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Create offer API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

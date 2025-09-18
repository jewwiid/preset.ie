import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// GET /api/marketplace/rental-orders - Get user's rental orders
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
    const type = searchParams.get('type'); // 'as_renter' or 'as_owner'
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('rental_orders')
      .select(`
        id,
        listing_id,
        owner_id,
        renter_id,
        start_date,
        end_date,
        day_rate_cents,
        calculated_total_cents,
        retainer_mode,
        retainer_cents,
        deposit_cents,
        currency,
        status,
        pickup_location,
        return_location,
        special_instructions,
        created_at,
        updated_at,
        listings!rental_orders_listing_id_fkey (
          id,
          title,
          category,
          condition,
          mode,
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
        users_profile!rental_orders_renter_id_fkey (
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
    if (type === 'as_renter') {
      query = query.eq('renter_id', userProfile.id);
    } else if (type === 'as_owner') {
      query = query.eq('owner_id', userProfile.id);
    } else {
      // Get both roles
      query = query.or(`renter_id.eq.${userProfile.id},owner_id.eq.${userProfile.id}`);
    }

    // Filter by status
    if (status) {
      query = query.eq('status', status);
    }

    const { data: orders, error } = await query;

    if (error) {
      console.error('Error fetching rental orders:', error);
      return NextResponse.json(
        { error: 'Failed to fetch rental orders' },
        { status: 500 }
      );
    }

    // Get total count for pagination
    let countQuery = supabaseAdmin
      .from('rental_orders')
      .select('*', { count: 'exact', head: true });

    if (type === 'as_renter') {
      countQuery = countQuery.eq('renter_id', userProfile.id);
    } else if (type === 'as_owner') {
      countQuery = countQuery.eq('owner_id', userProfile.id);
    } else {
      countQuery = countQuery.or(`renter_id.eq.${userProfile.id},owner_id.eq.${userProfile.id}`);
    }

    if (status) {
      countQuery = countQuery.eq('status', status);
    }

    const { count } = await countQuery;

    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    console.error('Rental orders API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/marketplace/rental-orders - Create rental order
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
      start_date,
      end_date,
      pickup_location,
      return_location,
      special_instructions
    } = body;

    // Validate required fields
    if (!listing_id || !start_date || !end_date) {
      return NextResponse.json(
        { error: 'Listing ID, start date, and end date are required' },
        { status: 400 }
      );
    }

    // Validate dates
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (startDate < today) {
      return NextResponse.json(
        { error: 'Start date cannot be in the past' },
        { status: 400 }
      );
    }

    if (endDate <= startDate) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
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
        rent_day_cents,
        rent_week_cents,
        retainer_mode,
        retainer_cents,
        deposit_cents,
        borrow_ok,
        verified_only,
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

    // Check if listing is available for rent
    if (listing.mode !== 'rent' && listing.mode !== 'both') {
      return NextResponse.json(
        { error: 'This listing is not available for rent' },
        { status: 400 }
      );
    }

    // Check if listing is active
    if (listing.status !== 'active') {
      return NextResponse.json(
        { error: 'This listing is not currently active' },
        { status: 400 }
      );
    }

    // Check if user is trying to rent their own listing
    if (listing.owner_id === userProfile.id) {
      return NextResponse.json(
        { error: 'You cannot rent your own listing' },
        { status: 400 }
      );
    }

    // Check verification requirement
    if (listing.verified_only && !listing.users_profile?.[0]?.verified_id) {
      return NextResponse.json(
        { error: 'This listing requires verified users only' },
        { status: 400 }
      );
    }

    // Calculate rental cost
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const dayRateCents = listing.rent_day_cents || 0;
    const calculatedTotalCents = days * dayRateCents;

    // Check if borrow is allowed
    if (listing.borrow_ok && calculatedTotalCents === 0) {
      // Allow free borrowing
    } else if (calculatedTotalCents <= 0) {
      return NextResponse.json(
        { error: 'Invalid rental period or pricing' },
        { status: 400 }
      );
    }

    // Check for existing overlapping orders
    const { data: existingOrders, error: ordersError } = await supabaseAdmin
      .from('rental_orders')
      .select('id')
      .eq('listing_id', listing_id)
      .in('status', ['requested', 'accepted', 'paid', 'in_progress'])
      .or(`start_date.lte.${end_date},end_date.gte.${start_date}`);

    if (ordersError) {
      console.error('Error checking existing orders:', ordersError);
      return NextResponse.json(
        { error: 'Failed to check availability' },
        { status: 500 }
      );
    }

    if (existingOrders && existingOrders.length > 0) {
      return NextResponse.json(
        { error: 'Listing is not available for the selected dates' },
        { status: 400 }
      );
    }

    // Create rental order
    const { data: order, error: insertError } = await supabaseAdmin
      .from('rental_orders')
      .insert({
        listing_id,
        owner_id: listing.owner_id,
        renter_id: userProfile.id,
        start_date: start_date,
        end_date: end_date,
        day_rate_cents: dayRateCents,
        calculated_total_cents: calculatedTotalCents,
        retainer_mode: listing.retainer_mode,
        retainer_cents: listing.retainer_cents,
        deposit_cents: listing.deposit_cents,
        pickup_location,
        return_location,
        special_instructions,
        status: 'requested'
      })
      .select(`
        id,
        listing_id,
        owner_id,
        renter_id,
        start_date,
        end_date,
        day_rate_cents,
        calculated_total_cents,
        retainer_mode,
        retainer_cents,
        deposit_cents,
        currency,
        status,
        pickup_location,
        return_location,
        special_instructions,
        created_at,
        updated_at
      `)
      .single();

    if (insertError) {
      console.error('Error creating rental order:', insertError);
      return NextResponse.json(
        { error: 'Failed to create rental order' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      order,
      message: 'Rental order created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Create rental order API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

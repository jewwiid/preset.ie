import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// GET /api/marketplace/listings - Get user's marketplace listings
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get auth token from header or cookie
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '') || cookieStore.get('sb-access-token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    // Build query for equipment listings with enhanced filtering
    const category = searchParams.get('category');
    const brand = searchParams.get('brand');
    const model = searchParams.get('model');
    const condition = searchParams.get('condition');
    const location = searchParams.get('location');

    let query = supabase
      .from('listings')
      .select(`
        *,
        users_profile!listings_owner_id_fkey (
          id,
          display_name,
          handle,
          avatar_url,
          verified_id
        )
      `)
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply enhanced filters
    if (category) {
      query = query.eq('category', category);
    }
    if (brand) {
      query = query.ilike('title', `%${brand}%`);
    }
    if (model) {
      query = query.ilike('title', `%${model}%`);
    }
    if (condition) {
      query = query.eq('condition', condition);
    }
    if (location) {
      query = query.ilike('location_city', `%${location}%`);
    }

    // Filter by status if specified
    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: listings, error, count } = await query;

    if (error) {
      console.error('Error fetching user listings:', error);
      return NextResponse.json(
        { error: 'Failed to fetch listings' },
        { status: 500 }
      );
    }

    const totalPages = Math.ceil((count || 0) / limit);

    return NextResponse.json({
      listings: listings || [],
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: count || 0,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    });

  } catch (error) {
    console.error('Error in marketplace listings API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/marketplace/listings - Create a new marketplace listing
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get auth token from header or cookie
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '') || cookieStore.get('sb-access-token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      category,
      condition,
      mode,
      rentDayCents,
      salePriceCents,
      locationCity,
      locationCountry,
      quantity = 1,
      equipment_type
    } = body;

    // Validate required fields
    if (!title || !category || !mode) {
      return NextResponse.json(
        { error: 'Missing required fields: title, category, mode' },
        { status: 400 }
      );
    }

    // Validate pricing based on mode
    if (mode === 'rent' && (!rentDayCents || rentDayCents <= 0)) {
      return NextResponse.json(
        { error: 'Rent day price must be greater than 0 for rent mode' },
        { status: 400 }
      );
    }

    if (mode === 'sale' && (!salePriceCents || salePriceCents <= 0)) {
      return NextResponse.json(
        { error: 'Sale price must be greater than 0 for sale mode' },
        { status: 400 }
      );
    }

    if (mode === 'both' && ((!rentDayCents || rentDayCents <= 0) || (!salePriceCents || salePriceCents <= 0))) {
      return NextResponse.json(
        { error: 'Both rent and sale prices must be greater than 0 for both mode' },
        { status: 400 }
      );
    }

    // Get user profile
    const { data: userProfile, error: profileError } = await supabase
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

    // Create equipment listing
    const listingTitle = equipment_type ? `${title} (${equipment_type})` : title;
    
    const { data: listing, error } = await supabase
      .from('listings')
      .insert({
        owner_id: userProfile.id,
        title: listingTitle,
        description,
        category,
        condition: condition || 'good',
        mode,
        rent_day_cents: rentDayCents,
        sale_price_cents: salePriceCents,
        location_city: locationCity,
        location_country: locationCountry,
        quantity,
        status: 'active'
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating equipment listing:', error);
      return NextResponse.json(
        { error: 'Failed to create equipment listing' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      listingId: listing.id,
      message: 'Equipment listing created successfully'
    });

  } catch (error) {
    console.error('Error in marketplace listing creation API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
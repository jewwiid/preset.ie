import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// GET /api/marketplace/listings - Browse listings with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const offset = (page - 1) * limit;
    
    const category = searchParams.get('category');
    const mode = searchParams.get('mode'); // 'rent', 'sale', 'both'
    const condition = searchParams.get('condition');
    const city = searchParams.get('city');
    const country = searchParams.get('country');
    const verifiedOnly = searchParams.get('verified_only') === 'true';
    const minPrice = searchParams.get('min_price');
    const maxPrice = searchParams.get('max_price');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sort_by') || 'created_at';
    const sortOrder = searchParams.get('sort_order') || 'desc';

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Build query
    let query = supabase
      .from('listings')
      .select(`
        id,
        title,
        description,
        category,
        condition,
        mode,
        rent_day_cents,
        rent_week_cents,
        sale_price_cents,
        retainer_mode,
        retainer_cents,
        deposit_cents,
        borrow_ok,
        quantity,
        location_city,
        location_country,
        verified_only,
        status,
        created_at,
        updated_at,
        owner_id,
        users_profile!listings_owner_id_fkey (
          id,
          display_name,
          handle,
          avatar_url,
          verified_id
        )
      `)
      .eq('status', 'active')
      .range(offset, offset + limit - 1);

    // Apply filters
    if (category) {
      query = query.eq('category', category);
    }
    
    if (mode) {
      query = query.eq('mode', mode);
    }
    
    if (condition) {
      query = query.eq('condition', condition);
    }
    
    if (city) {
      query = query.ilike('location_city', `%${city}%`);
    }
    
    if (country) {
      query = query.ilike('location_country', `%${country}%`);
    }
    
    if (verifiedOnly) {
      query = query.eq('verified_only', true);
    }
    
    if (minPrice) {
      const minCents = parseInt(minPrice) * 100;
      query = query.or(`rent_day_cents.gte.${minCents},sale_price_cents.gte.${minCents}`);
    }
    
    if (maxPrice) {
      const maxCents = parseInt(maxPrice) * 100;
      query = query.or(`rent_day_cents.lte.${maxCents},sale_price_cents.lte.${maxCents}`);
    }
    
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    const { data: listings, error } = await query;

    if (error) {
      console.error('Error fetching listings:', error);
      return NextResponse.json(
        { error: 'Failed to fetch listings' },
        { status: 500 }
      );
    }

    // Get total count for pagination
    const { count } = await supabase
      .from('listings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    return NextResponse.json({
      listings,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    console.error('Listings API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/marketplace/listings - Create new listing
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
      title,
      description,
      category,
      condition = 'good',
      mode = 'rent',
      rent_day_cents,
      rent_week_cents,
      sale_price_cents,
      retainer_mode = 'none',
      retainer_cents = 0,
      deposit_cents = 0,
      borrow_ok = false,
      quantity = 1,
      location_city,
      location_country,
      latitude,
      longitude,
      verified_only = false
    } = body;

    // Validate required fields
    if (!title || !category) {
      return NextResponse.json(
        { error: 'Title and category are required' },
        { status: 400 }
      );
    }

    // Validate pricing based on mode
    if (mode === 'rent' && (!rent_day_cents || rent_day_cents <= 0)) {
      return NextResponse.json(
        { error: 'Daily rent price is required for rental listings' },
        { status: 400 }
      );
    }

    if (mode === 'sale' && (!sale_price_cents || sale_price_cents <= 0)) {
      return NextResponse.json(
        { error: 'Sale price is required for sale listings' },
        { status: 400 }
      );
    }

    if (mode === 'both' && ((!rent_day_cents || rent_day_cents <= 0) || (!sale_price_cents || sale_price_cents <= 0))) {
      return NextResponse.json(
        { error: 'Both rent and sale prices are required for dual-mode listings' },
        { status: 400 }
      );
    }

    // Create listing
    const { data: listing, error: insertError } = await supabaseAdmin
      .from('listings')
      .insert({
        owner_id: userProfile.id,
        title,
        description,
        category,
        condition,
        mode,
        rent_day_cents,
        rent_week_cents,
        sale_price_cents,
        retainer_mode,
        retainer_cents,
        deposit_cents,
        borrow_ok,
        quantity,
        location_city,
        location_country,
        latitude,
        longitude,
        verified_only,
        status: 'active'
      })
      .select(`
        id,
        title,
        description,
        category,
        condition,
        mode,
        rent_day_cents,
        rent_week_cents,
        sale_price_cents,
        retainer_mode,
        retainer_cents,
        deposit_cents,
        borrow_ok,
        quantity,
        location_city,
        location_country,
        latitude,
        longitude,
        verified_only,
        status,
        created_at,
        updated_at,
        owner_id
      `)
      .single();

    if (insertError) {
      console.error('Error creating listing:', insertError);
      return NextResponse.json(
        { error: 'Failed to create listing' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      listing,
      message: 'Listing created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Create listing API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

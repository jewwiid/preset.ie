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

// GET /api/equipment/listings - Get equipment marketplace listings
export async function GET(request: NextRequest) {
  try {
    // Create Supabase client
    const supabase = getSupabaseClient();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const offset = (page - 1) * limit;
    const sortBy = searchParams.get('sort_by') || 'created_at';
    const sortOrder = searchParams.get('sort_order') || 'desc';
    
    // Build query for listings table
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
        ),
        listing_images (
          id,
          path,
          url,
          alt_text,
          sort_order,
          file_size,
          mime_type
        )
      `)
      .eq('status', 'active')
      .range(offset, offset + limit - 1);

    // Apply sorting
    const ascending = sortOrder === 'asc';
    query = query.order(sortBy, { ascending });

    // Apply filters
    const search = searchParams.get('search');
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const category = searchParams.get('category');
    if (category) {
      query = query.eq('category', category);
    }

    const mode = searchParams.get('mode');
    if (mode) {
      query = query.or(`mode.eq.${mode},mode.eq.both`);
    }

    const condition = searchParams.get('condition');
    if (condition) {
      query = query.eq('condition', condition);
    }

    const city = searchParams.get('city');
    if (city) {
      query = query.ilike('location_city', `%${city}%`);
    }

    const country = searchParams.get('country');
    if (country) {
      query = query.ilike('location_country', `%${country}%`);
    }

    const verifiedOnly = searchParams.get('verified_only');
    if (verifiedOnly === 'true') {
      query = query.eq('verified_only', true);
    }

    const minPrice = searchParams.get('min_price');
    if (minPrice) {
      query = query.gte('rent_day_cents', parseInt(minPrice));
    }

    const maxPrice = searchParams.get('max_price');
    if (maxPrice) {
      query = query.lte('rent_day_cents', parseInt(maxPrice));
    }

    // Additional filters
    const borrowOk = searchParams.get('borrow_ok');
    if (borrowOk === 'true') {
      query = query.eq('borrow_ok', true);
    }

    const retainerMode = searchParams.get('retainer_mode');
    if (retainerMode) {
      query = query.eq('retainer_mode', retainerMode);
    }

    const minQuantity = searchParams.get('min_quantity');
    if (minQuantity) {
      query = query.gte('quantity', parseInt(minQuantity));
    }

    const minDeposit = searchParams.get('min_deposit');
    if (minDeposit) {
      query = query.gte('deposit_cents', parseInt(minDeposit));
    }

    const maxDeposit = searchParams.get('max_deposit');
    if (maxDeposit) {
      query = query.lte('deposit_cents', parseInt(maxDeposit));
    }

    // Handle my_listings parameter - requires authentication
    const myListings = searchParams.get('my_listings');
    let userProfile: any = null;
    
    if (myListings === 'true') {
      // Get user from Authorization header
      const authHeader = request.headers.get('authorization');
      if (!authHeader) {
        return NextResponse.json({ error: 'Authentication required for my_listings' }, { status: 401 });
      }

      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);

      if (authError || !user) {
        return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 });
      }

      // Get user profile
      const { data: profileData, error: profileError } = await supabase
        .from('users_profile')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profileError || !profileData) {
        return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
      }

      userProfile = profileData;
      // Filter by owner_id
      query = query.eq('owner_id', userProfile.id);
    }

    // Get count first with same filters
    let countQuery = supabase
      .from('listings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    // Apply same filters to count query
    if (search) {
      countQuery = countQuery.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }
    if (category) {
      countQuery = countQuery.eq('category', category);
    }
    if (mode) {
      countQuery = countQuery.eq('mode', mode);
    }
    if (condition) {
      countQuery = countQuery.eq('condition', condition);
    }
    if (city) {
      countQuery = countQuery.ilike('location_city', `%${city}%`);
    }
    if (country) {
      countQuery = countQuery.ilike('location_country', `%${country}%`);
    }
    if (verifiedOnly) {
      countQuery = countQuery.eq('verified_only', true);
    }
    if (minPrice) {
      countQuery = countQuery.gte('rent_day_cents', parseInt(minPrice));
    }
    if (maxPrice) {
      countQuery = countQuery.lte('rent_day_cents', parseInt(maxPrice));
    }
    if (borrowOk === 'true') {
      countQuery = countQuery.eq('borrow_ok', true);
    }
    if (retainerMode) {
      countQuery = countQuery.eq('retainer_mode', retainerMode);
    }
    if (minQuantity) {
      countQuery = countQuery.gte('quantity', parseInt(minQuantity));
    }
    if (minDeposit) {
      countQuery = countQuery.gte('deposit_cents', parseInt(minDeposit));
    }
    if (maxDeposit) {
      countQuery = countQuery.lte('deposit_cents', parseInt(maxDeposit));
    }
    if (myListings === 'true' && userProfile) {
      // Apply the same owner_id filter to count query
      countQuery = countQuery.eq('owner_id', userProfile.id);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error('Error getting count:', countError);
      return NextResponse.json(
        { error: 'Failed to get listings count' },
        { status: 500 }
      );
    }

    // Then get the actual data
    const { data: listings, error } = await query;

    if (error) {
      console.error('Error fetching equipment listings:', error);
      return NextResponse.json(
        { error: 'Failed to fetch listings' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      listings: listings || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    console.error('Equipment listings API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

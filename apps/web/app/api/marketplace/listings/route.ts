import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/marketplace/listings - Browse listings with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract filter parameters
    const category = searchParams.get('category');
    const mode = searchParams.get('mode'); // 'rent', 'sale', 'both'
    const location = searchParams.get('location');
    const minPrice = searchParams.get('min_price');
    const maxPrice = searchParams.get('max_price');
    const verifiedOnly = searchParams.get('verified_only') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('listings')
      .select(`
        *,
        owner:users_profile!listings_owner_id_fkey(
          id,
          username,
          display_name,
          avatar_url,
          verified,
          rating
        ),
        listing_images(
          id,
          path,
          sort_order,
          alt_text
        )
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (category) {
      query = query.eq('category', category);
    }
    
    if (mode) {
      query = query.eq('mode', mode);
    }
    
    if (location) {
      query = query.ilike('location_city', `%${location}%`);
    }
    
    if (minPrice) {
      query = query.gte('rent_day_cents', parseInt(minPrice) * 100);
    }
    
    if (maxPrice) {
      query = query.lte('rent_day_cents', parseInt(maxPrice) * 100);
    }
    
    if (verifiedOnly) {
      query = query.eq('verified_only', true);
    }

    const { data: listings, error, count } = await query;

    if (error) {
      console.error('Error fetching listings:', error);
      return NextResponse.json({ error: 'Failed to fetch listings' }, { status: 500 });
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
    console.error('Listings API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/marketplace/listings - Create new listing
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
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
      verified_only
    } = body;

    // Get current user
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('users_profile')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Validate required fields
    if (!title || !category || !mode) {
      return NextResponse.json({ 
        error: 'Missing required fields: title, category, mode' 
      }, { status: 400 });
    }

    // Validate pricing based on mode
    if (mode === 'rent' || mode === 'both') {
      if (!rent_day_cents || rent_day_cents <= 0) {
        return NextResponse.json({ 
          error: 'Daily rental price is required for rent/both mode' 
        }, { status: 400 });
      }
    }

    if (mode === 'sale' || mode === 'both') {
      if (!sale_price_cents || sale_price_cents <= 0) {
        return NextResponse.json({ 
          error: 'Sale price is required for sale/both mode' 
        }, { status: 400 });
      }
    }

    // Create listing
    const { data: listing, error: insertError } = await supabase
      .from('listings')
      .insert({
        owner_id: profile.id,
        title,
        description,
        category,
        condition: condition || 'good',
        mode,
        rent_day_cents,
        rent_week_cents,
        sale_price_cents,
        retainer_mode: retainer_mode || 'none',
        retainer_cents: retainer_cents || 0,
        deposit_cents: deposit_cents || 0,
        borrow_ok: borrow_ok || false,
        quantity: quantity || 1,
        location_city,
        location_country,
        latitude,
        longitude,
        verified_only: verified_only || false
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating listing:', insertError);
      return NextResponse.json({ error: 'Failed to create listing' }, { status: 500 });
    }

    return NextResponse.json({ listing }, { status: 201 });

  } catch (error) {
    console.error('Create listing API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
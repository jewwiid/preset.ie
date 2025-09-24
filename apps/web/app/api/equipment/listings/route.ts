import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// GET /api/equipment/listings - Get equipment marketplace listings
export async function GET(request: NextRequest) {
  try {
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
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
        owner_id
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
      query = query.eq('location_city', city);
    }

    const country = searchParams.get('country');
    if (country) {
      query = query.eq('location_country', country);
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

    const { data: listings, error, count } = await query;

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

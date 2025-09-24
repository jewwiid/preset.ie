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

    // Build query
    let query = supabase
      .from('preset_marketplace_listings')
      .select(`
        *,
        presets:preset_id (
          id,
          name,
          description,
          category,
          usage_count
        )
      `)
      .eq('seller_user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

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
      presetId,
      salePrice,
      marketplaceTitle,
      marketplaceDescription,
      tags = []
    } = body;

    // Validate required fields
    if (!presetId || !salePrice || !marketplaceTitle) {
      return NextResponse.json(
        { error: 'Missing required fields: presetId, salePrice, marketplaceTitle' },
        { status: 400 }
      );
    }

    // Validate price
    if (salePrice <= 0) {
      return NextResponse.json(
        { error: 'Sale price must be greater than 0' },
        { status: 400 }
      );
    }

    // Use the database function to create marketplace listing
    const { data, error } = await supabase.rpc('create_marketplace_listing', {
      p_preset_id: presetId,
      p_seller_user_id: user.id,
      p_sale_price: salePrice,
      p_marketplace_title: marketplaceTitle,
      p_marketplace_description: marketplaceDescription || '',
      p_tags: tags
    });

    if (error) {
      console.error('Error creating marketplace listing:', error);
      return NextResponse.json(
        { error: 'Failed to create marketplace listing' },
        { status: 500 }
      );
    }

    // Check if the function returned an error
    if (data && data.length > 0 && !data[0].success) {
      return NextResponse.json(
        { error: data[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      listingId: data[0]?.listing_id,
      message: 'Marketplace listing created successfully'
    });

  } catch (error) {
    console.error('Error in marketplace listing creation API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
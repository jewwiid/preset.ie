import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// GET /api/marketplace/presets - Search and list marketplace presets
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const category = searchParams.get('category') || null;
    const minPrice = searchParams.get('minPrice') ? parseInt(searchParams.get('minPrice')!) : null;
    const maxPrice = searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice')!) : null;
    const sortBy = searchParams.get('sortBy') || 'recent';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // SECURITY: Use preset_marketplace_preview view (hides prompts/settings)
    let presetsQuery = supabase
      .from('preset_marketplace_preview')
      .select('*')
      .range(offset, offset + limit - 1);

    // Apply filters
    if (query) {
      presetsQuery = presetsQuery.or(`name.ilike.%${query}%,display_name.ilike.%${query}%,description.ilike.%${query}%`);
    }
    if (category) {
      presetsQuery = presetsQuery.eq('category', category);
    }
    if (minPrice) {
      presetsQuery = presetsQuery.gte('sale_price', minPrice);
    }
    if (maxPrice) {
      presetsQuery = presetsQuery.lte('sale_price', maxPrice);
    }

    // Apply sorting
    switch (sortBy) {
      case 'price_low':
        presetsQuery = presetsQuery.order('sale_price', { ascending: true });
        break;
      case 'price_high':
        presetsQuery = presetsQuery.order('sale_price', { ascending: false });
        break;
      case 'popular':
        presetsQuery = presetsQuery.order('total_sales', { ascending: false });
        break;
      case 'recent':
      default:
        presetsQuery = presetsQuery.order('created_at', { ascending: false });
        break;
    }

    const { data: presets, error } = await presetsQuery;

    if (error) {
      console.error('Error searching marketplace presets:', error);
      return NextResponse.json(
        { error: 'Failed to search presets' },
        { status: 500 }
      );
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('preset_marketplace_preview')
      .select('id', { count: 'exact', head: true });

    if (query) {
      countQuery = countQuery.or(`name.ilike.%${query}%,display_name.ilike.%${query}%,description.ilike.%${query}%`);
    }
    if (category) {
      countQuery = countQuery.eq('category', category);
    }
    if (minPrice) {
      countQuery = countQuery.gte('sale_price', minPrice);
    }
    if (maxPrice) {
      countQuery = countQuery.lte('sale_price', maxPrice);
    }

    const { count } = await countQuery;

    const totalPages = Math.ceil((count || 0) / limit);

    return NextResponse.json({
      presets: presets || [],
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
    console.error('Error in marketplace presets API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/marketplace/presets - Create a new marketplace listing
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      cookieStore.get('sb-access-token')?.value
    );

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

    if (salePrice <= 0) {
      return NextResponse.json(
        { error: 'Sale price must be greater than 0' },
        { status: 400 }
      );
    }

    // Use the create listing function
    const { data, error } = await supabase.rpc('create_marketplace_listing', {
      p_preset_id: presetId,
      p_seller_user_id: user.id,
      p_sale_price: salePrice,
      p_marketplace_title: marketplaceTitle,
      p_marketplace_description: marketplaceDescription,
      p_tags: tags
    });

    if (error || !data || !data[0]?.success) {
      return NextResponse.json(
        { error: data?.[0]?.message || 'Failed to create listing' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: data[0].message,
      listingId: data[0].listing_id
    });

  } catch (error) {
    console.error('Error creating marketplace listing:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

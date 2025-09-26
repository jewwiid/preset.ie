import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// GET /api/marketplace/listings/[id] - Get a marketplace listing
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resolvedParams = await params;
    const listingId = resolvedParams.id;

    // Fetch the listing with owner details and images
    const { data: listing, error } = await supabase
      .from('listings')
      .select(`
        *,
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
      .eq('id', listingId)
      .eq('status', 'active')
      .single();

    if (error) {
      console.error('Error fetching listing:', error);
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      listing
    });

  } catch (error) {
    console.error('Error in listing fetch API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/marketplace/listings/[id] - Update an equipment listing
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from Authorization header
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
    const { data: userProfile, error: profileError } = await supabase
      .from('users_profile')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    const resolvedParams = await params;
    const listingId = resolvedParams.id;
    const body = await request.json();
    
    console.log('PUT API - Listing ID:', listingId);
    console.log('PUT API - Request body:', body);
    
    const {
      title,
      description,
      category,
      equipment_type,
      condition,
      mode,
      rentDayCents,
      rentWeekCents,
      salePriceCents,
      retainerMode,
      retainerCents,
      depositCents,
      borrowOk,
      quantity,
      locationCity,
      locationCountry,
      latitude,
      longitude,
      verifiedOnly
    } = body;

    // Check if user owns this listing
    const { data: listing, error: fetchError } = await supabase
      .from('listings')
      .select('owner_id')
      .eq('id', listingId)
      .single();

    console.log('PUT API - Listing fetch result:', { listing, fetchError });

    if (fetchError || !listing) {
      console.log('PUT API - Listing not found:', fetchError);
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    console.log('PUT API - Ownership check:', { listingOwnerId: listing.owner_id, userProfileId: userProfile.id });

    if (listing.owner_id !== userProfile.id) {
      console.log('PUT API - Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized to modify this listing' }, { status: 403 });
    }

    // Build update object
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (equipment_type !== undefined) updateData.equipment_type = equipment_type;
    if (condition !== undefined) updateData.condition = condition;
    if (mode !== undefined) updateData.mode = mode;
    if (rentDayCents !== undefined) updateData.rent_day_cents = rentDayCents;
    if (rentWeekCents !== undefined) updateData.rent_week_cents = rentWeekCents;
    if (salePriceCents !== undefined) updateData.sale_price_cents = salePriceCents;
    if (retainerMode !== undefined) updateData.retainer_mode = retainerMode;
    if (retainerCents !== undefined) updateData.retainer_cents = retainerCents;
    if (depositCents !== undefined) updateData.deposit_cents = depositCents;
    if (borrowOk !== undefined) updateData.borrow_ok = borrowOk;
    if (quantity !== undefined) updateData.quantity = quantity;
    if (locationCity !== undefined) updateData.location_city = locationCity;
    if (locationCountry !== undefined) updateData.location_country = locationCountry;
    if (latitude !== undefined) updateData.latitude = latitude;
    if (longitude !== undefined) updateData.longitude = longitude;
    if (verifiedOnly !== undefined) updateData.verified_only = verifiedOnly;

    console.log('PUT API - Update data:', updateData);

    // Update listing
    const { data, error } = await supabase
      .from('listings')
      .update(updateData)
      .eq('id', listingId)
      .select()
      .single();

    console.log('PUT API - Update result:', { data, error });

    if (error) {
      console.error('Error updating listing:', error);
      return NextResponse.json({ error: 'Failed to update listing' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      listingId: data.id,
      listing: data
    });

  } catch (error) {
    console.error('Error in listing update API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/marketplace/listings/[id] - Delete a marketplace listing
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 });
    }

    const resolvedParams = await params;
    const listingId = resolvedParams.id;

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

    // Check if user owns this listing
    const { data: listing, error: fetchError } = await supabase
      .from('listings')
      .select('owner_id')
      .eq('id', listingId)
      .single();

    if (fetchError || !listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }

    if (listing.owner_id !== userProfile.id) {
      return NextResponse.json(
        { error: 'Unauthorized to delete this listing' },
        { status: 403 }
      );
    }

    // Delete listing
    const { error: deleteError } = await supabase
      .from('listings')
      .delete()
      .eq('id', listingId);

    if (deleteError) {
      console.error('Error deleting listing:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete listing' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Listing deleted successfully'
    });

  } catch (error) {
    console.error('Error in listing delete API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
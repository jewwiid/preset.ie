import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// GET /api/marketplace/listings/[id] - Get listing details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Listing ID is required' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get listing with owner details
    const { data: listing, error: listingError } = await supabase
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
        latitude,
        longitude,
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
          bio,
          city,
          verified_id,
          created_at
        )
      `)
      .eq('id', id)
      .single();

    if (listingError || !listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }

    // Get listing images
    const { data: images, error: imagesError } = await supabase
      .from('listing_images')
      .select('id, path, sort_order, alt_text')
      .eq('listing_id', id)
      .order('sort_order');

    if (imagesError) {
      console.error('Error fetching listing images:', imagesError);
    }

    // Get availability blocks
    const { data: availability, error: availabilityError } = await supabase
      .from('listing_availability')
      .select('id, start_date, end_date, kind, notes')
      .eq('listing_id', id)
      .order('start_date');

    if (availabilityError) {
      console.error('Error fetching availability:', availabilityError);
    }

    // Get owner's other listings (for related items)
    const { data: otherListings, error: otherListingsError } = await supabase
      .from('listings')
      .select('id, title, category, mode, rent_day_cents, sale_price_cents, created_at')
      .eq('owner_id', listing.owner_id)
      .eq('status', 'active')
      .neq('id', id)
      .limit(3);

    if (otherListingsError) {
      console.error('Error fetching other listings:', otherListingsError);
    }

    return NextResponse.json({
      listing: {
        ...listing,
        images: images || [],
        availability: availability || [],
        owner_other_listings: otherListings || []
      }
    });

  } catch (error) {
    console.error('Get listing API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/marketplace/listings/[id] - Update listing
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Listing ID is required' },
        { status: 400 }
      );
    }

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

    // Check if listing exists and user owns it
    const { data: existingListing, error: listingError } = await supabaseAdmin
      .from('listings')
      .select('owner_id')
      .eq('id', id)
      .single();

    if (listingError || !existingListing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }

    if (existingListing.owner_id !== userProfile.id) {
      return NextResponse.json(
        { error: 'Unauthorized - You can only update your own listings' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const updateData = { ...body };

    // Remove fields that shouldn't be updated directly
    delete updateData.id;
    delete updateData.owner_id;
    delete updateData.created_at;

    // Update listing
    const { data: listing, error: updateError } = await supabaseAdmin
      .from('listings')
      .update(updateData)
      .eq('id', id)
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

    if (updateError) {
      console.error('Error updating listing:', updateError);
      return NextResponse.json(
        { error: 'Failed to update listing' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      listing,
      message: 'Listing updated successfully'
    });

  } catch (error) {
    console.error('Update listing API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/marketplace/listings/[id] - Delete listing
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Listing ID is required' },
        { status: 400 }
      );
    }

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

    // Check if listing exists and user owns it
    const { data: existingListing, error: listingError } = await supabaseAdmin
      .from('listings')
      .select('owner_id')
      .eq('id', id)
      .single();

    if (listingError || !existingListing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }

    if (existingListing.owner_id !== userProfile.id) {
      return NextResponse.json(
        { error: 'Unauthorized - You can only delete your own listings' },
        { status: 403 }
      );
    }

    // Check for active orders
    const { data: activeOrders, error: ordersError } = await supabaseAdmin
      .from('rental_orders')
      .select('id')
      .eq('listing_id', id)
      .in('status', ['requested', 'accepted', 'paid', 'in_progress']);

    if (ordersError) {
      console.error('Error checking active orders:', ordersError);
    }

    const { data: activeSales, error: salesError } = await supabaseAdmin
      .from('sale_orders')
      .select('id')
      .eq('listing_id', id)
      .in('status', ['placed', 'paid', 'shipped']);

    if (salesError) {
      console.error('Error checking active sales:', salesError);
    }

    if ((activeOrders && activeOrders.length > 0) || (activeSales && activeSales.length > 0)) {
      return NextResponse.json(
        { error: 'Cannot delete listing with active orders' },
        { status: 400 }
      );
    }

    // Archive listing instead of deleting (soft delete)
    const { error: archiveError } = await supabaseAdmin
      .from('listings')
      .update({ status: 'archived' })
      .eq('id', id);

    if (archiveError) {
      console.error('Error archiving listing:', archiveError);
      return NextResponse.json(
        { error: 'Failed to delete listing' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Listing deleted successfully'
    });

  } catch (error) {
    console.error('Delete listing API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

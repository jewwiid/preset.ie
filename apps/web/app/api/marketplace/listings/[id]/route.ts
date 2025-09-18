import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/marketplace/listings/[id] - Get listing details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const { data: listing, error } = await supabase
      .from('listings')
      .select(`
        *,
        owner:users_profile!listings_owner_id_fkey(
          id,
          username,
          display_name,
          avatar_url,
          verified,
          rating,
          location_city,
          location_country
        ),
        listing_images(
          id,
          path,
          sort_order,
          alt_text
        ),
        listing_availability(
          id,
          start_date,
          end_date,
          kind,
          notes
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching listing:', error);
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    if (listing.status !== 'active') {
      // Check if user is the owner
      const authHeader = request.headers.get('authorization');
      if (authHeader) {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user } } = await supabase.auth.getUser(token);
        
        if (user) {
          const { data: profile } = await supabase
            .from('users_profile')
            .select('id')
            .eq('user_id', user.id)
            .single();
          
          if (profile && profile.id === listing.owner_id) {
            return NextResponse.json({ listing });
          }
        }
      }
      
      return NextResponse.json({ error: 'Listing not available' }, { status: 404 });
    }

    return NextResponse.json({ listing });

  } catch (error) {
    console.error('Get listing API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/marketplace/listings/[id] - Update listing
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

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

    // Check if user owns the listing
    const { data: existingListing, error: fetchError } = await supabase
      .from('listings')
      .select('owner_id')
      .eq('id', id)
      .single();

    if (fetchError || !existingListing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    if (existingListing.owner_id !== profile.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Update listing
    const { data: listing, error: updateError } = await supabase
      .from('listings')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating listing:', updateError);
      return NextResponse.json({ error: 'Failed to update listing' }, { status: 500 });
    }

    return NextResponse.json({ listing });

  } catch (error) {
    console.error('Update listing API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/marketplace/listings/[id] - Delete listing
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

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

    // Check if user owns the listing
    const { data: existingListing, error: fetchError } = await supabase
      .from('listings')
      .select('owner_id, status')
      .eq('id', id)
      .single();

    if (fetchError || !existingListing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    if (existingListing.owner_id !== profile.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check if listing has active orders
    const { data: activeOrders, error: ordersError } = await supabase
      .from('rental_orders')
      .select('id')
      .eq('listing_id', id)
      .in('status', ['requested', 'accepted', 'paid', 'in_progress']);

    if (ordersError) {
      console.error('Error checking orders:', ordersError);
      return NextResponse.json({ error: 'Failed to check orders' }, { status: 500 });
    }

    if (activeOrders && activeOrders.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete listing with active orders' 
      }, { status: 400 });
    }

    // Delete listing (cascade will handle related records)
    const { error: deleteError } = await supabase
      .from('listings')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting listing:', deleteError);
      return NextResponse.json({ error: 'Failed to delete listing' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Listing deleted successfully' });

  } catch (error) {
    console.error('Delete listing API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
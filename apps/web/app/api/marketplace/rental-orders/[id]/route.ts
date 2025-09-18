import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// GET /api/marketplace/rental-orders/[id] - Get rental order details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Order ID is required' },
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

    // Get order details
    const { data: order, error: orderError } = await supabaseAdmin
      .from('rental_orders')
      .select(`
        id,
        listing_id,
        owner_id,
        renter_id,
        start_date,
        end_date,
        day_rate_cents,
        calculated_total_cents,
        retainer_mode,
        retainer_cents,
        deposit_cents,
        currency,
        status,
        pickup_location,
        return_location,
        special_instructions,
        credits_tx_id,
        stripe_pi_id,
        created_at,
        updated_at,
        listings!rental_orders_listing_id_fkey (
          id,
          title,
          description,
          category,
          condition,
          mode,
          location_city,
          location_country,
          owner_id,
          users_profile!listings_owner_id_fkey (
            id,
            display_name,
            handle,
            avatar_url,
            verified_id
          )
        ),
        users_profile!rental_orders_renter_id_fkey (
          id,
          display_name,
          handle,
          avatar_url,
          verified_id
        )
      `)
      .eq('id', id)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Check if user has access to this order
    if (order.owner_id !== userProfile.id && order.renter_id !== userProfile.id) {
      return NextResponse.json(
        { error: 'Unauthorized - You can only view your own orders' },
        { status: 403 }
      );
    }

    return NextResponse.json({ order });

  } catch (error) {
    console.error('Get rental order API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/marketplace/rental-orders/[id] - Update rental order status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Order ID is required' },
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

    // Parse request body
    const body = await request.json();
    const { status: newStatus, notes } = body;

    if (!newStatus) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    // Get current order
    const { data: order, error: orderError } = await supabaseAdmin
      .from('rental_orders')
      .select('id, owner_id, renter_id, status, listing_id')
      .eq('id', id)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Check authorization based on status change
    const isOwner = order.owner_id === userProfile.id;
    const isRenter = order.renter_id === userProfile.id;

    // Define allowed status transitions
    const allowedTransitions = {
      'requested': {
        owner: ['accepted', 'rejected'],
        renter: ['cancelled']
      },
      'accepted': {
        owner: ['paid', 'cancelled'],
        renter: ['paid', 'cancelled']
      },
      'paid': {
        owner: ['in_progress', 'cancelled'],
        renter: ['cancelled']
      },
      'in_progress': {
        owner: ['completed', 'disputed'],
        renter: ['disputed']
      },
      'completed': {
        owner: ['disputed'],
        renter: ['disputed']
      }
    };

    const currentStatus = order.status;
    const allowedStatuses = allowedTransitions[currentStatus as keyof typeof allowedTransitions];

    if (!allowedStatuses) {
      return NextResponse.json(
        { error: `Invalid status transition from ${currentStatus}` },
        { status: 400 }
      );
    }

    let allowedForUser: string[] = [];
    if (isOwner) {
      allowedForUser = allowedStatuses.owner || [];
    } else if (isRenter) {
      allowedForUser = allowedStatuses.renter || [];
    }

    if (!allowedForUser.includes(newStatus)) {
      return NextResponse.json(
        { error: `You cannot change status to ${newStatus}` },
        { status: 403 }
      );
    }

    // Update order status
    const updateData: any = { status: newStatus };
    if (notes) {
      updateData.special_instructions = notes;
    }

    const { data: updatedOrder, error: updateError } = await supabaseAdmin
      .from('rental_orders')
      .update(updateData)
      .eq('id', id)
      .select(`
        id,
        listing_id,
        owner_id,
        renter_id,
        start_date,
        end_date,
        day_rate_cents,
        calculated_total_cents,
        retainer_mode,
        retainer_cents,
        deposit_cents,
        currency,
        status,
        pickup_location,
        return_location,
        special_instructions,
        created_at,
        updated_at
      `)
      .single();

    if (updateError) {
      console.error('Error updating rental order:', updateError);
      return NextResponse.json(
        { error: 'Failed to update order status' },
        { status: 500 }
      );
    }

    // Handle payment processing for 'paid' status
    if (newStatus === 'paid') {
      // TODO: Integrate with existing Credits/Stripe system
      // This would involve:
      // 1. Processing retainer hold via Credits or Stripe
      // 2. Updating credits_tx_id or stripe_pi_id
      // 3. Creating transaction records
    }

    return NextResponse.json({
      order: updatedOrder,
      message: `Order status updated to ${newStatus}`
    });

  } catch (error) {
    console.error('Update rental order API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

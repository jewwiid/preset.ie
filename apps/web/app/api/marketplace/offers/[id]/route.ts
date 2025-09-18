import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// GET /api/marketplace/offers/[id] - Get offer details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Offer ID is required' },
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

    // Get offer details
    const { data: offer, error: offerError } = await supabaseAdmin
      .from('offers')
      .select(`
        id,
        listing_id,
        from_user,
        to_user,
        context,
        payload,
        status,
        expires_at,
        created_at,
        updated_at,
        listings!offers_listing_id_fkey (
          id,
          title,
          description,
          category,
          condition,
          mode,
          rent_day_cents,
          sale_price_cents,
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
        users_profile!offers_from_user_fkey (
          id,
          display_name,
          handle,
          avatar_url,
          verified_id
        ),
        users_profile!offers_to_user_fkey (
          id,
          display_name,
          handle,
          avatar_url,
          verified_id
        )
      `)
      .eq('id', id)
      .single();

    if (offerError || !offer) {
      return NextResponse.json(
        { error: 'Offer not found' },
        { status: 404 }
      );
    }

    // Check if user has access to this offer
    if (offer.from_user !== userProfile.id && offer.to_user !== userProfile.id) {
      return NextResponse.json(
        { error: 'Unauthorized - You can only view your own offers' },
        { status: 403 }
      );
    }

    return NextResponse.json({ offer });

  } catch (error) {
    console.error('Get offer API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/marketplace/offers/[id] - Respond to offer
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Offer ID is required' },
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
    const { action, counter_payload } = body; // 'accept', 'decline', 'counter'

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }

    // Get current offer
    const { data: offer, error: offerError } = await supabaseAdmin
      .from('offers')
      .select('id, from_user, to_user, status, expires_at, listing_id, context, payload')
      .eq('id', id)
      .single();

    if (offerError || !offer) {
      return NextResponse.json(
        { error: 'Offer not found' },
        { status: 404 }
      );
    }

    // Check if user is the recipient of the offer
    if (offer.to_user !== userProfile.id) {
      return NextResponse.json(
        { error: 'Unauthorized - You can only respond to offers made to you' },
        { status: 403 }
      );
    }

    // Check if offer is still open
    if (offer.status !== 'open') {
      return NextResponse.json(
        { error: 'This offer is no longer open' },
        { status: 400 }
      );
    }

    // Check if offer has expired
    if (offer.expires_at && new Date(offer.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'This offer has expired' },
        { status: 400 }
      );
    }

    let updateData: any = {};

    switch (action) {
      case 'accept':
        updateData.status = 'accepted';
        break;
      
      case 'decline':
        updateData.status = 'declined';
        break;
      
      case 'counter':
        if (!counter_payload || !counter_payload.price_cents) {
          return NextResponse.json(
            { error: 'Counter payload with price is required' },
            { status: 400 }
          );
        }
        updateData.status = 'countered';
        updateData.payload = counter_payload;
        break;
      
      default:
        return NextResponse.json(
          { error: 'Invalid action. Must be accept, decline, or counter' },
          { status: 400 }
        );
    }

    // Update offer
    const { data: updatedOffer, error: updateError } = await supabaseAdmin
      .from('offers')
      .update(updateData)
      .eq('id', id)
      .select(`
        id,
        listing_id,
        from_user,
        to_user,
        context,
        payload,
        status,
        expires_at,
        created_at,
        updated_at
      `)
      .single();

    if (updateError) {
      console.error('Error updating offer:', updateError);
      return NextResponse.json(
        { error: 'Failed to update offer' },
        { status: 500 }
      );
    }

    // If offer was accepted, create the appropriate order
    if (action === 'accept') {
      try {
        if (offer.context === 'rent') {
          // Create rental order
          const { data: rentalOrder, error: rentalError } = await supabaseAdmin
            .from('rental_orders')
            .insert({
              listing_id: offer.listing_id,
              owner_id: userProfile.id,
              renter_id: offer.from_user,
              start_date: offer.payload.start_date,
              end_date: offer.payload.end_date,
              day_rate_cents: offer.payload.price_cents,
              calculated_total_cents: offer.payload.price_cents * (offer.payload.quantity || 1),
              retainer_mode: 'credit_hold', // Default for accepted offers
              retainer_cents: offer.payload.price_cents,
              deposit_cents: 0,
              status: 'requested'
            })
            .select('id')
            .single();

          if (rentalError) {
            console.error('Error creating rental order:', rentalError);
            // Don't fail the offer update, just log the error
          }
        } else if (offer.context === 'sale') {
          // Create sale order
          const { data: saleOrder, error: saleError } = await supabaseAdmin
            .from('sale_orders')
            .insert({
              listing_id: offer.listing_id,
              owner_id: userProfile.id,
              buyer_id: offer.from_user,
              unit_price_cents: offer.payload.price_cents,
              quantity: offer.payload.quantity || 1,
              total_cents: offer.payload.price_cents * (offer.payload.quantity || 1),
              status: 'placed'
            })
            .select('id')
            .single();

          if (saleError) {
            console.error('Error creating sale order:', saleError);
            // Don't fail the offer update, just log the error
          }
        }
      } catch (orderError) {
        console.error('Error creating order from accepted offer:', orderError);
        // Don't fail the offer update, just log the error
      }
    }

    return NextResponse.json({
      offer: updatedOffer,
      message: `Offer ${action}ed successfully`
    });

  } catch (error) {
    console.error('Update offer API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

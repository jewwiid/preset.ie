import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// POST /api/marketplace/messages/send - Send marketplace message
export async function POST(request: NextRequest) {
  try {
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
    const {
      listing_id,
      rental_order_id,
      sale_order_id,
      offer_id,
      to_user_id,
      message_body,
      attachments
    } = body;

    // Validate required fields
    if (!to_user_id || !message_body) {
      return NextResponse.json(
        { error: 'Recipient and message body are required' },
        { status: 400 }
      );
    }

    // Validate that user is not messaging themselves
    if (to_user_id === userProfile.id) {
      return NextResponse.json(
        { error: 'You cannot message yourself' },
        { status: 400 }
      );
    }

    // Determine conversation context
    let conversationId: string | null = null;
    let contextValid = false;

    if (listing_id) {
      // Validate listing access
      const { data: listing, error: listingError } = await supabaseAdmin
        .from('listings')
        .select('id, owner_id, status')
        .eq('id', listing_id)
        .single();

      if (listingError || !listing) {
        return NextResponse.json(
          { error: 'Listing not found' },
          { status: 404 }
        );
      }

      if (listing.status !== 'active') {
        return NextResponse.json(
          { error: 'Listing is not active' },
          { status: 400 }
        );
      }

      // Check if user has access to this listing through accepted offers or orders
      const { data: hasAcceptedOffers } = await supabaseAdmin
        .from('offers')
        .select('id')
        .eq('listing_id', listing_id)
        .eq('status', 'accepted')
        .or(`offerer_id.eq.${userProfile.id},owner_id.eq.${userProfile.id}`)
        .limit(1);

      const { data: hasActiveOrders } = await supabaseAdmin
        .from('rental_orders')
        .select('id')
        .eq('listing_id', listing_id)
        .in('status', ['pending', 'confirmed', 'active'])
        .or(`owner_id.eq.${userProfile.id},renter_id.eq.${userProfile.id}`)
        .limit(1);

      // Only allow messaging if:
      // 1. User is the listing owner, OR
      // 2. User has an accepted offer, OR  
      // 3. User has an active rental order
      if (listing.owner_id !== userProfile.id && 
          (!hasAcceptedOffers || hasAcceptedOffers.length === 0) && 
          (!hasActiveOrders || hasActiveOrders.length === 0)) {
        return NextResponse.json(
          { error: 'You can only message after your offer is accepted or you have an active order' },
          { status: 403 }
        );
      }

      conversationId = listing_id;
      contextValid = true;
    } else if (rental_order_id) {
      // Validate rental order access
      const { data: order, error: orderError } = await supabaseAdmin
        .from('rental_orders')
        .select('id, owner_id, renter_id, listing_id')
        .eq('id', rental_order_id)
        .single();

      if (orderError || !order) {
        return NextResponse.json(
          { error: 'Rental order not found' },
          { status: 404 }
        );
      }

      if (order.owner_id !== userProfile.id && order.renter_id !== userProfile.id) {
        return NextResponse.json(
          { error: 'You do not have access to this order' },
          { status: 403 }
        );
      }

      conversationId = order.listing_id;
      contextValid = true;
    } else if (sale_order_id) {
      // Validate sale order access
      const { data: order, error: orderError } = await supabaseAdmin
        .from('sale_orders')
        .select('id, owner_id, buyer_id, listing_id')
        .eq('id', sale_order_id)
        .single();

      if (orderError || !order) {
        return NextResponse.json(
          { error: 'Sale order not found' },
          { status: 404 }
        );
      }

      if (order.owner_id !== userProfile.id && order.buyer_id !== userProfile.id) {
        return NextResponse.json(
          { error: 'You do not have access to this order' },
          { status: 403 }
        );
      }

      conversationId = order.listing_id;
      contextValid = true;
    } else if (offer_id) {
      // Validate offer access
      const { data: offer, error: offerError } = await supabaseAdmin
        .from('offers')
        .select('id, offerer_id, owner_id, listing_id')
        .eq('id', offer_id)
        .single();

      if (offerError || !offer) {
        return NextResponse.json(
          { error: 'Offer not found' },
          { status: 404 }
        );
      }

      if (offer.offerer_id !== userProfile.id && offer.owner_id !== userProfile.id) {
        return NextResponse.json(
          { error: 'You do not have access to this offer' },
          { status: 403 }
        );
      }

      conversationId = offer.listing_id;
      contextValid = true;
    }

    if (!contextValid) {
      return NextResponse.json(
        { error: 'Invalid message context' },
        { status: 400 }
      );
    }

    // Create message
    const { data: message, error: insertError } = await supabaseAdmin
      .from('messages')
      .insert({
        gig_id: null, // Marketplace messages don't use gig_id
        listing_id: listing_id || null,
        rental_order_id: rental_order_id || null,
        sale_order_id: sale_order_id || null,
        offer_id: offer_id || null,
        from_user_id: userProfile.id,
        to_user_id: to_user_id,
        body: message_body,
        attachments: attachments || [],
        context_type: 'marketplace'
      })
      .select(`
        id,
        gig_id,
        listing_id,
        rental_order_id,
        sale_order_id,
        offer_id,
        from_user_id,
        to_user_id,
        body,
        attachments,
        created_at
      `)
      .single();

    if (insertError) {
      console.error('Error creating marketplace message:', insertError);
      return NextResponse.json(
        { error: 'Failed to send message' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        conversationId: listing_id || rental_order_id || sale_order_id || offer_id,
        messageId: message.id,
        sentAt: message.created_at
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Send marketplace message API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

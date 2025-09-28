import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// PUT /api/marketplace/offers/[id] - Update offer status (accept/decline)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params
    const { id } = await params;
    
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
    const { status } = body;

    // Validate status
    if (!status || !['accepted', 'declined', 'pending'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be accepted, declined, or pending' },
        { status: 400 }
      );
    }

    // Get the offer
    const { data: offer, error: offerError } = await supabaseAdmin
      .from('offers')
      .select('id, owner_id, offerer_id, listing_id, status')
      .eq('id', id)
      .single();

    if (offerError || !offer) {
      return NextResponse.json(
        { error: 'Offer not found' },
        { status: 404 }
      );
    }

    // Only the listing owner can accept/decline offers
    if (offer.owner_id !== userProfile.id) {
      return NextResponse.json(
        { error: 'Only the listing owner can accept or decline offers' },
        { status: 403 }
      );
    }

    // Can't change status of already processed offers
    if (offer.status !== 'pending') {
      return NextResponse.json(
        { error: 'This offer has already been processed' },
        { status: 400 }
      );
    }

    // Update the offer status
    const { data: updatedOffer, error: updateError } = await supabaseAdmin
      .from('offers')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        id,
        listing_id,
        offerer_id,
        owner_id,
        offer_amount_cents,
        message,
        status,
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

    // If offer was accepted, create a rental order (optional - you might want to do this separately)
    if (status === 'accepted') {
      // You could create a rental order here, or handle this in a separate flow
      // For now, we'll just return the updated offer
    }

    return NextResponse.json({
      success: true,
      data: updatedOffer
    });

  } catch (error) {
    console.error('Update offer API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/marketplace/offers/[id] - Get offer details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params
    const { id } = await params;
    
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

    // Get the offer
    const { data: offer, error: offerError } = await supabaseAdmin
      .from('offers')
      .select(`
        id,
        listing_id,
        offerer_id,
        owner_id,
        offer_amount_cents,
        message,
        contact_preference,
        status,
        created_at,
        updated_at,
        listings!offers_listing_id_fkey (
          id,
          title,
          category,
          mode,
          owner_id
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

    // Only the offerer or owner can view the offer
    if (offer.offerer_id !== userProfile.id && offer.owner_id !== userProfile.id) {
      return NextResponse.json(
        { error: 'You do not have access to this offer' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: offer
    });

  } catch (error) {
    console.error('Get offer API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Initialize Supabase client
const getSupabaseClient = (authToken?: string, useServiceRole = false) => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (useServiceRole) {
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required Supabase service role environment variables');
    }
    return createClient(supabaseUrl, supabaseServiceKey);
  }

  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing required Supabase environment variables');
  }

  const client = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: authToken ? {
        Authorization: `Bearer ${authToken}`
      } : {}
    }
  });

  return client;
};

// GET /api/collab/projects/[id]/gear-offers/[offerId] - Get single offer
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; offerId: string }> }
) {
  try {
    const { id: projectId, offerId } = await params;

    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = getSupabaseClient(token, true);

    // Get current user
    const authClient = getSupabaseClient(token, false);
    const { data: { user } } = await authClient.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
    }

    const { data: profile } = await authClient
      .from('users_profile')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 403 });
    }

    // Get offer with full details
    const { data: offer, error: offerError } = await supabase
      .from('collab_gear_offers')
      .select(`
        *,
        offerer:users_profile!collab_gear_offers_offerer_id_fkey(
          id,
          handle,
          display_name,
          avatar_url,
          verified_id,
          city,
          country
        ),
        gear_request:collab_gear_requests(
          id,
          category,
          equipment_spec,
          quantity
        ),
        listing:listings(
          id,
          title,
          description,
          category,
          rent_day_cents,
          sale_price_cents
        ),
        project:collab_projects!collab_gear_offers_project_id_fkey(
          id,
          creator_id
        )
      `)
      .eq('id', offerId)
      .eq('project_id', projectId)
      .single();

    if (offerError || !offer) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    }

    // Check access: creator or offerer can view
    const isCreator = offer.project.creator_id === profile.id;
    const isOfferer = offer.offerer_id === profile.id;

    if (!isCreator && !isOfferer) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({ offer });

  } catch (error) {
    console.error('Get offer API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/collab/projects/[id]/gear-offers/[offerId] - Update offer status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; offerId: string }> }
) {
  try {
    const { id: projectId, offerId } = await params;
    const body = await request.json();
    const { status: newStatus, rejection_reason } = body;

    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = getSupabaseClient(token, true);

    // Get current user
    const authClient = getSupabaseClient(token, false);
    const { data: { user } } = await authClient.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
    }

    const { data: profile } = await authClient
      .from('users_profile')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 403 });
    }

    // Validate status
    if (!['accepted', 'rejected', 'withdrawn'].includes(newStatus)) {
      return NextResponse.json({
        error: 'Invalid status. Must be: accepted, rejected, or withdrawn'
      }, { status: 400 });
    }

    // Get offer with project info
    const { data: offer, error: offerError } = await supabase
      .from('collab_gear_offers')
      .select(`
        *,
        project:collab_projects!collab_gear_offers_project_id_fkey(
          id,
          creator_id
        )
      `)
      .eq('id', offerId)
      .eq('project_id', projectId)
      .single();

    if (offerError || !offer) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    }

    // Check if offer is still pending
    if (offer.status !== 'pending') {
      return NextResponse.json({
        error: `Cannot modify offer with status: ${offer.status}`
      }, { status: 400 });
    }

    const isCreator = offer.project.creator_id === profile.id;
    const isOfferer = offer.offerer_id === profile.id;

    // Authorization checks
    if (newStatus === 'withdrawn') {
      // Only offerer can withdraw
      if (!isOfferer) {
        return NextResponse.json({
          error: 'Only the offerer can withdraw this offer'
        }, { status: 403 });
      }
    } else if (newStatus === 'accepted' || newStatus === 'rejected') {
      // Only creator can accept/reject
      if (!isCreator) {
        return NextResponse.json({
          error: 'Only the project creator can accept or reject offers'
        }, { status: 403 });
      }
    }

    // Update offer
    const updateData: any = {
      status: newStatus,
      updated_at: new Date().toISOString()
    };

    if (newStatus === 'rejected' && rejection_reason) {
      updateData.rejection_reason = rejection_reason;
    }

    const { data: updatedOffer, error: updateError } = await supabase
      .from('collab_gear_offers')
      .update(updateData)
      .eq('id', offerId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating offer:', updateError);
      return NextResponse.json({ error: 'Failed to update offer' }, { status: 500 });
    }

    // If accepted, mark gear request as fulfilled
    if (newStatus === 'accepted' && offer.gear_request_id) {
      await supabase
        .from('collab_gear_requests')
        .update({ status: 'fulfilled' })
        .eq('id', offer.gear_request_id);
    }

    return NextResponse.json({ offer: updatedOffer });

  } catch (error) {
    console.error('Update offer API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

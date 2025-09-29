import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Initialize Supabase client inside functions to avoid build-time issues
const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing required Supabase environment variables')
  }

  return createClient(supabaseUrl, supabaseServiceKey)
}

// PUT /api/marketplace/offers/[id]/withdraw - Allow offerers to withdraw their own offers
export async function PUT(request: NextRequest) {
  try {
    const supabase = getSupabaseClient()
    const body = await request.json();
    const { offerId } = body;

    if (!offerId) {
      return NextResponse.json({ 
        error: 'Missing required field: offerId' 
      }, { status: 400 });
    }

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

    // Check if the offer exists and user is the offerer
    const { data: offer, error: fetchError } = await supabase
      .from('offers')
      .select('*')
      .eq('id', offerId)
      .single();

    if (fetchError || !offer) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    }

    // Check if user is the offerer
    if (offer.offerer_id !== userProfile.id) {
      return NextResponse.json({ 
        error: 'Unauthorized: You can only withdraw your own offers' 
      }, { status: 403 });
    }

    // Check if offer can be withdrawn (only pending offers)
    if (offer.status !== 'pending') {
      return NextResponse.json({ 
        error: 'Only pending offers can be withdrawn' 
      }, { status: 400 });
    }

    // Update the offer status to withdrawn
    const { data: updatedOffer, error: updateError } = await supabase
      .from('offers')
      .update({ 
        status: 'withdrawn',
        updated_at: new Date().toISOString()
      })
      .eq('id', offerId)
      .select()
      .single();

    if (updateError) {
      console.error('Error withdrawing offer:', updateError);
      return NextResponse.json({ 
        error: 'Failed to withdraw offer' 
      }, { status: 500 });
    }

    // TODO: Send notification to listing owner

    return NextResponse.json({
      success: true,
      message: 'Offer withdrawn successfully',
      offer: updatedOffer
    });

  } catch (error: any) {
    console.error('Withdraw offer API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

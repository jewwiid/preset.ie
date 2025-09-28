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

export async function PUT(request: NextRequest) {
  try {
    const supabase = getSupabaseClient()
    const body = await request.json();
    const { offerId, action } = body; // action: 'accept' or 'reject'

    if (!offerId || !action) {
      return NextResponse.json({ 
        error: 'Missing required fields: offerId, action' 
      }, { status: 400 });
    }

    if (!['accept', 'reject'].includes(action)) {
      return NextResponse.json({ 
        error: 'Invalid action. Must be "accept" or "reject"' 
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

    // Check if the offer exists and user owns the listing
    const { data: offer, error: fetchError } = await supabase
      .from('offers')
      .select(`
        *,
        listing:listings!offers_listing_id_fkey (
          id,
          owner_id
        )
      `)
      .eq('id', offerId)
      .single();

    if (fetchError || !offer) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    }

    // Check if user owns the listing
    if (offer.listing.owner_id !== userProfile.id) {
      return NextResponse.json({ 
        error: 'Unauthorized: You can only manage offers for your own listings' 
      }, { status: 403 });
    }

    // Check if offer is still pending
    if (offer.status !== 'pending') {
      return NextResponse.json({ 
        error: 'Offer is no longer pending and cannot be modified' 
      }, { status: 400 });
    }

    // Update the offer status
    const newStatus = action === 'accept' ? 'accepted' : 'rejected';
    const { data: updatedOffer, error: updateError } = await supabase
      .from('offers')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', offerId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating offer:', updateError);
      return NextResponse.json({ 
        error: 'Failed to update offer' 
      }, { status: 500 });
    }

    // TODO: Send notification to offerer
    // TODO: Create sale transaction if accepted

    return NextResponse.json({
      success: true,
      message: `Offer ${action}ed successfully`,
      offer: updatedOffer
    });

  } catch (error: any) {
    console.error('Offer action API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

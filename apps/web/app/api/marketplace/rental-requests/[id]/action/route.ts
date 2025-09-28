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
    const supabase = getSupabaseClient();
    
    const body = await request.json();
    const { requestId, action } = body; // action: 'accept' or 'reject'

    if (!requestId || !action) {
      return NextResponse.json({ 
        error: 'Missing required fields: requestId, action' 
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

    // Check if the rental request exists and user owns the listing
    const { data: rentalRequest, error: fetchError } = await supabase
      .from('rental_requests')
      .select(`
        *,
        listing:listings!rental_requests_listing_id_fkey (
          id,
          owner_id
        )
      `)
      .eq('id', requestId)
      .single();

    if (fetchError || !rentalRequest) {
      return NextResponse.json({ error: 'Rental request not found' }, { status: 404 });
    }

    // Check if user owns the listing
    if (rentalRequest.listing.owner_id !== userProfile.id) {
      return NextResponse.json({ 
        error: 'Unauthorized: You can only manage requests for your own listings' 
      }, { status: 403 });
    }

    // Check if request is still pending
    if (rentalRequest.status !== 'pending') {
      return NextResponse.json({ 
        error: 'Request is no longer pending and cannot be modified' 
      }, { status: 400 });
    }

    // Update the request status
    const newStatus = action === 'accept' ? 'accepted' : 'rejected';
    const { data: updatedRequest, error: updateError } = await supabase
      .from('rental_requests')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating rental request:', updateError);
      return NextResponse.json({ 
        error: 'Failed to update rental request' 
      }, { status: 500 });
    }

    // TODO: Send notification to requester
    // TODO: Create order/booking if accepted

    return NextResponse.json({
      success: true,
      message: `Rental request ${action}ed successfully`,
      request: updatedRequest
    });

  } catch (error: any) {
    console.error('Rental request action API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

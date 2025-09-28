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

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = getSupabaseClient()
    const { id: requestId } = await params;

    if (!requestId) {
      return NextResponse.json({ 
        error: 'Missing request ID' 
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

    // Check if the rental request exists and user is the requester
    const { data: rentalRequest, error: fetchError } = await supabase
      .from('rental_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (fetchError || !rentalRequest) {
      return NextResponse.json({ error: 'Rental request not found' }, { status: 404 });
    }

    // Check if user is the requester (can only delete their own requests)
    if (rentalRequest.requester_id !== userProfile.id) {
      return NextResponse.json({ 
        error: 'Unauthorized: You can only delete your own rental requests' 
      }, { status: 403 });
    }

    // Check if request can be deleted (not accepted or completed)
    if (['accepted', 'completed'].includes(rentalRequest.status)) {
      return NextResponse.json({ 
        error: 'Cannot delete accepted or completed rental requests' 
      }, { status: 400 });
    }

    // Delete the rental request
    const { error: deleteError } = await supabase
      .from('rental_requests')
      .delete()
      .eq('id', requestId);

    if (deleteError) {
      console.error('Error deleting rental request:', deleteError);
      return NextResponse.json({ 
        error: 'Failed to delete rental request' 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Rental request deleted successfully'
    });

  } catch (error: any) {
    console.error('Delete rental request API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

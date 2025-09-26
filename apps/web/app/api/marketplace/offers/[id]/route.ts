import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: offerId } = await params;

    if (!offerId) {
      return NextResponse.json({ 
        error: 'Missing offer ID' 
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

    // Check if user is the offerer (can only delete their own offers)
    if (offer.offerer_id !== userProfile.id) {
      return NextResponse.json({ 
        error: 'Unauthorized: You can only delete your own offers' 
      }, { status: 403 });
    }

    // Check if offer can be deleted (not accepted or completed)
    if (['accepted', 'completed'].includes(offer.status)) {
      return NextResponse.json({ 
        error: 'Cannot delete accepted or completed offers' 
      }, { status: 400 });
    }

    // Delete the offer
    const { error: deleteError } = await supabase
      .from('offers')
      .delete()
      .eq('id', offerId);

    if (deleteError) {
      console.error('Error deleting offer:', deleteError);
      return NextResponse.json({ 
        error: 'Failed to delete offer' 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Offer deleted successfully'
    });

  } catch (error: any) {
    console.error('Delete offer API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
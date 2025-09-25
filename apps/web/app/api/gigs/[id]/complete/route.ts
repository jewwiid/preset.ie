import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../../lib/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check if supabase client is available
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase client not configured' },
        { status: 500 }
      );
    }

    const resolvedParams = await params;
    const gigId = resolvedParams.id;

    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user profile
    const { data: profile, error: profileError } = await (supabase as any)
      .from('users_profile')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Find the gig and verify ownership
    const { data: gig, error: gigError } = await (supabase as any)
      .from('gigs')
      .select('*')
      .eq('id', gigId)
      .eq('owner_user_id', (profile as any).id)
      .single();

    if (gigError || !gig) {
      return NextResponse.json(
        { error: 'Gig not found or you are not the owner' },
        { status: 404 }
      );
    }

    // Validate gig status
    if ((gig as any).status !== 'BOOKED') {
      return NextResponse.json(
        { error: 'Can only complete gigs that are in BOOKED status' },
        { status: 400 }
      );
    }

    // Update gig status to COMPLETED
    const { error: updateError } = await (supabase as any)
      .from('gigs')
      .update({
        status: 'COMPLETED',
        updated_at: new Date().toISOString()
      })
      .eq('id', gigId);

    if (updateError) {
      console.error('Error updating gig status:', updateError);
      return NextResponse.json(
        { error: 'Failed to complete gig' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        success: true, 
        message: 'Gig marked as completed successfully',
        gigId: gigId
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error completing gig:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
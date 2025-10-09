import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getEmailEventsService } from '@/lib/services/emails';

/**
 * POST /api/emails/gig-published
 * Triggered by database when gig status changes to PUBLISHED
 */
export async function POST(request: NextRequest) {
  try {
    const { gigId, ownerId } = await request.json();

    if (!gigId || !ownerId) {
      return NextResponse.json(
        { error: 'Missing required fields: gigId, ownerId' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get gig details
    const { data: gig, error: gigError } = await supabase
      .from('gigs')
      .select('*')
      .eq('id', gigId)
      .single();

    if (gigError || !gig) {
      return NextResponse.json(
        { error: 'Gig not found' },
        { status: 404 }
      );
    }

    // Get owner profile
    const { data: owner, error: ownerError } = await supabase
      .from('users_profile')
      .select('user_id')
      .eq('id', ownerId)
      .single();

    if (ownerError || !owner) {
      return NextResponse.json(
        { error: 'Owner not found' },
        { status: 404 }
      );
    }

    // Get owner email
    const { data: { user }, error: authError } = await supabase.auth.admin.getUserById(owner.user_id);

    if (authError || !user?.email) {
      return NextResponse.json(
        { error: 'Owner email not found' },
        { status: 404 }
      );
    }

    // Send gig published email
    const emailEvents = getEmailEventsService();
    await emailEvents.sendGigPublished(owner.user_id, user.email, {
      id: gig.id,
      title: gig.title,
      location: gig.location_text,
      startTime: gig.start_time,
      endTime: gig.end_time,
      compType: gig.comp_type,
      compDetails: gig.comp_details
    });

    return NextResponse.json({
      success: true,
      message: 'Gig published email sent',
      recipient: user.email
    });

  } catch (error) {
    console.error('Error sending gig published email:', error);
    return NextResponse.json(
      { error: 'Failed to send email', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}


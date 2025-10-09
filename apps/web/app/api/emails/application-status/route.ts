import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getEmailEventsService } from '@/lib/services/emails';

/**
 * POST /api/emails/application-status
 * Triggered by database when application status changes
 */
export async function POST(request: NextRequest) {
  try {
    const { applicationId, gigId, applicantId, oldStatus, newStatus } = await request.json();

    const supabase = await createClient();

    // Get gig and applicant details
    const { data: gig } = await supabase
      .from('gigs')
      .select('*, owner:users_profile!gigs_owner_user_id_fkey(display_name, user_id)')
      .eq('id', gigId)
      .single();

    const { data: applicant } = await supabase
      .from('users_profile')
      .select('display_name, user_id')
      .eq('id', applicantId)
      .single();

    if (!gig || !applicant) {
      return NextResponse.json({ error: 'Data not found' }, { status: 404 });
    }

    // Get applicant email
    const { data: { user } } = await supabase.auth.admin.getUserById(applicant.user_id);
    if (!user?.email) {
      return NextResponse.json({ error: 'Email not found' }, { status: 404 });
    }

    const emailEvents = getEmailEventsService();

    // Send appropriate email based on new status
    switch (newStatus) {
      case 'SHORTLISTED':
        await emailEvents.sendApplicationShortlisted(
          applicant.user_id,
          user.email,
          gig.title,
          gig.owner.display_name || 'the contributor'
        );
        break;

      case 'ACCEPTED':
        await emailEvents.sendApplicationAccepted(
          applicant.user_id,
          user.email,
          applicant.display_name,
          {
            id: gig.id,
            title: gig.title,
            location: gig.location_text,
            startTime: gig.start_time,
            endTime: gig.end_time,
            compType: gig.comp_type
          },
          gig.owner.display_name || 'the contributor'
        );
        break;

      case 'DECLINED':
        // TODO: Fetch recommended gigs
        await emailEvents.sendApplicationDeclined(
          applicant.user_id,
          user.email,
          gig.title,
          []
        );
        break;
    }

    return NextResponse.json({
      success: true,
      message: `${newStatus} email sent`,
      recipient: user.email
    });

  } catch (error) {
    console.error('Error sending application status email:', error);
    return NextResponse.json(
      { error: 'Failed to send email', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}


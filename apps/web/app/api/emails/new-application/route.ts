import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getEmailEventsService } from '@/lib/services/emails';

/**
 * POST /api/emails/new-application
 * Triggered by database when new application is submitted
 */
export async function POST(request: NextRequest) {
  try {
    const { applicationId, gigId, applicantId } = await request.json();

    if (!applicationId || !gigId || !applicantId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get gig details
    const { data: gig, error: gigError } = await supabase
      .from('gigs')
      .select('*, owner:users_profile!gigs_owner_user_id_fkey(user_id)')
      .eq('id', gigId)
      .single();

    if (gigError || !gig) {
      return NextResponse.json({ error: 'Gig not found' }, { status: 404 });
    }

    // Get applicant details
    const { data: applicant, error: applicantError } = await supabase
      .from('users_profile')
      .select('display_name, user_id')
      .eq('id', applicantId)
      .single();

    if (applicantError || !applicant) {
      return NextResponse.json({ error: 'Applicant not found' }, { status: 404 });
    }

    // Get owner email
    const { data: { user }, error: authError } = await supabase.auth.admin.getUserById(gig.owner.user_id);

    if (authError || !user?.email) {
      return NextResponse.json({ error: 'Owner email not found' }, { status: 404 });
    }

    // Send new application email to gig owner
    const emailEvents = getEmailEventsService();
    await emailEvents.sendNewApplicationNotification(
      gig.owner.user_id,
      user.email,
      gig.title,
      applicant.display_name,
      applicantId,
      `${process.env.NEXT_PUBLIC_APP_URL}/gigs/${gigId}/applications`
    );

    // Also send confirmation to applicant
    const { data: { user: applicantUser } } = await supabase.auth.admin.getUserById(applicant.user_id);
    
    if (applicantUser?.email) {
      await emailEvents.sendApplicationSubmittedConfirmation(
        applicant.user_id,
        applicantUser.email,
        gig.title,
        gig.owner.display_name || 'the contributor',
        `${process.env.NEXT_PUBLIC_APP_URL}/gigs/${gigId}`
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Application emails sent',
      recipients: [user.email, applicantUser?.email].filter(Boolean)
    });

  } catch (error) {
    console.error('Error sending new application email:', error);
    return NextResponse.json(
      { error: 'Failed to send email', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}


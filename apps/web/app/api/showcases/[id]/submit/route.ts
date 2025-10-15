import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: showcaseId } = await params;
    
    // Get auth token from header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    // Create Supabase client
    const supabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    
    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    // 1. Verify user is gig creator
    const { data: showcase, error: showcaseError } = await supabase
      .from('showcases')
      .select('*')
      .eq('id', showcaseId)
      .single();

    if (showcaseError || !showcase) {
      return NextResponse.json(
        { success: false, error: 'Showcase not found' },
        { status: 404 }
      );
    }

    if (showcase.creator_user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Only the gig creator can submit for approval' },
        { status: 403 }
      );
    }

    if (!showcase.from_gig) {
      return NextResponse.json(
        { success: false, error: 'This showcase does not require approval' },
        { status: 400 }
      );
    }

    if (showcase.approval_status !== 'draft') {
      return NextResponse.json(
        { success: false, error: 'Showcase has already been submitted' },
        { status: 400 }
      );
    }

    // 2. Get ALL accepted talents from gig
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: acceptedApplicants, error: applicantsError } = await supabaseAdmin
      .from('applications')
      .select(`
        applicant_user_id,
        users_profile!inner(
          id,
          display_name,
          email
        )
      `)
      .eq('gig_id', showcase.gig_id)
      .in('status', ['ACCEPTED', 'PENDING']);

    if (applicantsError) {
      console.error('Error fetching accepted applicants:', applicantsError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch talent information' },
        { status: 500 }
      );
    }

    const totalTalents = acceptedApplicants.length;

    if (totalTalents === 0) {
      return NextResponse.json(
        { success: false, error: 'No accepted talents found for this gig' },
        { status: 400 }
      );
    }

    // 3. Create approval records for ALL talents
    const approvalRecords = acceptedApplicants.map(app => ({
      showcase_id: showcaseId,
      talent_user_id: app.applicant_user_id,
      action: 'pending'
    }));

    const { error: approvalError } = await supabaseAdmin
      .from('showcase_talent_approvals')
      .upsert(approvalRecords);

    if (approvalError) {
      console.error('Error creating approval records:', approvalError);
      return NextResponse.json(
        { success: false, error: 'Failed to create approval records' },
        { status: 500 }
      );
    }

    // 4. Update approval_status to 'pending_approval' with multi-talent tracking
    const { data: updatedShowcase, error: updateError } = await supabaseAdmin
      .from('showcases')
      .update({
        approval_status: 'pending_approval',
        total_talents: totalTalents,
        approved_talents: 0,
        change_requests: 0,
        approved_by_creator_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', showcaseId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating showcase:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to submit showcase' },
        { status: 500 }
      );
    }

    // 5. Send emails to ALL talents immediately
    try {
      // Get creator user info
      const { data: creator, error: creatorError } = await supabaseAdmin
        .from('users_profile')
        .select('display_name, handle')
        .eq('id', showcase.creator_user_id)
        .single();

      // Get gig info for context
      const { data: gig, error: gigError } = await supabaseAdmin
        .from('gigs')
        .select('title')
        .eq('id', showcase.gig_id)
        .single();

      if (!creatorError && !gigError) {
        console.log(`Sending approval notifications to ${totalTalents} talents for gig: ${gig.title}`);
        
        // Send email notification to each talent
        try {
          const { getShowcaseSubmittedForApprovalTemplate } = await import('@/lib/services/emails/templates/showcases.templates');
          const { emailService } = await import('@/lib/services/email-service');
          
          for (const talent of acceptedApplicants) {
            const template = getShowcaseSubmittedForApprovalTemplate({
              talentName: talent.users_profile[0]?.display_name,
              talentEmail: talent.users_profile[0]?.email,
              gigTitle: gig.title,
              creatorName: creator.display_name,
              showcaseId: showcaseId,
              totalTalents: totalTalents,
              platformUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://preset.ie'
            });
            
            await emailService.sendEmail(template);
          }
        } catch (emailError) {
          console.error('Error sending email notifications:', emailError);
          // Don't fail the request if email fails
        }
      }
    } catch (notificationError) {
      console.error('Error sending notifications:', notificationError);
      // Don't fail the request if notification fails
    }

    return NextResponse.json({
      success: true,
      showcase: updatedShowcase,
      totalTalents: totalTalents,
      message: 'Showcase submitted for approval'
    });

  } catch (error) {
    console.error('Submit showcase API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

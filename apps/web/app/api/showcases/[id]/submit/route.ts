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

    // 2. Update approval_status to 'pending_approval'
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: updatedShowcase, error: updateError } = await supabaseAdmin
      .from('showcases')
      .update({
        approval_status: 'pending_approval',
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

    // 3. Set approved_by_creator_at timestamp (already done above)

    // 4. Send notification to talent
    try {
      // Get talent user info
      const { data: talent, error: talentError } = await supabaseAdmin
        .from('users_profile')
        .select('display_name, handle, email')
        .eq('id', showcase.talent_user_id)
        .single();

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

      if (!talentError && !creatorError && !gigError) {
        console.log(`Sending approval notification to talent: ${talent.display_name} for gig: ${gig.title}`);
        
        // Send email notification
        try {
          const { getShowcaseSubmittedForApprovalTemplate } = await import('../../../lib/services/emails/templates/showcases.templates');
          const { emailService } = await import('../../../lib/services/email-service');
          
          const template = getShowcaseSubmittedForApprovalTemplate({
            talentName: talent.display_name,
            talentEmail: talent.email,
            gigTitle: gig.title,
            creatorName: creator.display_name,
            showcaseId: showcaseId,
            platformUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://preset.ie'
          });
          
          await emailService.sendEmail(template);
        } catch (emailError) {
          console.error('Error sending email notification:', emailError);
          // Don't fail the request if email fails
        }
      }
    } catch (notificationError) {
      console.error('Error sending notification:', notificationError);
      // Don't fail the request if notification fails
    }

    return NextResponse.json({
      success: true,
      showcase: updatedShowcase,
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

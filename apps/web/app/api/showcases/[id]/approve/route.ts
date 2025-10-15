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
    const { action, note } = await request.json(); // 'approve' | 'request_changes'
    
    // Validate action
    if (!action || !['approve', 'request_changes'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Must be "approve" or "request_changes"' },
        { status: 400 }
      );
    }
    
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

    // 1. Fetch showcase and validate it's from a gig
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

    if (!showcase.from_gig) {
      return NextResponse.json(
        { success: false, error: 'This showcase does not require approval' },
        { status: 400 }
      );
    }

    if (showcase.approval_status !== 'pending_approval') {
      return NextResponse.json(
        { success: false, error: 'Showcase is not pending approval' },
        { status: 400 }
      );
    }

    // 2. Verify user is talent in the gig
    if (showcase.talent_user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Only the talent can approve this showcase' },
        { status: 403 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    if (action === 'approve') {
      // 2. If approved: set approved_by_talent_at, status='approved', visibility='public'
      const { data: updatedShowcase, error: updateError } = await supabaseAdmin
        .from('showcases')
        .update({
          approval_status: 'approved',
          approved_by_talent_at: new Date().toISOString(),
          visibility: 'public',
          updated_at: new Date().toISOString()
        })
        .eq('id', showcaseId)
        .select()
        .single();

      if (updateError) {
        console.error('Error approving showcase:', updateError);
        return NextResponse.json(
          { success: false, error: 'Failed to approve showcase' },
          { status: 500 }
        );
      }

      // Send notification to creator
      try {
        const { data: creator, error: creatorError } = await supabaseAdmin
          .from('users_profile')
          .select('display_name, handle')
          .eq('id', showcase.creator_user_id)
          .single();

        const { data: gig, error: gigError } = await supabaseAdmin
          .from('gigs')
          .select('title')
          .eq('id', showcase.gig_id)
          .single();

        if (!creatorError && !gigError) {
          console.log(`Sending approval notification to creator: ${creator.display_name} for gig: ${gig.title}`);
          
          // TODO: Integrate with email service
          // await emailService.sendShowcaseApprovedNotification({
          //   creatorEmail: creator.email,
          //   creatorName: creator.display_name,
          //   gigTitle: gig.title,
          //   showcaseId: showcaseId,
          //   talentName: user.display_name
          // });
        }
      } catch (notificationError) {
        console.error('Error sending approval notification:', notificationError);
      }

      return NextResponse.json({
        success: true,
        showcase: updatedShowcase,
        message: 'Showcase approved and published'
      });

    } else if (action === 'request_changes') {
      // 3. If changes requested: status='changes_requested', notify creator
      const { data: updatedShowcase, error: updateError } = await supabaseAdmin
        .from('showcases')
        .update({
          approval_status: 'changes_requested',
          approval_notes: note || '',
          updated_at: new Date().toISOString()
        })
        .eq('id', showcaseId)
        .select()
        .single();

      if (updateError) {
        console.error('Error requesting changes:', updateError);
        return NextResponse.json(
          { success: false, error: 'Failed to request changes' },
          { status: 500 }
        );
      }

      // Send notification to creator
      try {
        const { data: creator, error: creatorError } = await supabaseAdmin
          .from('users_profile')
          .select('display_name, handle')
          .eq('id', showcase.creator_user_id)
          .single();

        const { data: gig, error: gigError } = await supabaseAdmin
          .from('gigs')
          .select('title')
          .eq('id', showcase.gig_id)
          .single();

        if (!creatorError && !gigError) {
          console.log(`Sending changes requested notification to creator: ${creator.display_name} for gig: ${gig.title}`);
          
          // TODO: Integrate with email service
          // await emailService.sendShowcaseChangesRequestedNotification({
          //   creatorEmail: creator.email,
          //   creatorName: creator.display_name,
          //   gigTitle: gig.title,
          //   showcaseId: showcaseId,
          //   talentName: user.display_name,
          //   feedback: note
          // });
        }
      } catch (notificationError) {
        console.error('Error sending changes notification:', notificationError);
      }

      return NextResponse.json({
        success: true,
        showcase: updatedShowcase,
        message: 'Changes requested from creator'
      });
    }

  } catch (error) {
    console.error('Approve showcase API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

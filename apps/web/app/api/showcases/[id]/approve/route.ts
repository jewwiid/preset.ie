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

    // 2. Verify user is accepted talent for this gig
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: application, error: applicationError } = await supabaseAdmin
      .from('applications')
      .select('*')
      .eq('gig_id', showcase.gig_id)
      .eq('applicant_user_id', user.id)
      .in('status', ['ACCEPTED', 'PENDING'])
      .single();

    if (applicationError || !application) {
      return NextResponse.json(
        { success: false, error: 'Only accepted talent can approve this showcase' },
        { status: 403 }
      );
    }

    if (action === 'approve') {
      // 3. Update talent's approval record
      const { error: approvalError } = await supabaseAdmin
        .from('showcase_talent_approvals')
        .update({
          action: 'approve',
          note: note || null,
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('showcase_id', showcaseId)
        .eq('talent_user_id', user.id);

      if (approvalError) {
        console.error('Error updating talent approval:', approvalError);
        return NextResponse.json(
          { success: false, error: 'Failed to record approval' },
          { status: 500 }
        );
      }

      // 4. Get updated approval counts
      const { data: approvals, error: approvalsError } = await supabaseAdmin
        .from('showcase_talent_approvals')
        .select('action')
        .eq('showcase_id', showcaseId);

      if (approvalsError) {
        console.error('Error fetching approvals:', approvalsError);
        return NextResponse.json(
          { success: false, error: 'Failed to fetch approval status' },
          { status: 500 }
        );
      }

      const approvedCount = approvals.filter(a => a.action === 'approve').length;
      const changeRequestCount = approvals.filter(a => a.action === 'request_changes').length;
      const totalTalents = approvals.length;

      // 5. Determine showcase status
      let newStatus = 'pending_approval';
      let visibility = 'draft';

      if (changeRequestCount > 0) {
        // ANY change request blocks publication
        newStatus = 'blocked_by_changes';
      } else if (approvedCount === totalTalents) {
        // ALL talents approved - publish!
        newStatus = 'approved';
        visibility = 'public';
      }

      // 6. Update showcase
      const { data: updatedShowcase, error: updateError } = await supabaseAdmin
        .from('showcases')
        .update({
          approval_status: newStatus,
          approved_talents: approvedCount,
          change_requests: changeRequestCount,
          last_action_by: user.id,
          last_action_at: new Date().toISOString(),
          visibility,
          approved_by_talent_at: newStatus === 'approved' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', showcaseId)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating showcase:', updateError);
        return NextResponse.json(
          { success: false, error: 'Failed to update showcase' },
          { status: 500 }
        );
      }

      // 7. Send immediate email to creator
      try {
        const { data: creator, error: creatorError } = await supabaseAdmin
          .from('users_profile')
          .select('display_name, handle, email')
          .eq('id', showcase.creator_user_id)
          .single();

        const { data: talent, error: talentError } = await supabaseAdmin
          .from('users_profile')
          .select('display_name, handle')
          .eq('id', user.id)
          .single();

        const { data: gig, error: gigError } = await supabaseAdmin
          .from('gigs')
          .select('title')
          .eq('id', showcase.gig_id)
          .single();

        if (!creatorError && !talentError && !gigError) {
          console.log(`Sending approval notification to creator: ${creator.display_name} for gig: ${gig.title}`);
          
          try {
            const { getShowcaseApprovedTemplate, getShowcasePartialApprovalTemplate } = await import('@/lib/services/emails/templates/showcases.templates');
            const { emailService } = await import('@/lib/services/email-service');
            
            if (newStatus === 'approved') {
              // All approved - showcase is live!
              const template = getShowcaseApprovedTemplate({
                creatorName: creator.display_name,
                creatorEmail: creator.email,
                gigTitle: gig.title,
                talentName: talent.display_name,
                totalTalents: totalTalents,
                approvedTalents: approvedCount,
                showcaseId: showcaseId,
                platformUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://preset.ie'
              });
              await emailService.sendEmail(template);
            } else {
              // Partial approval
              const template = getShowcasePartialApprovalTemplate({
                creatorName: creator.display_name,
                creatorEmail: creator.email,
                talentName: talent.display_name,
                gigTitle: gig.title,
                approvedCount: approvedCount,
                totalTalents: totalTalents,
                showcaseId: showcaseId,
                platformUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://preset.ie'
              });
              await emailService.sendEmail(template);
            }
          } catch (emailError) {
            console.error('Error sending email notification:', emailError);
            // Don't fail the request if email fails
          }
        }
      } catch (notificationError) {
        console.error('Error sending approval notification:', notificationError);
      }

      return NextResponse.json({
        success: true,
        showcase: updatedShowcase,
        status: newStatus,
        message: newStatus === 'approved' ? 'Showcase approved and published' : 'Approval recorded, waiting for other talents'
      });

    } else if (action === 'request_changes') {
      // 3. Update talent's approval record
      const { error: approvalError } = await supabaseAdmin
        .from('showcase_talent_approvals')
        .update({
          action: 'request_changes',
          note: note || null,
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('showcase_id', showcaseId)
        .eq('talent_user_id', user.id);

      if (approvalError) {
        console.error('Error updating talent approval:', approvalError);
        return NextResponse.json(
          { success: false, error: 'Failed to record change request' },
          { status: 500 }
        );
      }

      // 4. Get updated approval counts
      const { data: approvals, error: approvalsError } = await supabaseAdmin
        .from('showcase_talent_approvals')
        .select('action')
        .eq('showcase_id', showcaseId);

      if (approvalsError) {
        console.error('Error fetching approvals:', approvalsError);
        return NextResponse.json(
          { success: false, error: 'Failed to fetch approval status' },
          { status: 500 }
        );
      }

      const approvedCount = approvals.filter(a => a.action === 'approve').length;
      const changeRequestCount = approvals.filter(a => a.action === 'request_changes').length;
      const totalTalents = approvals.length;

      // 5. Update showcase - ANY change request blocks publication
      const { data: updatedShowcase, error: updateError } = await supabaseAdmin
        .from('showcases')
        .update({
          approval_status: 'blocked_by_changes',
          approved_talents: approvedCount,
          change_requests: changeRequestCount,
          last_action_by: user.id,
          last_action_at: new Date().toISOString(),
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

      // 6. Send notification to creator
      try {
        const { data: creator, error: creatorError } = await supabaseAdmin
          .from('users_profile')
          .select('display_name, handle, email')
          .eq('id', showcase.creator_user_id)
          .single();

        const { data: talent, error: talentError } = await supabaseAdmin
          .from('users_profile')
          .select('display_name, handle')
          .eq('id', user.id)
          .single();

        const { data: gig, error: gigError } = await supabaseAdmin
          .from('gigs')
          .select('title')
          .eq('id', showcase.gig_id)
          .single();

        if (!creatorError && !talentError && !gigError) {
          console.log(`Sending changes requested notification to creator: ${creator.display_name} for gig: ${gig.title}`);
          
          try {
            const { getShowcaseChangesRequestedTemplate } = await import('@/lib/services/emails/templates/showcases.templates');
            const { emailService } = await import('@/lib/services/email-service');
            
            const template = getShowcaseChangesRequestedTemplate({
              creatorName: creator.display_name,
              creatorEmail: creator.email,
              talentName: talent.display_name,
              gigTitle: gig.title,
              feedback: note,
              totalTalents: totalTalents,
              changeRequests: changeRequestCount,
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
        console.error('Error sending changes notification:', notificationError);
      }

      return NextResponse.json({
        success: true,
        showcase: updatedShowcase,
        status: 'blocked_by_changes',
        message: 'Changes requested - showcase blocked until resolved'
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

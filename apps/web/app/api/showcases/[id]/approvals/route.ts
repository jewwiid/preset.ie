import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(
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

    // Verify user has access to this showcase
    const { data: showcase, error: showcaseError } = await supabase
      .from('showcases')
      .select('creator_user_id, gig_id')
      .eq('id', showcaseId)
      .single();

    if (showcaseError || !showcase) {
      return NextResponse.json(
        { success: false, error: 'Showcase not found' },
        { status: 404 }
      );
    }

    // Check if user is creator or accepted talent
    const { data: application } = await supabaseAdmin
      .from('applications')
      .select('*')
      .eq('gig_id', showcase.gig_id)
      .eq('applicant_user_id', user.id)
      .in('status', ['ACCEPTED', 'PENDING'])
      .single();

    const isCreator = showcase.creator_user_id === user.id;
    const isTalent = !!application;

    if (!isCreator && !isTalent) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized access to showcase approvals' },
        { status: 403 }
      );
    }

    // Fetch approval status for all talents
    const { data: approvals, error: approvalsError } = await supabaseAdmin
      .from('showcase_talent_approvals')
      .select(`
        *,
        talent:talent_user_id(
          id,
          display_name,
          handle,
          avatar_url
        )
      `)
      .eq('showcase_id', showcaseId)
      .order('updated_at', { ascending: false });

    if (approvalsError) {
      console.error('Error fetching approvals:', approvalsError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch approval status' },
        { status: 500 }
      );
    }

    // Calculate summary statistics
    const totalTalents = approvals.length;
    const approvedCount = approvals.filter(a => a.action === 'approve').length;
    const changeRequestCount = approvals.filter(a => a.action === 'request_changes').length;
    const pendingCount = approvals.filter(a => a.action === 'pending').length;

    return NextResponse.json({
      success: true,
      approvals,
      summary: {
        totalTalents,
        approvedCount,
        changeRequestCount,
        pendingCount
      }
    });

  } catch (error) {
    console.error('Get approvals API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

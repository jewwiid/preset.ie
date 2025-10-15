import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
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

    // Get user profile
    const { data: userProfile, error: profileError } = await supabase
      .from('users_profile')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch showcases where user is either creator or talent and status requires action
    const { data: showcases, error: showcasesError } = await supabaseAdmin
      .from('showcases')
      .select(`
        id,
        title,
        description,
        gig_id,
        approval_status,
        created_at,
        updated_at,
        gigs!inner (
          title
        ),
        creator:creator_user_id (
          id,
          display_name,
          handle,
          avatar_url
        ),
        talent:talent_user_id (
          id,
          display_name,
          handle,
          avatar_url
        )
      `)
      .eq('from_gig', true)
      .in('approval_status', ['pending_approval', 'changes_requested', 'draft'])
      .or(`creator_user_id.eq.${userProfile.id},talent_user_id.eq.${userProfile.id}`)
      .order('updated_at', { ascending: false })
      .limit(10);

    if (showcasesError) {
      console.error('Error fetching pending showcases:', showcasesError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch pending showcases' },
        { status: 500 }
      );
    }

    // Transform the data to match the expected format
    const transformedShowcases = showcases?.map(showcase => ({
      id: showcase.id,
      title: showcase.title,
      description: showcase.description,
      gig_id: showcase.gig_id,
      gig_title: showcase.gigs.title,
      creator_user_id: showcase.creator.id,
      creator_name: showcase.creator.display_name,
      creator_handle: showcase.creator.handle,
      creator_avatar_url: showcase.creator.avatar_url,
      approval_status: showcase.approval_status,
      created_at: showcase.created_at,
      updated_at: showcase.updated_at
    })) || [];

    return NextResponse.json({
      success: true,
      showcases: transformedShowcases
    });

  } catch (error) {
    console.error('Pending approvals API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

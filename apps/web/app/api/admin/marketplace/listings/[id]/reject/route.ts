import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// POST /api/admin/marketplace/listings/[id]/reject - Reject a marketplace listing (admin only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      cookieStore.get('sb-access-token')?.value
    );

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('users_profile')
      .select('account_type')
      .eq('user_id', user.id)
      .single();

    if (!profile?.account_type?.includes('ADMIN')) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const listingId = resolvedParams.id;
    const body = await request.json();
    const { reason } = body;

    if (!reason) {
      return NextResponse.json(
        { error: 'Rejection reason is required' },
        { status: 400 }
      );
    }

    // Use the reject function we created
    const { data, error } = await supabase.rpc('reject_marketplace_listing', {
      p_listing_id: listingId,
      p_admin_user_id: user.id,
      p_rejection_reason: reason
    });

    if (error) {
      console.error('Error rejecting listing:', error);
      return NextResponse.json(
        { error: 'Failed to reject listing' },
        { status: 500 }
      );
    }

    const result = data?.[0];
    if (!result?.success) {
      return NextResponse.json(
        { error: result?.message || 'Rejection failed' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message
    });

  } catch (error) {
    console.error('Error in listing rejection API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

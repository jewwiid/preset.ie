import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// POST /api/admin/marketplace/listings/[id]/approve - Approve a marketplace listing (admin only)
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
      .select('role_flags')
      .eq('user_id', user.id)
      .single();

    if (!profile?.role_flags?.includes('ADMIN')) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const listingId = resolvedParams.id;

    // Use the approve function we created
    const { data, error } = await supabase.rpc('approve_marketplace_listing', {
      p_listing_id: listingId,
      p_admin_user_id: user.id
    });

    if (error) {
      console.error('Error approving listing:', error);
      return NextResponse.json(
        { error: 'Failed to approve listing' },
        { status: 500 }
      );
    }

    const result = data?.[0];
    if (!result?.success) {
      return NextResponse.json(
        { error: result?.message || 'Approval failed' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message
    });

  } catch (error) {
    console.error('Error in listing approval API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

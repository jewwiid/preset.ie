import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// POST /api/marketplace/presets/[id]/purchase - Purchase a preset with credits
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

    const resolvedParams = await params;
    const presetId = resolvedParams.id;

    if (!presetId) {
      return NextResponse.json(
        { error: 'Preset ID is required' },
        { status: 400 }
      );
    }

    // Use the purchase function we created
    const { data, error } = await supabase.rpc('purchase_preset_with_credits', {
      p_preset_id: presetId,
      p_buyer_user_id: user.id
    });

    if (error) {
      console.error('Error purchasing preset:', error);
      return NextResponse.json(
        { error: 'Failed to process purchase' },
        { status: 500 }
      );
    }

    const result = data?.[0];
    if (!result?.success) {
      return NextResponse.json(
        { error: result?.message || 'Purchase failed' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      purchaseId: result.purchase_id
    });

  } catch (error) {
    console.error('Error in preset purchase API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

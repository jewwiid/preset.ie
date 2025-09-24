import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// GET /api/marketplace/stats - Get marketplace statistics for the current user
export async function GET(request: NextRequest) {
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

    // Use the stats function we created
    const { data: stats, error } = await supabase.rpc('get_user_marketplace_stats', {
      p_user_id: user.id
    });

    if (error) {
      console.error('Error fetching marketplace stats:', error);
      return NextResponse.json(
        { error: 'Failed to fetch statistics' },
        { status: 500 }
      );
    }

    const userStats = stats?.[0] || {
      total_listings: 0,
      approved_listings: 0,
      pending_listings: 0,
      total_sales: 0,
      total_revenue: 0,
      total_purchases: 0,
      total_spent: 0
    };

    // Get user's current credit balance
    const { data: credits } = await supabase
      .from('user_credits')
      .select('current_balance, monthly_allowance, consumed_this_month')
      .eq('user_id', user.id)
      .single();

    // Get recent transactions
    const { data: recentTransactions } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    // Get recent purchases made by user
    const { data: recentPurchases } = await supabase
      .from('preset_purchases')
      .select(`
        *,
        presets:preset_id (
          name,
          category
        ),
        seller:seller_user_id (
          display_name,
          handle
        )
      `)
      .eq('buyer_user_id', user.id)
      .order('purchased_at', { ascending: false })
      .limit(5);

    // Get recent sales made by user
    const { data: recentSales } = await supabase
      .from('preset_purchases')
      .select(`
        *,
        presets:preset_id (
          name,
          category
        ),
        buyer:buyer_user_id (
          display_name,
          handle
        )
      `)
      .eq('seller_user_id', user.id)
      .order('purchased_at', { ascending: false })
      .limit(5);

    return NextResponse.json({
      stats: userStats,
      credits: {
        current_balance: credits?.current_balance || 0,
        monthly_allowance: credits?.monthly_allowance || 0,
        consumed_this_month: credits?.consumed_this_month || 0
      },
      recent_transactions: recentTransactions || [],
      recent_purchases: recentPurchases || [],
      recent_sales: recentSales || []
    });

  } catch (error) {
    console.error('Error in marketplace stats API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    // Initialize Supabase with service role for admin operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get platform credit stats
    const { data: creditPools } = await supabase
      .from('credit_pools')
      .select('*')
      .eq('status', 'active');

    // Get daily usage stats
    const today = new Date().toISOString().split('T')[0];
    const { data: dailyUsage } = await supabase
      .from('daily_usage_summary')
      .select('*')
      .eq('date', today)
      .single();

    // Get active users count
    const { data: activeUsers } = await supabase
      .from('user_credits')
      .select('user_id')
      .gt('current_balance', 0);

    // Get monthly cost
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { data: monthlyTransactions } = await supabase
      .from('credit_transactions')
      .select('cost_usd')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .eq('status', 'completed');

    const monthlyCost = monthlyTransactions?.reduce((sum, t) => sum + (t.cost_usd || 0), 0) || 0;

    // Get provider status
    const { data: providers } = await supabase
      .from('api_providers')
      .select('*')
      .eq('is_active', true);

    const platformCreditsRemaining = creditPools?.reduce((sum, pool) => sum + pool.available_balance, 0) || 0;
    const dailyUsageCount = dailyUsage?.total_credits_consumed || 0;
    const activeUsersCount = activeUsers?.length || 0;

    return NextResponse.json({
      platformCreditsRemaining,
      dailyUsage: dailyUsageCount,
      activeUsers: activeUsersCount,
      monthlyCost: monthlyCost.toFixed(2),
      providers: providers?.map(provider => ({
        name: provider.name,
        isHealthy: provider.is_active,
        costPerRequest: provider.cost_per_request,
        successRate: provider.success_rate_24h,
        creditsRemaining: creditPools?.find(p => p.provider === provider.name)?.available_balance || 0
      })) || []
    });

  } catch (error: any) {
    console.error('Credit stats API error:', error);
    
    return NextResponse.json(
      { error: 'Failed to fetch credit statistics' },
      { status: 500 }
    );
  }
}

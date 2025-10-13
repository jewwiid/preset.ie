// apps/web/app/api/admin/credit-stats/route.ts
// UPDATED VERSION - For Pay-Per-Generation Model

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Single comprehensive query for dashboard
    const { data: stats, error: statsError } = await supabase.rpc('get_dashboard_stats');

    if (statsError) {
      console.error('Stats query error:', statsError);
      // Fallback to manual queries if RPC doesn't exist
      return await getStatsManually(supabase);
    }

    return NextResponse.json(stats);
  } catch (error: any) {
    console.error('Credit stats API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch credit statistics' },
      { status: 500 }
    );
  }
}

// Fallback: Manual queries if RPC function doesn't exist
async function getStatsManually(supabase: any) {
  try {
    // Overview stats (last 30 days)
    const { data: overviewData } = await supabase
      .from('enhancement_tasks')
      .select(`
        id,
        user_id,
        provider,
        status,
        cost_usd,
        created_at
      `)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    // User credits summary
    const { data: userCredits } = await supabase
      .from('user_credits')
      .select('subscription_tier, current_balance, consumed_this_month');

    // Recent failures (last 7 days)
    const { data: recentFailures } = await supabase
      .from('enhancement_tasks')
      .select('id, error_message, created_at, provider')
      .eq('status', 'failed')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(10);

    // Refund count (last 7 days)
    const { data: refunds } = await supabase
      .from('credit_transactions')
      .select('id')
      .eq('transaction_type', 'refund')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    // Calculate stats
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const todayTasks = overviewData?.filter(t => new Date(t.created_at) >= today) || [];
    const monthTasks = overviewData?.filter(t => new Date(t.created_at) >= monthStart) || [];
    const last7Days = overviewData?.filter(
      t => new Date(t.created_at) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ) || [];

    // Provider breakdown
    const providerStats = (overviewData || []).reduce((acc: any, task: any) => {
      if (!acc[task.provider]) {
        acc[task.provider] = { total: 0, successful: 0, failed: 0, cost: 0 };
      }
      acc[task.provider].total++;
      if (task.status === 'completed') {
        acc[task.provider].successful++;
        acc[task.provider].cost += task.cost_usd || 0;
      }
      if (task.status === 'failed') {
        acc[task.provider].failed++;
      }
      return acc;
    }, {});

    // User credit breakdown by tier
    const creditsByTier = (userCredits || []).reduce((acc: any, uc: any) => {
      if (!acc[uc.subscription_tier]) {
        acc[uc.subscription_tier] = {
          count: 0,
          totalCredits: 0,
          totalConsumed: 0
        };
      }
      acc[uc.subscription_tier].count++;
      acc[uc.subscription_tier].totalCredits += uc.current_balance || 0;
      acc[uc.subscription_tier].totalConsumed += uc.consumed_this_month || 0;
      return acc;
    }, {});

    const response = {
      // Today's stats
      todayStats: {
        activeUsers: new Set(todayTasks.map(t => t.user_id)).size,
        generations: todayTasks.length,
        successful: todayTasks.filter(t => t.status === 'completed').length,
        failed: todayTasks.filter(t => t.status === 'failed').length,
        cost: todayTasks
          .filter(t => t.status === 'completed')
          .reduce((sum, t) => sum + (t.cost_usd || 0), 0)
      },

      // This month's stats
      monthStats: {
        generations: monthTasks.length,
        successful: monthTasks.filter(t => t.status === 'completed').length,
        failed: monthTasks.filter(t => t.status === 'failed').length,
        cost: monthTasks
          .filter(t => t.status === 'completed')
          .reduce((sum, t) => sum + (t.cost_usd || 0), 0)
      },

      // Success rate (last 7 days)
      successRate: last7Days.length > 0
        ? ((last7Days.filter(t => t.status === 'completed').length / last7Days.length) * 100).toFixed(1)
        : 'N/A',

      // Refunds
      refundsLast7Days: refunds?.length || 0,

      // User stats
      userStats: {
        usersWithCredits: (userCredits || []).filter(uc => uc.current_balance > 0).length,
        totalCreditsInCirculation: (userCredits || []).reduce(
          (sum, uc) => sum + (uc.current_balance || 0),
          0
        ),
        creditsByTier
      },

      // Provider breakdown
      providers: Object.entries(providerStats).map(([name, stats]: [string, any]) => ({
        name,
        totalCalls: stats.total,
        successful: stats.successful,
        failed: stats.failed,
        successRate: stats.total > 0 
          ? ((stats.successful / stats.total) * 100).toFixed(1) 
          : 'N/A',
        totalCost: stats.cost.toFixed(2)
      })),

      // Recent failures
      recentFailures: (recentFailures || []).slice(0, 5).map(f => ({
        id: f.id,
        provider: f.provider,
        error: f.error_message || 'Unknown error',
        time: new Date(f.created_at).toLocaleString()
      })),

      // System health
      systemHealth: {
        status: last7Days.length > 0 && 
                (last7Days.filter(t => t.status === 'failed').length / last7Days.length) > 0.2
          ? '⚠️ High failure rate'
          : '✅ Healthy',
        tasksLast24h: todayTasks.length,
        failureLast24h: todayTasks.filter(t => t.status === 'failed').length
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Manual stats error:', error);
    throw error;
  }
}


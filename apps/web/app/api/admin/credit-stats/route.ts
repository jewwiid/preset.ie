import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    // Initialize Supabase with service role for admin operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get today's date for filtering
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
    const sevenDaysAgo = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000));

    // 1. Active users with credits
    const { data: activeUsers } = await supabase
      .from('user_credits')
      .select('user_id, current_balance')
      .gt('current_balance', 0);

    // 2. Total credits in circulation
    const { data: totalCredits } = await supabase
      .from('user_credits')
      .select('current_balance');

    const totalCreditsInCirculation = totalCredits?.reduce((sum, user) => sum + user.current_balance, 0) || 0;

    // 3. Today's generations and costs
    const { data: todayTasks } = await supabase
      .from('enhancement_tasks')
      .select(`
        id,
        user_id,
        status,
        created_at,
        credit_transactions!inner(cost_usd)
      `)
      .gte('created_at', todayStart.toISOString());

    const generationsToday = todayTasks?.length || 0;
    const costTodayUsd = todayTasks?.reduce((sum, task) => {
      const cost = task.credit_transactions?.[0]?.cost_usd || 0;
      return sum + cost;
    }, 0) || 0;

    // 4. This month's generations and costs
    const { data: monthlyTasks } = await supabase
      .from('enhancement_tasks')
      .select(`
        id,
        status,
        created_at,
        credit_transactions!inner(cost_usd)
      `)
      .gte('created_at', thirtyDaysAgo.toISOString());

    const generationsThisMonth = monthlyTasks?.length || 0;
    const costThisMonthUsd = monthlyTasks?.reduce((sum, task) => {
      const cost = task.credit_transactions?.[0]?.cost_usd || 0;
      return sum + cost;
    }, 0) || 0;

    // 5. Success rate (last 7 days)
    const { data: weeklyTasks } = await supabase
      .from('enhancement_tasks')
      .select('status')
      .gte('created_at', sevenDaysAgo.toISOString());

    const totalWeeklyTasks = weeklyTasks?.length || 0;
    const successfulTasks = weeklyTasks?.filter(task => task.status === 'completed').length || 0;
    const successRatePct = totalWeeklyTasks > 0 ? Math.round((successfulTasks / totalWeeklyTasks) * 100) : 0;

    // 6. Refunds in last 7 days
    const { data: recentRefunds } = await supabase
      .from('credit_transactions')
      .select('credits_used')
      .eq('transaction_type', 'refund')
      .gte('created_at', sevenDaysAgo.toISOString());

    const refundsLast7Days = recentRefunds?.reduce((sum, refund) => sum + refund.credits_used, 0) || 0;

    // 7. Provider usage breakdown
    const { data: providerUsage } = await supabase
      .from('enhancement_tasks')
      .select(`
        provider,
        credit_transactions!inner(cost_usd)
      `)
      .gte('created_at', thirtyDaysAgo.toISOString());

    const providerStats: Record<string, { generations: number; cost: number }> = {};
    providerUsage?.forEach(task => {
      const provider = task.provider || 'unknown';
      const cost = task.credit_transactions?.[0]?.cost_usd || 0;
      
      if (!providerStats[provider]) {
        providerStats[provider] = { generations: 0, cost: 0 };
      }
      providerStats[provider].generations += 1;
      providerStats[provider].cost += cost;
    });

    const providerUsageArray = Object.entries(providerStats).map(([name, stats]) => ({
      name,
      generations: stats.generations,
      costUsd: Number(stats.cost.toFixed(2)),
      avgCostPerGeneration: stats.generations > 0 ? Number((stats.cost / stats.generations).toFixed(4)) : 0
    }));

    return NextResponse.json({
      // Updated stats for pay-per-generation model
      activeUsersToday: generationsToday > 0 ? new Set(todayTasks?.map(t => t.user_id)).size : 0,
      generationsToday,
      costTodayUsd: Number(costTodayUsd.toFixed(2)),
      generationsThisMonth,
      costThisMonthUsd: Number(costThisMonthUsd.toFixed(2)),
      successRate7DaysPct: successRatePct,
      refundsLast7Days,
      usersWithCredits: activeUsers?.length || 0,
      totalCreditsInCirculation,
      providerUsage: providerUsageArray,
      
      // Legacy fields for backward compatibility (will show 0 for unused features)
      platformCreditsRemaining: 0, // Not applicable in pay-per-generation model
      dailyUsage: generationsToday, // Show actual generations instead of fake credits
      activeUsers: activeUsers?.length || 0,
      monthlyCost: costThisMonthUsd.toFixed(2),
      providers: providerUsageArray.map(p => ({
        name: p.name,
        isHealthy: true, // Assume healthy if being used
        costPerRequest: p.avgCostPerGeneration,
        successRate: successRatePct, // Use overall success rate
        creditsRemaining: 0 // Not applicable in pay-per-generation model
      }))
    });

  } catch (error: any) {
    console.error('Credit stats API error:', error);
    
    return NextResponse.json(
      { error: 'Failed to fetch credit statistics' },
      { status: 500 }
    );
  }
}
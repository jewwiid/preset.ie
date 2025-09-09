import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isAdmin } from '../../../../middleware/adminAuth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  const { isValid } = await isAdmin(request);
  
  if (!isValid) {
    return NextResponse.json(
      { error: 'Unauthorized - Admin access required' },
      { status: 401 }
    );
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '7d'; // 7d, 30d, 90d, all
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    switch (period) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      default:
        startDate.setFullYear(2020); // Beginning of time for the platform
    }
    
    // Fetch various analytics
    const [
      userGrowth,
      creditUsage,
      popularEnhancements,
      revenueStats,
      platformHealth
    ] = await Promise.all([
      getUserGrowth(supabase, startDate, endDate),
      getCreditUsage(supabase, startDate, endDate),
      getPopularEnhancements(supabase, startDate, endDate),
      getRevenueStats(supabase, startDate, endDate),
      getPlatformHealth(supabase)
    ]);
    
    return NextResponse.json({
      success: true,
      data: {
        period,
        userGrowth,
        creditUsage,
        popularEnhancements,
        revenueStats,
        platformHealth
      }
    });
  } catch (error: any) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

async function getUserGrowth(supabase: any, startDate: Date, endDate: Date) {
  // User signups over time
  const { data: signups } = await supabase
    .from('users_profile')
    .select('created_at, subscription_tier')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .order('created_at');
  
  // Group by day
  const dailySignups: Record<string, number> = {};
  const tierBreakdown: Record<string, number> = { free: 0, plus: 0, pro: 0 };
  
  signups?.forEach((user: any) => {
    const date = new Date(user.created_at).toISOString().split('T')[0];
    dailySignups[date] = (dailySignups[date] || 0) + 1;
    tierBreakdown[user.subscription_tier || 'free']++;
  });
  
  return {
    total: signups?.length || 0,
    daily: dailySignups,
    byTier: tierBreakdown
  };
}

async function getCreditUsage(supabase: any, startDate: Date, endDate: Date) {
  // Platform credit consumption
  const { data: consumption } = await supabase
    .from('platform_credit_consumption')
    .select('provider, provider_credits_consumed, operation_type, created_at')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());
  
  // Group by provider and operation
  const byProvider: Record<string, number> = {};
  const byOperation: Record<string, number> = {};
  const dailyUsage: Record<string, number> = {};
  
  consumption?.forEach((record: any) => {
    byProvider[record.provider] = (byProvider[record.provider] || 0) + record.provider_credits_consumed;
    byOperation[record.operation_type] = (byOperation[record.operation_type] || 0) + 1;
    
    const date = new Date(record.created_at).toISOString().split('T')[0];
    dailyUsage[date] = (dailyUsage[date] || 0) + record.provider_credits_consumed;
  });
  
  // User credit purchases
  const { data: purchases } = await supabase
    .from('user_credit_purchases')
    .select('credits_purchased, amount_paid_usd')
    .eq('status', 'completed')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());
  
  const totalCreditssSold = purchases?.reduce((sum: number, p: any) => sum + p.credits_purchased, 0) || 0;
  const totalRevenue = purchases?.reduce((sum: number, p: any) => sum + Number(p.amount_paid_usd), 0) || 0;
  
  return {
    totalConsumed: Object.values(byProvider).reduce((sum, val) => sum + val, 0),
    byProvider,
    byOperation,
    dailyUsage,
    creditsSold: totalCreditssSold,
    revenue: totalRevenue
  };
}

async function getPopularEnhancements(supabase: any, startDate: Date, endDate: Date) {
  // Most used enhancement types
  const { data: tasks } = await supabase
    .from('enhancement_tasks')
    .select('enhancement_type')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());
  
  const enhancementCounts: Record<string, number> = {};
  tasks?.forEach((task: any) => {
    enhancementCounts[task.enhancement_type] = (enhancementCounts[task.enhancement_type] || 0) + 1;
  });
  
  return {
    total: tasks?.length || 0,
    byType: enhancementCounts,
    mostPopular: Object.entries(enhancementCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([type, count]) => ({ type, count }))
  };
}

async function getRevenueStats(supabase: any, startDate: Date, endDate: Date) {
  // Credit package sales
  const { data: sales } = await supabase
    .from('user_credit_purchases')
    .select('package_id, credits_purchased, amount_paid_usd, created_at')
    .eq('status', 'completed')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());
  
  const dailyRevenue: Record<string, number> = {};
  const packageSales: Record<string, { count: number; revenue: number }> = {};
  
  sales?.forEach((sale: any) => {
    const date = new Date(sale.created_at).toISOString().split('T')[0];
    const revenue = Number(sale.amount_paid_usd);
    
    dailyRevenue[date] = (dailyRevenue[date] || 0) + revenue;
    
    if (sale.package_id) {
      if (!packageSales[sale.package_id]) {
        packageSales[sale.package_id] = { count: 0, revenue: 0 };
      }
      packageSales[sale.package_id].count++;
      packageSales[sale.package_id].revenue += revenue;
    }
  });
  
  const totalRevenue = Object.values(dailyRevenue).reduce((sum, val) => sum + val, 0);
  const averageOrderValue = sales?.length ? totalRevenue / sales.length : 0;
  
  return {
    total: totalRevenue,
    daily: dailyRevenue,
    averageOrderValue,
    byPackage: packageSales,
    transactionCount: sales?.length || 0
  };
}

async function getPlatformHealth(supabase: any) {
  // Current platform credit levels
  const { data: credits } = await supabase
    .from('platform_credits')
    .select('provider, current_balance, low_balance_threshold, credit_ratio');
  
  const healthScores = credits?.map((credit: any) => {
    const ratio = credit.current_balance / credit.low_balance_threshold;
    let status = 'critical';
    if (ratio > 5) status = 'excellent';
    else if (ratio > 2) status = 'good';
    else if (ratio > 1) status = 'warning';
    
    return {
      provider: credit.provider,
      status,
      balance: credit.current_balance,
      threshold: credit.low_balance_threshold,
      userCreditsAvailable: Math.floor(credit.current_balance / credit.credit_ratio)
    };
  });
  
  // Active users (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const { count: activeUsers } = await supabase
    .from('enhancement_tasks')
    .select('user_id', { count: 'exact', head: true })
    .gte('created_at', sevenDaysAgo.toISOString());
  
  // Error rate (failed tasks)
  const { data: recentTasks } = await supabase
    .from('enhancement_tasks')
    .select('status')
    .gte('created_at', sevenDaysAgo.toISOString());
  
  const failedTasks = recentTasks?.filter((t: any) => t.status === 'failed').length || 0;
  const errorRate = recentTasks?.length ? (failedTasks / recentTasks.length) * 100 : 0;
  
  return {
    creditHealth: healthScores,
    activeUsers: activeUsers || 0,
    errorRate: errorRate.toFixed(2),
    systemStatus: errorRate < 5 ? 'healthy' : errorRate < 10 ? 'degraded' : 'critical'
  };
}
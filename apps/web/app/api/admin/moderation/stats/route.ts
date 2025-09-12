import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Verify admin status
    const { data: profile } = await supabase
      .from('users_profile')
      .select('role_flags')
      .eq('user_id', user.id)
      .single();

    if (!profile?.role_flags?.includes('ADMIN')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get basic counts
    const [
      { count: pendingItems },
      { count: totalItems },
      resolvedTodayResult,
      { data: severityData },
      { data: flagsData }
    ] = await Promise.all([
      // Pending items count
      supabase
        .from('content_moderation_queue')
        .select('*', { count: 'exact', head: true })
        .in('status', ['pending', 'reviewing']),
      
      // Total items count
      supabase
        .from('content_moderation_queue')
        .select('*', { count: 'exact', head: true }),
      
      // Items resolved today
      supabase
        .from('content_moderation_queue')
        .select('*', { count: 'exact', head: true })
        .in('status', ['approved', 'rejected'])
        .gte('resolved_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
      
      // Average severity score
      supabase
        .from('content_moderation_queue')
        .select('severity_score')
        .not('severity_score', 'is', null),
      
      // Top violation flags
      supabase
        .from('content_moderation_queue')
        .select('flagged_reason')
        .not('flagged_reason', 'is', null)
    ]);

    // Calculate average severity
    const averageSeverity = severityData && severityData.length > 0 
      ? severityData.reduce((sum: any, item: any) => sum + (item.severity_score || 0), 0) / severityData.length
      : 0;

    // Process top flags
    const flagCounts: Record<string, number> = {};
    flagsData?.forEach((item: any) => {
      if (item.flagged_reason && Array.isArray(item.flagged_reason)) {
        item.flagged_reason.forEach((flag: string) => {
          flagCounts[flag] = (flagCounts[flag] || 0) + 1;
        });
      }
    });

    const topFlags = Object.entries(flagCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([flag, count]) => ({
        flag,
        count,
        percentage: totalItems ? Math.round((count / totalItems) * 100) : 0
      }));

    // Process results with fallbacks
    const stats = {
      pending_items: pendingItems || 0,
      total_items: totalItems || 0,
      resolved_today: resolvedTodayResult.count || 0,
      average_severity: averageSeverity,
      resolution_time_hours: 0, // Will calculate this differently
      top_flags: topFlags
    };

    // Get recent activity (last 7 days)
    const { data: recentActivity } = await supabase
      .from('content_moderation_queue')
      .select('status, created_at, resolved_at')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(100);

    // Process activity data for charts
    const activityByDay: Record<string, { flagged: number; resolved: number }> = {};
    
    recentActivity?.forEach((item: any) => {
      const flaggedDate = new Date(item.created_at).toISOString().split('T')[0];
      
      if (!activityByDay[flaggedDate]) {
        activityByDay[flaggedDate] = { flagged: 0, resolved: 0 };
      }
      
      activityByDay[flaggedDate].flagged++;
      
      if (item.resolved_at) {
        const resolvedDate = new Date(item.resolved_at).toISOString().split('T')[0];
        if (!activityByDay[resolvedDate]) {
          activityByDay[resolvedDate] = { flagged: 0, resolved: 0 };
        }
        activityByDay[resolvedDate].resolved++;
      }
    });

    // Get user risk distribution (simplified for now)
    const { data: userActivity } = await supabase
      .from('content_moderation_queue')
      .select('user_id, severity_score')
      .in('status', ['pending', 'reviewing'])
      .limit(100);

    const riskDistribution = {
      low: 0,      // 0-40
      medium: 0,   // 41-70
      high: 0,     // 71-100
    };

    userActivity?.forEach((item: any) => {
      const severity = item.severity_score || 0;
      if (severity <= 40) riskDistribution.low++;
      else if (severity <= 70) riskDistribution.medium++;
      else riskDistribution.high++;
    });

    return NextResponse.json({
      ...stats,
      activity_by_day: activityByDay,
      risk_distribution: riskDistribution,
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching moderation stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch moderation statistics' },
      { status: 500 }
    );
  }
}

// Create helper functions as database functions if they don't exist
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Verify admin status
    const { data: profile } = await supabase
      .from('users_profile')
      .select('role_flags')
      .eq('user_id', user.id)
      .single();

    if (!profile?.role_flags?.includes('ADMIN')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Create helper functions
    await supabase.rpc('create_moderation_stats_functions');

    return NextResponse.json({ success: true, message: 'Helper functions created' });

  } catch (error) {
    console.error('Error creating helper functions:', error);
    return NextResponse.json(
      { error: 'Failed to create helper functions' },
      { status: 500 }
    );
  }
}
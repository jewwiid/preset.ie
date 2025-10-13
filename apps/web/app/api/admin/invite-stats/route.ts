import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/admin/invite-stats
 * Get comprehensive statistics for the invite system
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if user is authenticated and is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('users_profile')
      .select('role_flags')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile?.role_flags?.includes('ADMIN')) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Get invite codes statistics
    const { data: allCodes } = await supabase
      .from('invite_codes')
      .select('id, code, status, created_at, used_at, created_by_user_id, used_by_user_id');

    const totalCodes = allCodes?.length || 0;
    const activeCodes = allCodes?.filter(c => c.status === 'active').length || 0;
    const usedCodes = allCodes?.filter(c => c.status === 'used').length || 0;
    const expiredCodes = allCodes?.filter(c => c.status === 'expired').length || 0;

    // Get referral credits statistics
    const { data: allCredits } = await supabase
      .from('referral_credits')
      .select('id, status, credits_awarded, created_at, awarded_at, referrer_user_id, referred_user_id');

    const totalReferrals = allCredits?.filter(c => c.status === 'awarded').length || 0;
    const pendingReferrals = allCredits?.filter(c => c.status === 'pending').length || 0;
    const totalCreditsAwarded = allCredits
      ?.filter(c => c.status === 'awarded')
      .reduce((sum, c) => sum + c.credits_awarded, 0) || 0;

    // Get users who signed up with invite codes
    const { data: invitedUsers, count: totalInvitedUsers } = await supabase
      .from('users_profile')
      .select('id, display_name, created_at, invited_by_code, profile_completed_at', { count: 'exact' })
      .not('invited_by_code', 'is', null);

    // Get users who have completed their profiles
    const profileCompletedCount = invitedUsers?.filter(u => u.profile_completed_at).length || 0;

    // Get recent invite codes (last 20)
    const { data: recentCodes } = await supabase
      .from('invite_codes')
      .select(`
        id,
        code,
        status,
        created_at,
        used_at,
        created_by_user_id,
        used_by_user_id,
        expires_at
      `)
      .order('created_at', { ascending: false })
      .limit(20);

    // Get top referrers (users with most successful referrals)
    const { data: topReferrers } = await supabase
      .from('users_profile')
      .select(`
        id,
        display_name,
        total_referrals,
        invite_code,
        created_at
      `)
      .gt('total_referrals', 0)
      .order('total_referrals', { ascending: false })
      .limit(10);

    // Get recent signups with invite codes
    const { data: recentSignups } = await supabase
      .from('users_profile')
      .select(`
        id,
        display_name,
        created_at,
        invited_by_code,
        profile_completed_at
      `)
      .not('invited_by_code', 'is', null)
      .order('created_at', { ascending: false })
      .limit(20);

    // Calculate conversion rate
    const conversionRate = usedCodes > 0
      ? Math.round((profileCompletedCount / usedCodes) * 100)
      : 0;

    // Get daily signup stats (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: dailySignups } = await supabase
      .from('users_profile')
      .select('created_at, invited_by_code')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .not('invited_by_code', 'is', null)
      .order('created_at', { ascending: true });

    // Group by day
    const signupsByDay = dailySignups?.reduce((acc: any, signup) => {
      const date = new Date(signup.created_at).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {}) || {};

    return NextResponse.json({
      stats: {
        totalCodes,
        activeCodes,
        usedCodes,
        expiredCodes,
        totalReferrals,
        pendingReferrals,
        totalCreditsAwarded,
        totalInvitedUsers: totalInvitedUsers || 0,
        profileCompletedCount,
        conversionRate
      },
      recentCodes: recentCodes?.map(code => ({
        id: code.id,
        code: code.code,
        status: code.status,
        created_at: code.created_at,
        used_at: code.used_at,
        expires_at: code.expires_at,
        isAdminCode: !code.created_by_user_id
      })) || [],
      topReferrers: topReferrers?.map(user => ({
        id: user.id,
        displayName: user.display_name,
        totalReferrals: user.total_referrals,
        inviteCode: user.invite_code,
        joinedAt: user.created_at
      })) || [],
      recentSignups: recentSignups?.map(user => ({
        id: user.id,
        displayName: user.display_name,
        inviteCode: user.invited_by_code,
        signedUpAt: user.created_at,
        profileCompleted: !!user.profile_completed_at,
        completedAt: user.profile_completed_at
      })) || [],
      signupsByDay
    });

  } catch (error) {
    console.error('Invite stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

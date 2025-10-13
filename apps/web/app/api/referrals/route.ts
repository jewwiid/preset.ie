import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/referrals
 * Get user's referral stats and invite code
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user profile with referral data
    const { data: profile, error: profileError } = await supabase
      .from('users_profile')
      .select('id, invite_code, total_referrals, display_name')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Get referral credits earned
    const { data: referralCredits, error: creditsError } = await supabase
      .from('referral_credits')
      .select(`
        id,
        referred_user_id,
        credits_awarded,
        status,
        awarded_at,
        created_at
      `)
      .eq('referrer_user_id', profile.id)
      .order('created_at', { ascending: false });

    if (creditsError) {
      console.error('Error fetching referral credits:', creditsError);
    }

    // Calculate total credits earned
    const totalCreditsEarned = referralCredits
      ?.filter(rc => rc.status === 'awarded')
      .reduce((sum, rc) => sum + rc.credits_awarded, 0) ?? 0;

    // Get pending referrals (users who signed up but haven't completed profile)
    const { data: pendingReferrals, error: pendingError } = await supabase
      .from('referral_credits')
      .select('id')
      .eq('referrer_user_id', profile.id)
      .eq('status', 'pending');

    const pendingCount = pendingReferrals?.length ?? 0;

    // Get details of successful referrals
    const successfulReferrals = referralCredits
      ?.filter(rc => rc.status === 'awarded')
      .map(rc => ({
        id: rc.id,
        creditsEarned: rc.credits_awarded,
        awardedAt: rc.awarded_at,
        referredUserId: rc.referred_user_id
      })) ?? [];

    return NextResponse.json({
      inviteCode: profile.invite_code,
      totalReferrals: profile.total_referrals,
      totalCreditsEarned,
      pendingReferrals: pendingCount,
      successfulReferrals,
      shareUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://presetie.com'}/auth/signup?invite=${profile.invite_code}`
    });

  } catch (error) {
    console.error('Get referrals error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/referrals/generate-code
 * Generate a new invite code for user (if they don't have one)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('users_profile')
      .select('id, invite_code')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // If user already has a code, return it
    if (profile.invite_code) {
      return NextResponse.json({
        inviteCode: profile.invite_code,
        message: 'You already have an invite code',
        isNew: false
      });
    }

    // Generate new code by calling the database function
    const { data: codeData, error: codeError } = await supabase
      .rpc('generate_invite_code');

    if (codeError || !codeData) {
      console.error('Error generating invite code:', codeError);
      return NextResponse.json(
        { error: 'Failed to generate invite code' },
        { status: 500 }
      );
    }

    const newCode = codeData;

    // Update user profile with new code
    const { error: updateError } = await supabase
      .from('users_profile')
      .update({ invite_code: newCode })
      .eq('id', profile.id);

    if (updateError) {
      console.error('Error updating user with invite code:', updateError);
      return NextResponse.json(
        { error: 'Failed to save invite code' },
        { status: 500 }
      );
    }

    // Create invite code record
    const { error: insertError } = await supabase
      .from('invite_codes')
      .insert({
        code: newCode,
        created_by_user_id: profile.id,
        status: 'active'
      });

    if (insertError) {
      console.error('Error creating invite code record:', insertError);
      // Continue anyway - user has code in profile
    }

    return NextResponse.json({
      inviteCode: newCode,
      message: 'Invite code generated successfully',
      isNew: true
    });

  } catch (error) {
    console.error('Generate invite code error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

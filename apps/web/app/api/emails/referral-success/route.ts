import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getReferralSuccessTemplate } from '@/lib/services/emails/templates/referrals.templates';

/**
 * POST /api/emails/referral-success
 * Send email to referrer when their invitee completes profile
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { referrerUserId, referrerName, creditsEarned = 5, newUserName, totalReferrals = 1 } = body;

    if (!referrerUserId) {
      return NextResponse.json(
        { error: 'Referrer user ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get referrer's email and total referrals
    const { data: authUser } = await supabase.auth.admin.getUserById(referrerUserId);

    if (!authUser || !authUser.user?.email) {
      return NextResponse.json(
        { error: 'Referrer email not found' },
        { status: 404 }
      );
    }

    const referrerEmail = authUser.user.email;

    // Get total referrals from profile if not provided
    let actualTotalReferrals = totalReferrals;
    if (!totalReferrals || totalReferrals === 1) {
      const { data: profile } = await supabase
        .from('users_profile')
        .select('total_referrals')
        .eq('user_id', referrerUserId)
        .single();

      if (profile?.total_referrals) {
        actualTotalReferrals = profile.total_referrals;
      }
    }

    // Send email via Plunk
    try {
      const plunkApiKey = process.env.PLUNK_API_KEY;

      if (!plunkApiKey) {
        console.error('PLUNK_API_KEY not configured');
        return NextResponse.json(
          { error: 'Email service not configured' },
          { status: 500 }
        );
      }

      const emailBody = getReferralSuccessTemplate(
        referrerName,
        newUserName || 'A user',
        creditsEarned,
        actualTotalReferrals,
        referrerEmail,
        referrerUserId
      );

      const response = await fetch('https://api.useplunk.com/v1/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${plunkApiKey}`
        },
        body: JSON.stringify({
          to: referrerEmail,
          subject: `You earned ${creditsEarned} credits`,
          body: emailBody
        })
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Plunk API error:', error);
        return NextResponse.json(
          { error: 'Failed to send email' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Referral success email sent'
      });

    } catch (emailError) {
      console.error('Error sending referral email:', emailError);
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Referral email error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

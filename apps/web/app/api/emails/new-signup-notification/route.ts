import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getNewSignupNotificationTemplate } from '@/lib/services/emails/templates/referrals.templates';

/**
 * POST /api/emails/new-signup-notification
 * Send email to referrer when someone signs up with their invite code
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { referrerUserId, referrerName, newUserName, inviteCode } = body;

    if (!referrerUserId || !inviteCode) {
      return NextResponse.json(
        { error: 'Referrer user ID and invite code are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get referrer's email
    const { data: authUser } = await supabase.auth.admin.getUserById(referrerUserId);

    if (!authUser || !authUser.user?.email) {
      console.log('Referrer email not found for user:', referrerUserId);
      return NextResponse.json(
        { error: 'Referrer email not found' },
        { status: 404 }
      );
    }

    const referrerEmail = authUser.user.email;

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

      const emailBody = getNewSignupNotificationTemplate(
        referrerName,
        newUserName || 'A new user',
        inviteCode,
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
          subject: 'Someone just used your invite code',
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
        message: 'New signup notification sent'
      });

    } catch (emailError) {
      console.error('Error sending signup notification:', emailError);
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Signup notification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

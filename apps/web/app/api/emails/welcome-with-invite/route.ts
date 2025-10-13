import { NextRequest, NextResponse } from 'next/server';
import { getWelcomeWithInviteTemplate } from '@/lib/services/emails/templates/referrals.templates';

/**
 * POST /api/emails/welcome-with-invite
 * Send welcome email to new user with their personal invite code
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, inviteCode, authUserId } = body;

    if (!email || !name || !inviteCode) {
      return NextResponse.json(
        { error: 'Email, name, and invite code are required' },
        { status: 400 }
      );
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

      const emailBody = getWelcomeWithInviteTemplate(
        name,
        inviteCode,
        email,
        authUserId
      );

      const response = await fetch('https://api.useplunk.com/v1/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${plunkApiKey}`
        },
        body: JSON.stringify({
          to: email,
          subject: 'Welcome to Preset - Here\'s your invite code',
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
        message: 'Welcome email sent'
      });

    } catch (emailError) {
      console.error('Error sending welcome email:', emailError);
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Welcome email error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import {
  getNewSignupNotificationTemplate,
  getReferralSuccessTemplate,
  getWelcomeWithInviteTemplate
} from '@/lib/services/emails/templates/referrals.templates';

/**
 * POST /api/emails/test-invite-emails
 * Send test invite system emails to a specified email address
 * Body: { to: string, emailType: 'signup' | 'completion' | 'welcome' }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, emailType = 'signup' } = body;

    if (!to) {
      return NextResponse.json(
        { error: 'Email address (to) is required' },
        { status: 400 }
      );
    }

    const plunkApiKey = process.env.PLUNK_API_KEY;

    if (!plunkApiKey) {
      return NextResponse.json(
        { error: 'PLUNK_API_KEY not configured' },
        { status: 500 }
      );
    }

    let subject = '';
    let body_html = '';

    const testCode = 'TEST1234';
    const testName = 'Sarah Test';
    const testNewUser = 'John Doe';

    // Choose email template based on type using brand-consistent templates
    switch (emailType) {
      case 'signup':
        subject = 'Someone just used your invite code';
        body_html = getNewSignupNotificationTemplate(
          testName,
          testNewUser,
          testCode,
          to,
          undefined
        );
        break;

      case 'completion':
        subject = 'You earned 5 credits';
        body_html = getReferralSuccessTemplate(
          testName,
          testNewUser,
          5,
          3, // totalReferrals
          to,
          undefined
        );
        break;

      case 'welcome':
        subject = 'Welcome to Preset - Here\'s your invite code';
        body_html = getWelcomeWithInviteTemplate(
          testName,
          testCode,
          to,
          undefined
        );
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid emailType. Use: signup, completion, or welcome' },
          { status: 400 }
        );
    }

    // Send email via Plunk
    const response = await fetch('https://api.useplunk.com/v1/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${plunkApiKey}`
      },
      body: JSON.stringify({
        to: to,
        subject: subject,
        body: body_html
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Plunk API error:', error);
      return NextResponse.json(
        { error: 'Failed to send email', details: error },
        { status: 500 }
      );
    }

    const result = await response.json();

    return NextResponse.json({
      success: true,
      message: `Test ${emailType} email sent to ${to}`,
      plunkResponse: result
    });

  } catch (error) {
    console.error('Test email error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}

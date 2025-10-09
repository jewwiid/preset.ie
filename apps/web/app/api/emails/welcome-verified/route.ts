import { NextRequest, NextResponse } from 'next/server';
import { sendWelcomeAfterVerification } from '@/lib/services/emails/events/verification.events';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { authUserId, email, name, role } = body;

    if (!authUserId || !email || !name || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await sendWelcomeAfterVerification({
      authUserId,
      email,
      name,
      role,
    });

    return NextResponse.json({
      success: true,
      message: 'Welcome email sent',
    });

  } catch (error) {
    console.error('Error sending welcome email:', error);
    return NextResponse.json(
      { error: 'Failed to send welcome email' },
      { status: 500 }
    );
  }
}


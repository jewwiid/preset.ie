import { NextRequest, NextResponse } from 'next/server';
import { sendVerificationEmail } from '@/lib/services/emails/events/verification.events';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { authUserId, email, name, verificationToken } = body;

    if (!authUserId || !email || !name || !verificationToken) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await sendVerificationEmail({
      authUserId,
      email,
      name,
      verificationToken,
    });

    return NextResponse.json({
      success: true,
      message: 'Verification email sent',
    });

  } catch (error) {
    console.error('Error sending verification email:', error);
    return NextResponse.json(
      { error: 'Failed to send verification email' },
      { status: 500 }
    );
  }
}


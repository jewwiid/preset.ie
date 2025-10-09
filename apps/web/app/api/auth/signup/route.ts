import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, firstName, lastName, role, dateOfBirth } = body;

    if (!email || !password || !firstName || !lastName || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Create auth user with signup data in metadata
    // Profile will be created AFTER email verification
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          full_name: `${firstName} ${lastName}`,
          role,
          date_of_birth: dateOfBirth,
          email_verified: false,
        },
      },
    });

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

    // Generate verification token
    const verificationToken = `${authData.user.id}:${Math.floor(Date.now() / 1000)}:${Math.random().toString(36).substring(2, 18)}`;

    // Send verification email
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://presetie.com';
      await fetch(`${baseUrl}/api/emails/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authUserId: authData.user.id,
          email: email,
          name: `${firstName} ${lastName}`,
          verificationToken,
        }),
      });
    } catch (emailError) {
      console.error('Error sending verification email:', emailError);
      // Continue anyway - user exists, they can request resend
    }

    return NextResponse.json({
      success: true,
      user: authData.user,
      message: 'Account created! Please check your email to verify your account.',
      requiresVerification: true,
    });

  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}


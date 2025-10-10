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
      // Check if user already exists
      if (authError.message.includes('already registered') || authError.message.includes('User already registered')) {
        // User exists - check if they're verified
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        const adminClient = await import('@supabase/supabase-js').then(mod => 
          mod.createClient(supabaseUrl, supabaseServiceKey, {
            auth: { autoRefreshToken: false, persistSession: false }
          })
        );

        // Find the user
        const { data: { users }, error: lookupError } = await adminClient.auth.admin.listUsers();
        const existingUser = users?.find(u => u.email === email);

        if (existingUser) {
          // Check if user has verified profile
          const { data: profile } = await adminClient
            .from('users_profile')
            .select('email_verified')
            .eq('user_id', existingUser.id)
            .single();

          if (!profile || !profile.email_verified) {
            // User exists but not verified - resend verification email
            const verificationToken = `${existingUser.id}:${Math.floor(Date.now() / 1000)}:${Math.random().toString(36).substring(2, 18)}`;

            try {
              const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://presetie.com';
              await fetch(`${baseUrl}/api/emails/verify-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  authUserId: existingUser.id,
                  email: email,
                  name: `${firstName} ${lastName}`,
                  verificationToken,
                }),
              });

              return NextResponse.json({
                success: true,
                message: 'Account already exists but not verified. We have sent you a new verification email.',
                requiresVerification: true,
                isResend: true,
              });
            } catch (emailError) {
              console.error('Error resending verification:', emailError);
            }
          } else {
            // User exists and is verified - tell them to sign in
            return NextResponse.json({
              error: 'An account with this email already exists. Please sign in instead.',
              shouldSignIn: true,
            }, { status: 400 });
          }
        }
      }

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


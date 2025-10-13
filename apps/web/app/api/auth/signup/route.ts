import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, firstName, lastName, role, dateOfBirth, inviteCode } = body;

    if (!email || !password || !firstName || !lastName || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check if invite-only mode is active
    const { data: inviteSetting } = await supabase
      .from('platform_settings')
      .select('value')
      .eq('key', 'invite_only_mode')
      .single();

    const inviteOnlyMode = inviteSetting?.value ?? false;

    // If invite-only mode is active, validate invite code
    if (inviteOnlyMode) {
      if (!inviteCode) {
        return NextResponse.json(
          {
            error: 'Invite code required',
            message: 'An invite code is required to sign up at this time. Please request an invite.'
          },
          { status: 400 }
        );
      }

      // Validate the invite code
      const normalizedCode = inviteCode.trim().toUpperCase();
      const { data: inviteCodeData, error: codeError } = await supabase
        .from('invite_codes')
        .select('id, status, used_by_user_id, expires_at')
        .eq('code', normalizedCode)
        .single();

      if (codeError || !inviteCodeData) {
        return NextResponse.json(
          {
            error: 'Invalid invite code',
            message: 'The invite code you entered is not valid.'
          },
          { status: 400 }
        );
      }

      // Check if code is already used
      if (inviteCodeData.status === 'used') {
        return NextResponse.json(
          {
            error: 'Invite code already used',
            message: 'This invite code has already been used.'
          },
          { status: 400 }
        );
      }

      // Check if code is expired
      if (inviteCodeData.status === 'expired' ||
          (inviteCodeData.expires_at && new Date(inviteCodeData.expires_at) < new Date())) {
        return NextResponse.json(
          {
            error: 'Invite code expired',
            message: 'This invite code has expired.'
          },
          { status: 400 }
        );
      }
    }

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
          invited_by_code: inviteCode ? inviteCode.trim().toUpperCase() : null,
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
        const existingUser = users?.find((u: any) => u.email === email);

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

    // Mark invite code as used and notify referrer (if provided)
    if (inviteCode) {
      try {
        const normalizedCode = inviteCode.trim().toUpperCase();

        // Get the invite code details to find creator
        const { data: codeData } = await supabase
          .from('invite_codes')
          .select('id, created_by_user_id')
          .eq('code', normalizedCode)
          .single();

        if (codeData) {
          // Mark code as used
          await supabase
            .from('invite_codes')
            .update({
              status: 'used',
              used_at: new Date().toISOString(),
              used_by_user_id: authData.user.id
            })
            .eq('code', normalizedCode);

          // Send notification email to referrer (if they exist and it's not an admin code)
          if (codeData.created_by_user_id) {
            try {
              // Get referrer's profile
              const { data: referrerProfile } = await supabase
                .from('users_profile')
                .select('user_id, display_name')
                .eq('id', codeData.created_by_user_id)
                .single();

              if (referrerProfile) {
                // Send signup notification email
                const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://presetie.com';
                await fetch(`${baseUrl}/api/emails/new-signup-notification`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    referrerUserId: referrerProfile.user_id,
                    referrerName: referrerProfile.display_name,
                    newUserName: `${firstName} ${lastName}`,
                    inviteCode: normalizedCode
                  })
                });
              }
            } catch (emailError) {
              console.error('Error sending signup notification:', emailError);
              // Continue anyway - don't block signup
            }
          }
        }
      } catch (inviteError) {
        console.error('Error marking invite code as used:', inviteError);
        // Don't block signup on this error
      }
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


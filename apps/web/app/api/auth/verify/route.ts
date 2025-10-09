import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.redirect(new URL('/auth/verification-error?reason=missing-token', request.url));
    }

    const supabase = await createClient();

    // Verify the token format (userId:timestamp:randomString)
    const [userId, timestamp, signature] = token.split(':');

    if (!userId || !timestamp || !signature) {
      return NextResponse.redirect(new URL('/auth/verification-error?reason=invalid-token', request.url));
    }

    // Check if token is expired (24 hours)
    const tokenTime = parseInt(timestamp) * 1000; // Convert seconds to milliseconds
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;

    if (now - tokenTime > twentyFourHours) {
      return NextResponse.redirect(new URL('/auth/verification-error?reason=expired', request.url));
    }

    // Update user profile to mark email as verified
    const { data: profile, error: profileError } = await supabase
      .from('users_profile')
      .update({
        email_verified: true,
        email_verified_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select('id, display_name, role_flags, user_id')
      .single();

    if (profileError || !profile) {
      console.error('Error verifying email:', profileError);
      return NextResponse.redirect(new URL('/auth/verification-error?reason=user-not-found', request.url));
    }

    // Welcome email will be automatically sent by the database trigger
    // when email_verified is set to true

    return NextResponse.redirect(new URL('/auth/verification-success', request.url));

  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.redirect(new URL('/auth/verification-error?reason=server-error', request.url));
  }
}


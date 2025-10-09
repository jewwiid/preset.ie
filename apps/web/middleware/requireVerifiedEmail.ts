import { createClient } from '@/lib/supabase/server';
import { NextResponse, NextRequest } from 'next/server';

/**
 * Middleware to ensure user has verified their email
 * Redirects unverified users to a verification pending page
 */
export async function requireVerifiedEmail(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }

  // Check if user has a profile (profile is only created after verification)
  const { data: profile } = await supabase
    .from('users_profile')
    .select('email_verified')
    .eq('user_id', user.id)
    .single();

  // If no profile exists, user hasn't verified email yet
  if (!profile) {
    return NextResponse.redirect(new URL('/auth/verification-pending', request.url));
  }

  // If profile exists but email not verified (edge case from old flow)
  if (!profile.email_verified) {
    return NextResponse.redirect(new URL('/auth/verification-pending', request.url));
  }

  // User is verified, allow access
  return NextResponse.next();
}


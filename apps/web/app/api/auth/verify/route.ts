import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.redirect(new URL('/auth/verification-error?reason=missing-token', request.url));
    }

    // Create Supabase admin client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase configuration');
      return NextResponse.redirect(new URL('/auth/verification-error?reason=server-error', request.url));
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

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

    // Get user to retrieve metadata
    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(userId);

    if (userError || !user) {
      console.error('Error getting user:', userError);
      return NextResponse.redirect(new URL('/auth/verification-error?reason=user-not-found', request.url));
    }

    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('users_profile')
      .select('id, email_verified')
      .eq('user_id', userId)
      .single();

    if (existingProfile) {
      // Profile exists - just update verification status
      if (existingProfile.email_verified) {
        // Already verified
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }

      // Mark as verified (will trigger welcome email)
      await supabase
        .from('users_profile')
        .update({
          email_verified: true,
          email_verified_at: new Date().toISOString(),
        })
        .eq('user_id', userId);
    } else {
      // Create profile from metadata (will trigger welcome email)
      const metadata = user.user_metadata;
      const role = metadata.role || 'TALENT';
      
      const { error: insertError } = await supabase
        .from('users_profile')
        .insert({
          user_id: userId,
          display_name: metadata.full_name || `${metadata.first_name} ${metadata.last_name}`,
          handle: `${metadata.first_name?.toLowerCase() || 'user'}_${metadata.last_name?.toLowerCase() || 'user'}_${Date.now()}`,
          role_flags: [role],
          first_name: metadata.first_name,
          last_name: metadata.last_name,
          date_of_birth: metadata.date_of_birth,
          availability_status: 'Available',
          email_verified: true,
          email_verified_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error('Error creating profile:', insertError);
        return NextResponse.redirect(new URL('/auth/verification-error?reason=server-error', request.url));
      }
    }

    // Welcome email will be automatically sent by the database trigger
    // when profile is created with email_verified = true

    // Redirect to success page, which will then redirect to complete profile
    return NextResponse.redirect(new URL('/auth/verification-success', request.url));

  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.redirect(new URL('/auth/verification-error?reason=server-error', request.url));
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPlunkService } from '@/../../packages/adapters/src/external/PlunkService';

/**
 * POST /api/email-preferences/unsubscribe-all
 * Unsubscribe user from ALL emails
 */
export async function POST(request: NextRequest) {
  try {
    const { email, userId } = await request.json();

    if (!email && !userId) {
      return NextResponse.json(
        { error: 'Email or userId required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    let userEmail = email;

    // If userId provided, get email
    if (userId && !email) {
      const { data: { user } } = await supabase.auth.admin.getUserById(userId);
      if (user?.email) {
        userEmail = user.email;
      }
    }

    if (!userEmail) {
      return NextResponse.json(
        { error: 'Could not find user email' },
        { status: 404 }
      );
    }

    // Get user ID from email if not provided
    let finalUserId = userId;
    if (!finalUserId) {
      const { data: profile } = await supabase
        .from('users_profile')
        .select('user_id')
        .eq('email', userEmail)
        .single();
      
      if (profile) {
        finalUserId = profile.user_id;
      }
    }

    // Update database preferences
    if (finalUserId) {
      await supabase
        .from('notification_preferences')
        .upsert({
          user_id: finalUserId,
          email_enabled: false,
          marketing_notifications: false,
        });
    }

    // Unsubscribe in Plunk
    const plunk = getPlunkService();
    await plunk.unsubscribeContact(userEmail);

    // Track the unsubscribe event
    await plunk.trackEvent({
      event: 'user.unsubscribed.all',
      email: userEmail,
      data: {
        unsubscribedAt: new Date().toISOString(),
        method: 'unsubscribe_page'
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Successfully unsubscribed from all emails'
    });

  } catch (error) {
    console.error('Error unsubscribing:', error);
    return NextResponse.json(
      { error: 'Failed to unsubscribe', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}


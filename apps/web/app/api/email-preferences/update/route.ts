import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPlunkService } from '@/../../packages/adapters/src/external/PlunkService';

/**
 * POST /api/email-preferences/update
 * Update user's email preferences
 */
export async function POST(request: NextRequest) {
  try {
    const { email, userId, preferences } = await request.json();

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
          gig_notifications: preferences.gig ?? true,
          application_notifications: preferences.application ?? true,
          message_notifications: preferences.message ?? true,
          booking_notifications: preferences.booking ?? true,
          system_notifications: preferences.system ?? true,
          marketing_notifications: preferences.marketing ?? false,
        });
    }

    // Update Plunk contact data
    try {
      const plunk = getPlunkService();
      await plunk.upsertContact({
        email: userEmail,
        subscribed: Object.values(preferences).some(v => v === true), // Subscribed if ANY preference is true
        data: {
          preferences,
          updatedAt: new Date().toISOString()
        }
      });

      // Track preference update
      await plunk.trackEvent({
        event: 'email.preferences.updated',
        email: userEmail,
        data: {
          preferences,
          updatedAt: new Date().toISOString()
        }
      });
    } catch (plunkError) {
      console.warn('Plunk update failed:', plunkError);
      // Continue without failing the whole request
    }

    return NextResponse.json({
      success: true,
      message: 'Email preferences updated successfully'
    });

  } catch (error) {
    console.error('Error updating preferences:', error);
    return NextResponse.json(
      { error: 'Failed to update preferences', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}


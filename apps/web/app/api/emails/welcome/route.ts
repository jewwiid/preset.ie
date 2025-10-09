import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getEmailEventsService } from '@/lib/services/emails';

/**
 * POST /api/emails/welcome
 * Triggered by database when new user profile is created
 */
export async function POST(request: NextRequest) {
  try {
    const { authUserId, name, role } = await request.json();

    if (!authUserId || !name || !role) {
      return NextResponse.json(
        { error: 'Missing required fields: authUserId, name, role' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get user email from auth
    const { data: { user }, error: authError } = await supabase.auth.admin.getUserById(authUserId);

    if (authError || !user?.email) {
      return NextResponse.json(
        { error: 'User not found or no email' },
        { status: 404 }
      );
    }

    // Send welcome email
    const emailEvents = getEmailEventsService();
    await emailEvents.sendWelcomeEmail(authUserId, user.email, name, role);

    return NextResponse.json({
      success: true,
      message: 'Welcome email sent',
      recipient: user.email
    });

  } catch (error) {
    console.error('Error sending welcome email:', error);
    return NextResponse.json(
      { error: 'Failed to send email', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}


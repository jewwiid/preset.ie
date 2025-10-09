import { NextRequest, NextResponse } from 'next/server';
import { getPlunkService } from '@/../../packages/adapters/src/external/PlunkService';

/**
 * POST /api/plunk/track
 * Track events for email automation
 * 
 * @body {
 *   event: string - Event name (e.g., 'user.signup', 'purchase.completed')
 *   email: string - User's email address
 *   subscribed?: boolean - Whether to subscribe the user (default: true)
 *   data?: Record<string, any> - Additional event metadata
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event, email, subscribed, data } = body;

    // Validate required fields
    if (!event || !email) {
      return NextResponse.json(
        { error: 'Event name and email are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const plunk = getPlunkService();
    const result = await plunk.trackEvent({
      event,
      email,
      subscribed: subscribed ?? true,
      data: data || {},
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error tracking Plunk event:', error);
    return NextResponse.json(
      { error: 'Failed to track event', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}


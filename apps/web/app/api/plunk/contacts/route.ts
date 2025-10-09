import { NextRequest, NextResponse } from 'next/server';
import { getPlunkService } from '@/../../packages/adapters/src/external/PlunkService';

/**
 * POST /api/plunk/contacts
 * Create or update a contact
 * 
 * @body {
 *   email: string - Contact's email
 *   subscribed?: boolean - Subscription status
 *   data?: Record<string, any> - Custom metadata
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, subscribed, data } = body;

    // Validate required fields
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
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
    const result = await plunk.upsertContact({
      email,
      subscribed: subscribed ?? true,
      data: data || {},
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error creating/updating contact:', error);
    return NextResponse.json(
      { error: 'Failed to manage contact', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}


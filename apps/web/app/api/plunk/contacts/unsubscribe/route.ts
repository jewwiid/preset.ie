import { NextRequest, NextResponse } from 'next/server';
import { getPlunkService } from '@/../../packages/adapters/src/external/PlunkService';

/**
 * POST /api/plunk/contacts/unsubscribe
 * Unsubscribe a contact from email marketing
 * 
 * @body {
 *   email: string - Contact's email
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

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
    const result = await plunk.unsubscribeContact(email);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error unsubscribing contact:', error);
    return NextResponse.json(
      { error: 'Failed to unsubscribe contact', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}


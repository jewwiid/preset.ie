import { NextRequest, NextResponse } from 'next/server';
import { getPlunkService } from '@/../../packages/adapters/src/external/PlunkService';

/**
 * POST /api/plunk/send
 * Send transactional emails
 * 
 * @body {
 *   to: string - Recipient email
 *   subject: string - Email subject
 *   body: string - Email body (HTML)
 *   name?: string - Recipient name
 *   from?: string - Sender email
 *   replyTo?: string - Reply-to email
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, subject, body: emailBody, name, from, replyTo } = body;

    // Validate required fields
    if (!to || !subject || !emailBody) {
      return NextResponse.json(
        { error: 'Recipient, subject, and body are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return NextResponse.json(
        { error: 'Invalid recipient email format' },
        { status: 400 }
      );
    }

    const plunk = getPlunkService();
    const result = await plunk.sendTransactionalEmail({
      to,
      subject,
      body: emailBody,
      name,
      from,
      replyTo,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error sending email via Plunk:', error);
    return NextResponse.json(
      { error: 'Failed to send email', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '../../../lib/services/email-service';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email address is required' },
        { status: 400 }
      );
    }

    // Send test email
    await emailService.sendTestEmail(email);
    
    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully!'
    });

  } catch (error) {
    console.error('Test email API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send test email' },
      { status: 500 }
    );
  }
}

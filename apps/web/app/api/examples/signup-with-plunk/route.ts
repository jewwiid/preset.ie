/**
 * Example: User Signup with Plunk Integration
 * 
 * This is a reference implementation showing how to integrate Plunk
 * into your user signup flow.
 * 
 * DO NOT USE THIS DIRECTLY - This is just an example!
 * Adapt this pattern to your actual signup implementation.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getEmailService } from '@/lib/services/email-service';

export async function POST(request: NextRequest) {
  try {
    const { email, name, password } = await request.json();

    // 1. Create user in your database
    // const user = await createUser({ email, name, password });
    
    // 2. Initialize email service
    const emailService = getEmailService();

    // 3. Send welcome email (role would come from your user creation logic)
    const userRole = 'talent'; // or 'contributor' based on your signup flow
    await emailService.sendWelcomeEmail(email, name, userRole);

    return NextResponse.json({
      success: true,
      message: 'User created and welcome email sent'
    });

  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Signup failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}


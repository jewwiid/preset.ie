/**
 * Example: Credit Purchase with Plunk Integration
 * 
 * This shows how to integrate Plunk into your Stripe webhook handler
 * to send purchase confirmations and track purchase events.
 * 
 * DO NOT USE THIS DIRECTLY - This is just an example!
 * Integrate this pattern into your existing Stripe webhook handler.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getEmailService } from '@/lib/services/email-service';

export async function POST(request: NextRequest) {
  try {
    // This would normally come from your Stripe webhook
    const { 
      email, 
      name,
      credits, 
      amount, // in cents
      transactionId 
    } = await request.json();

    const emailService = getEmailService();

    // 1. Send purchase confirmation email
    await emailService.sendCreditsPurchased(
      email,
      credits,
      amount,
      transactionId
    );

    // The trackPurchase is already called inside sendCreditsPurchased

    return NextResponse.json({
      success: true,
      message: 'Purchase tracked and confirmation email sent'
    });

  } catch (error) {
    console.error('Credit purchase tracking error:', error);
    return NextResponse.json(
      { error: 'Failed to process purchase', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}


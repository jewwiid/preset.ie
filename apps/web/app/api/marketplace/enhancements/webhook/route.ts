import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase';
import { EnhancementService } from '@/lib/services/enhancement.service';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature')!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    console.log('Processing Stripe webhook event:', event.type);

    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
        break;
      
      case 'payment_intent.payment_failed':
        await handlePaymentFailure(event.data.object as Stripe.PaymentIntent);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  try {
    const { listing_id, enhancement_type, user_id } = paymentIntent.metadata;
    
    if (!listing_id || !enhancement_type || !user_id) {
      console.error('Missing required metadata in payment intent:', paymentIntent.id);
      return;
    }

    console.log(`Payment succeeded for enhancement: ${enhancement_type} on listing: ${listing_id}`);

    // Create the enhancement record
    const enhancementData = {
      listingId: listing_id,
      userId: user_id,
      enhancementType: enhancement_type as 'basic_bump' | 'priority_bump' | 'premium_bump',
      paymentIntentId: paymentIntent.id,
      amountCents: paymentIntent.amount,
      durationDays: getDurationDays(enhancement_type)
    };

    await EnhancementService.createListingEnhancement(enhancementData);

    // Send success notification to user
    if (supabase) {
      await supabase.functions.invoke('create-notification', {
      body: {
        user_id,
        type: 'enhancement_applied',
        title: 'Enhancement Applied Successfully!',
        message: `Your ${enhancement_type.replace('_', ' ')} enhancement has been applied to your listing.`,
        metadata: {
          listing_id,
          enhancement_type,
          payment_intent_id: paymentIntent.id
        }
      }
    });
    }

    console.log(`Enhancement created successfully for listing: ${listing_id}`);
  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

async function handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
  try {
    const { listing_id, enhancement_type, user_id } = paymentIntent.metadata;
    
    if (!listing_id || !enhancement_type || !user_id) {
      console.error('Missing required metadata in payment intent:', paymentIntent.id);
      return;
    }

    console.log(`Payment failed for enhancement: ${enhancement_type} on listing: ${listing_id}`);

    // Send failure notification to user
    if (supabase) {
      await supabase.functions.invoke('create-notification', {
      body: {
        user_id,
        type: 'enhancement_failed',
        title: 'Enhancement Payment Failed',
        message: `Your ${enhancement_type.replace('_', ' ')} enhancement payment could not be processed. Please try again.`,
        metadata: {
          listing_id,
          enhancement_type,
          payment_intent_id: paymentIntent.id,
          error: paymentIntent.last_payment_error?.message || 'Payment failed'
        }
      }
    });
    }

    console.log(`Payment failure notification sent for listing: ${listing_id}`);
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}

function getDurationDays(enhancementType: string): number {
  switch (enhancementType) {
    case 'basic_bump':
      return 7; // 1 week
    case 'priority_bump':
      return 14; // 2 weeks
    case 'premium_bump':
      return 30; // 1 month
    default:
      return 7;
  }
}

function getExpirationDate(enhancementType: string): Date {
  const now = new Date();
  const durationDays = getDurationDays(enhancementType);
  
  return new Date(now.getTime() + (durationDays * 24 * 60 * 60 * 1000));
}

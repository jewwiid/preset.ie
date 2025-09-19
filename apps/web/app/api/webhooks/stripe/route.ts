import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { OrderProcessingService } from '@/lib/services/order-processing.service';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      
      case 'payment_intent.canceled':
        await handlePaymentCanceled(event.data.object as Stripe.PaymentIntent);
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

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  try {
    console.log('Payment succeeded:', paymentIntent.id);
    
    const result = await OrderProcessingService.confirmPayment(paymentIntent.id);
    
    if (result.success) {
      console.log('Order confirmed successfully');
    } else {
      console.error('Failed to confirm order:', result.error);
    }
  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  try {
    console.log('Payment failed:', paymentIntent.id);
    
    // Update order status to failed
    const metadata = paymentIntent.metadata;
    const orderType = metadata.type;
    
    if (orderType === 'rental') {
      // Find and update rental order
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      
      await supabase
        .from('rental_orders')
        .update({ 
          status: 'payment_failed',
          updated_at: new Date().toISOString()
        })
        .eq('payment_intent_id', paymentIntent.id);
        
    } else if (orderType === 'sale') {
      // Find and update sale order
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      
      await supabase
        .from('sale_orders')
        .update({ 
          status: 'payment_failed',
          updated_at: new Date().toISOString()
        })
        .eq('payment_intent_id', paymentIntent.id);
    }
    
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}

async function handlePaymentCanceled(paymentIntent: Stripe.PaymentIntent) {
  try {
    console.log('Payment canceled:', paymentIntent.id);
    
    // Update order status to cancelled
    const metadata = paymentIntent.metadata;
    const orderType = metadata.type;
    
    if (orderType === 'rental') {
      // Find and update rental order
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      
      await supabase
        .from('rental_orders')
        .update({ 
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('payment_intent_id', paymentIntent.id);
        
    } else if (orderType === 'sale') {
      // Find and update sale order
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      
      await supabase
        .from('sale_orders')
        .update({ 
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('payment_intent_id', paymentIntent.id);
    }
    
  } catch (error) {
    console.error('Error handling payment cancellation:', error);
  }
}

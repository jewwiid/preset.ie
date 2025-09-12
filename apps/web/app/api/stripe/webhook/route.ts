// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { stripe, STRIPE_CONFIG } from '../../../../lib/stripe';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    // Temporary disabled - Stripe package not installed
    return NextResponse.json(
      { error: 'Stripe integration temporarily disabled' },
      { status: 503 }
    );

    // Original code (commented out until Stripe is installed)
    /*
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature || !STRIPE_CONFIG.webhookSecret) {
      console.error('Missing signature or webhook secret');
      return NextResponse.json(
        { error: 'Missing signature or webhook secret' },
        { status: 400 }
      );
    }

    let event: any; // Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        STRIPE_CONFIG.webhookSecret
      );
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session, supabase);
        break;

      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent, supabase);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent, supabase);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription, supabase);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription, supabase);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription, supabase);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice, supabase);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice, supabase);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
    */
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
  supabase: any
) {
  // Temporarily disabled
  console.log('Stripe webhook disabled:', session.id);
  return;
  console.log('Processing checkout session completed:', session.id);

  if (session.mode === 'payment' && session.payment_status === 'paid') {
    // Handle one-time credit purchase
    const metadata = session.metadata;
    if (metadata?.type === 'credit_purchase' && metadata?.user_id && metadata?.credits) {
      const userId = metadata.user_id;
      const credits = parseInt(metadata.credits);
      const packageId = metadata.package_id;

      try {
        // Add credits to user account
        const { data: userCredits, error: creditError } = await supabase.rpc(
          'update_user_credits',
          {
            p_user_id: userId,
            p_amount: credits,
            p_type: 'purchase',
            p_description: `Credit purchase - ${packageId} package`,
            p_reference_id: session.id,
            p_metadata: {
              stripe_session_id: session.id,
              package_id: packageId,
              amount_paid: (session.amount_total || 0) / 100,
              currency: session.currency
            }
          }
        );

        if (creditError) {
          console.error('Error adding credits:', creditError);
          throw creditError;
        }

        // Log the successful purchase
        const { error: logError } = await supabase
          .from('user_credit_purchases')
          .insert({
            user_id: userId,
            package_id: packageId,
            credits_purchased: credits,
            amount_paid_usd: (session.amount_total || 0) / 100,
            payment_method: 'stripe',
            stripe_session_id: session.id,
            stripe_customer_id: session.customer as string,
            status: 'completed',
            completed_at: new Date().toISOString()
          });

        if (logError) {
          console.error('Error logging purchase:', logError);
        }

        console.log(`Successfully added ${credits} credits to user ${userId}`);
      } catch (error) {
        console.error('Error processing credit purchase:', error);
        
        // Log failed purchase
        await supabase
          .from('user_credit_purchases')
          .insert({
            user_id: userId,
            package_id: packageId,
            credits_purchased: credits,
            amount_paid_usd: (session.amount_total || 0) / 100,
            payment_method: 'stripe',
            stripe_session_id: session.id,
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error'
          });
      }
    }
  }
}

async function handlePaymentIntentSucceeded(
  paymentIntent: Stripe.PaymentIntent,
  supabase: any
) {
  console.log('Payment intent succeeded:', paymentIntent.id);
  
  // Log successful payment
  await supabase
    .from('payment_logs')
    .insert({
      stripe_payment_intent_id: paymentIntent.id,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
      status: 'succeeded',
      metadata: paymentIntent.metadata
    });
}

async function handlePaymentIntentFailed(
  paymentIntent: Stripe.PaymentIntent,
  supabase: any
) {
  console.log('Payment intent failed:', paymentIntent.id);
  
  // Log failed payment
  await supabase
    .from('payment_logs')
    .insert({
      stripe_payment_intent_id: paymentIntent.id,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
      status: 'failed',
      error_message: paymentIntent.last_payment_error?.message,
      metadata: paymentIntent.metadata
    });
}

async function handleSubscriptionCreated(
  subscription: Stripe.Subscription,
  supabase: any
) {
  console.log('Subscription created:', subscription.id);
  
  if (subscription.customer && subscription.status === 'active') {
    // Get customer to find user
    const customer = await stripe.customers.retrieve(subscription.customer as string);
    
    if (customer && !customer.deleted && customer.metadata?.user_id) {
      const userId = customer.metadata.user_id;
      
      // Update user subscription
      await supabase
        .from('users')
        .update({
          stripe_subscription_id: subscription.id,
          subscription_tier: mapStripePriceToTier(subscription.items.data[0]?.price.id),
          subscription_expires_at: new Date(subscription.current_period_end * 1000).toISOString()
        })
        .eq('id', userId);
    }
  }
}

async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription,
  supabase: any
) {
  console.log('Subscription updated:', subscription.id);
  
  if (subscription.customer) {
    const customer = await stripe.customers.retrieve(subscription.customer as string);
    
    if (customer && !customer.deleted && customer.metadata?.user_id) {
      const userId = customer.metadata.user_id;
      
      // Update subscription status
      await supabase
        .from('users')
        .update({
          subscription_tier: subscription.status === 'active' 
            ? mapStripePriceToTier(subscription.items.data[0]?.price.id)
            : 'FREE',
          subscription_expires_at: subscription.status === 'active'
            ? new Date(subscription.current_period_end * 1000).toISOString()
            : null
        })
        .eq('id', userId);
    }
  }
}

async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
  supabase: any
) {
  console.log('Subscription deleted:', subscription.id);
  
  if (subscription.customer) {
    const customer = await stripe.customers.retrieve(subscription.customer as string);
    
    if (customer && !customer.deleted && customer.metadata?.user_id) {
      const userId = customer.metadata.user_id;
      
      // Downgrade to free tier
      await supabase
        .from('users')
        .update({
          subscription_tier: 'FREE',
          subscription_expires_at: null,
          stripe_subscription_id: null
        })
        .eq('id', userId);
    }
  }
}

async function handleInvoicePaymentSucceeded(
  invoice: Stripe.Invoice,
  supabase: any
) {
  console.log('Invoice payment succeeded:', invoice.id);
  
  // Log successful invoice payment
  await supabase
    .from('invoice_logs')
    .insert({
      stripe_invoice_id: invoice.id,
      stripe_subscription_id: invoice.subscription,
      amount_paid: invoice.amount_paid / 100,
      currency: invoice.currency,
      status: 'paid',
      billing_reason: invoice.billing_reason
    });
}

async function handleInvoicePaymentFailed(
  invoice: Stripe.Invoice,
  supabase: any
) {
  console.log('Invoice payment failed:', invoice.id);
  
  // Log failed invoice payment
  await supabase
    .from('invoice_logs')
    .insert({
      stripe_invoice_id: invoice.id,
      stripe_subscription_id: invoice.subscription,
      amount_due: invoice.amount_due / 100,
      currency: invoice.currency,
      status: 'payment_failed',
      billing_reason: invoice.billing_reason
    });
}

function mapStripePriceToTier(priceId: string | undefined): string {
  // Map Stripe price IDs to subscription tiers
  const priceToTierMap: Record<string, string> = {
    'price_plus_monthly': 'PLUS',
    'price_plus_yearly': 'PLUS',
    'price_pro_monthly': 'PRO',
    'price_pro_yearly': 'PRO',
  };
  
  return priceToTierMap[priceId || ''] || 'FREE';
}
// End of commented functions */
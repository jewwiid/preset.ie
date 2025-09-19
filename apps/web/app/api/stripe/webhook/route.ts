import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Supabase environment variables are not set.');
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
});

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature')!;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 });
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  try {
    const { metadata } = session;
    if (!metadata) {
      console.error('No metadata found in checkout session');
      return;
    }

    const { userId, profileId, planId, planName, credits, monthlyBumps, prioritySupport, analytics } = metadata;

    // Update user's subscription in the database
    const { error: subscriptionError } = await supabaseAdmin
      .from('subscriptions')
      .upsert({
        user_id: profileId, // Use profile ID, not auth user ID
        tier: planId.toUpperCase(),
        status: 'active',
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: session.subscription as string,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (subscriptionError) {
      console.error('Error updating subscription:', subscriptionError);
      return;
    }

    // Update user profile with new subscription tier
    const { error: profileError } = await supabaseAdmin
      .from('users_profile')
      .update({
        subscription_tier: planId.toUpperCase(),
        updated_at: new Date().toISOString()
      })
      .eq('id', profileId);

    if (profileError) {
      console.error('Error updating user profile:', profileError);
      return;
    }

    // Initialize or update user credits with new monthly allowance
    const { error: creditsError } = await supabaseAdmin
      .from('user_credits')
      .upsert({
        user_id: profileId,
        monthly_allowance: parseInt(credits),
        current_balance: parseInt(credits),
        consumed_this_month: 0,
        last_reset_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (creditsError) {
      console.error('Error updating user credits:', creditsError);
      return;
    }

    // Initialize or update subscription benefits
    const benefits = [
      { benefit_type: 'monthly_bumps', benefit_value: parseInt(monthlyBumps), monthly_limit: parseInt(monthlyBumps) },
      { benefit_type: 'priority_support', benefit_value: prioritySupport === 'true' ? 1 : 0, monthly_limit: prioritySupport === 'true' ? 1 : 0 },
      { benefit_type: 'analytics', benefit_value: analytics === 'true' ? 1 : 0, monthly_limit: analytics === 'true' ? 1 : 0 }
    ];

    for (const benefit of benefits) {
      const { error: benefitError } = await supabaseAdmin
        .from('subscription_benefits')
        .upsert({
          user_id: profileId,
          subscription_tier: planId.toUpperCase(),
          benefit_type: benefit.benefit_type,
          benefit_value: benefit.benefit_value,
          used_this_month: 0,
          monthly_limit: benefit.monthly_limit,
          last_reset_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (benefitError) {
        console.error(`Error updating benefit ${benefit.benefit_type}:`, benefitError);
      }
    }

    console.log(`Successfully processed subscription upgrade for user ${profileId} to ${planName}`);
  } catch (error: any) {
    console.error('Error handling checkout session completed:', error);
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  try {
    // Find the subscription in our database
    const { data: dbSubscription, error: findError } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('stripe_subscription_id', subscription.id)
      .single();

    if (findError || !dbSubscription) {
      console.error('Subscription not found in database:', findError);
      return;
    }

    // Update subscription status
    const { error: updateError } = await supabaseAdmin
      .from('subscriptions')
      .update({
        status: subscription.status === 'active' ? 'active' : 'inactive',
        updated_at: new Date().toISOString()
      })
      .eq('id', dbSubscription.id);

    if (updateError) {
      console.error('Error updating subscription status:', updateError);
    }
  } catch (error: any) {
    console.error('Error handling subscription updated:', error);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    // Find the subscription in our database
    const { data: dbSubscription, error: findError } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('stripe_subscription_id', subscription.id)
      .single();

    if (findError || !dbSubscription) {
      console.error('Subscription not found in database:', findError);
      return;
    }

    // Update subscription status to canceled
    const { error: updateError } = await supabaseAdmin
      .from('subscriptions')
      .update({
        status: 'canceled',
        updated_at: new Date().toISOString()
      })
      .eq('id', dbSubscription.id);

    if (updateError) {
      console.error('Error updating subscription status:', updateError);
      return;
    }

    // Reset user to FREE tier
    const { error: profileError } = await supabaseAdmin
      .from('users_profile')
      .update({
        subscription_tier: 'FREE',
        updated_at: new Date().toISOString()
      })
      .eq('id', dbSubscription.user_id);

    if (profileError) {
      console.error('Error updating user profile:', profileError);
    }

    console.log(`Successfully processed subscription cancellation for user ${dbSubscription.user_id}`);
  } catch (error: any) {
    console.error('Error handling subscription deleted:', error);
  }
}
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
  console.log('====== WEBHOOK HANDLER CALLED ======');
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature')!;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

    console.log('🔍 Webhook received:', { 
      hasSignature: !!signature, 
      hasWebhookSecret: !!webhookSecret,
      bodyLength: body.length 
    });

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      console.log('✅ Webhook signature verified, event type:', event.type);
    } catch (err: any) {
      console.error('❌ Webhook signature verification failed:', err.message);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Handle the event
    console.log('🎯 Event type received:', event.type);
    
    switch (event.type) {
      case 'checkout.session.completed':
        console.log('✅ Handling checkout.session.completed event');
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'customer.subscription.updated':
        console.log('✅ Handling customer.subscription.updated event');
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        console.log('✅ Handling customer.subscription.deleted event');
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      default:
        console.log(`⚠️ Unhandled event type: ${event.type}`);
    }

    console.log('✅ Webhook processed successfully');
    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 });
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  try {
    console.log('🔍 Processing checkout.session.completed:', {
      sessionId: session.id,
      customer: session.customer,
      subscription: session.subscription,
      metadata: session.metadata
    });

    const { metadata } = session;
    if (!metadata) {
      console.error('❌ No metadata found in checkout session');
      return;
    }

    // Check if this is a credit purchase, lootbox, or subscription
    if (metadata.type === 'credit_purchase') {
      console.log('💳 Processing credit purchase');
      await handleCreditPurchase(session);
      return;
    }

    if (metadata.type === 'lootbox_purchase') {
      console.log('🎁 Processing lootbox purchase');
      await handleLootboxPurchase(session);
      return;
    }

    // Otherwise, handle as subscription
    const { userId, profileId, planId, planName, credits, monthlyBumps, prioritySupport, analytics } = metadata;

    // Update user's subscription in the database
    const { error: subscriptionError } = await supabaseAdmin
      .from('subscriptions')
      .upsert({
        user_id: profileId, // Use profile ID, not auth user ID
        tier: planId.toUpperCase(),
        status: 'ACTIVE', // Use uppercase for enum
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: session.subscription as string,
        started_at: new Date().toISOString(), // Add started_at timestamp
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

    // Allocate credits
    console.log('💳 Allocating credits:', { userId, profileId, credits: parseInt(credits), planId: planId.toUpperCase() });
    
    const { data: creditsData, error: creditsError} = await supabaseAdmin
      .from('user_credits')
      .upsert({
        user_id: userId,
        subscription_tier: planId.toUpperCase(),
        monthly_allowance: parseInt(credits),
        current_balance: parseInt(credits),
        consumed_this_month: 0,
        last_reset_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select();

    if (creditsError) {
      console.error('❌ Error updating user credits:', creditsError);
      return;
    }
    
    console.log('✅ Credits allocated successfully:', creditsData);

    console.log(`✅ Successfully processed subscription upgrade for user ${profileId} to ${planName}`);
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
        status: subscription.status === 'active' ? 'ACTIVE' : 'INACTIVE',
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
        status: 'CANCELED',
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
      return;
    }

    // Get the auth user_id from the profile
    const { data: profile, error: profileFetchError } = await supabaseAdmin
      .from('users_profile')
      .select('user_id')
      .eq('id', dbSubscription.user_id)
      .single();

    if (profileFetchError || !profile) {
      console.error('❌ Error fetching user profile for credits reset:', profileFetchError);
      return;
    }

    // Update subscription tier but keep existing credits (user paid for them)
    console.log('💳 Updating subscription tier to FREE (keeping existing credits) for auth user:', profile.user_id);
    
    const { error: creditsError } = await supabaseAdmin
      .from('user_credits')
      .update({
        subscription_tier: 'FREE',
        monthly_allowance: 5, // Future monthly resets will give 5 credits
        updated_at: new Date().toISOString()
        // Note: NOT resetting current_balance - user keeps their paid credits
      })
      .eq('user_id', profile.user_id); // Use auth.users ID

    if (creditsError) {
      console.error('❌ Error updating user credits tier:', creditsError);
    } else {
      console.log('✅ Subscription tier updated to FREE (user keeps existing credits)');
    }

    console.log(`✅ Successfully processed subscription cancellation for user ${dbSubscription.user_id}`);
  } catch (error: any) {
    console.error('Error handling subscription deleted:', error);
  }
}

async function handleCreditPurchase(session: Stripe.Checkout.Session) {
  try {
    const { metadata } = session;
    if (!metadata) {
      console.error('❌ No metadata found in credit purchase session');
      return;
    }

    const { userId, profileId, packageId, packageName, credits, priceUsd } = metadata;

    console.log('💳 Allocating purchased credits:', {
      userId,
      packageId,
      credits: parseInt(credits),
      priceUsd: parseFloat(priceUsd)
    });

    // Add purchased credits using the helper function
    // This ensures credits are tracked separately and will roll over
    const { error: creditsError } = await supabaseAdmin
      .rpc('add_purchased_credits', {
        p_user_id: userId,
        p_credits: parseInt(credits)
      });

    if (creditsError) {
      console.error('❌ Error adding purchased credits:', creditsError);
      return;
    }

    // Get updated balance for logging
    const { data: updatedCredits } = await supabaseAdmin
      .from('user_credits')
      .select('current_balance, purchased_credits_balance')
      .eq('user_id', userId)
      .single();

    console.log('✅ Purchased credits added successfully:', {
      creditsAdded: parseInt(credits),
      newTotalBalance: updatedCredits?.current_balance || 0,
      newPurchasedBalance: updatedCredits?.purchased_credits_balance || 0
    });

    // Log the purchase transaction
    const { error: transactionError } = await supabaseAdmin
      .from('user_credit_purchases')
      .insert({
        user_id: userId,
        package_id: packageId,
        credits_purchased: parseInt(credits),
        amount_paid_usd: parseFloat(priceUsd),
        payment_provider: 'stripe',
        stripe_payment_intent: session.payment_intent,
        status: 'completed',
        created_at: new Date().toISOString()
      });

    if (transactionError) {
      console.error('⚠️ Error logging purchase transaction:', transactionError);
      // Don't return - credits were added successfully
    }

    console.log(`✅ Successfully processed credit purchase for user ${userId}: ${credits} credits for $${priceUsd}`);
  } catch (error: any) {
    console.error('Error handling credit purchase:', error);
  }
}

async function handleLootboxPurchase(session: Stripe.Checkout.Session) {
  try {
    const { metadata } = session;
    if (!metadata) {
      console.error('❌ No metadata found in lootbox purchase session');
      return;
    }

    const { userId, profileId, packageId, packageName, credits, priceUsd } = metadata;

    console.log('🎁 Allocating lootbox credits:', {
      userId,
      packageId,
      credits: parseInt(credits),
      priceUsd: parseFloat(priceUsd)
    });

    // Add purchased credits using the helper function
    // Lootbox credits are purchased and should roll over forever
    const { error: creditsError } = await supabaseAdmin
      .rpc('add_purchased_credits', {
        p_user_id: userId,
        p_credits: parseInt(credits)
      });

    if (creditsError) {
      console.error('❌ Error adding lootbox credits:', creditsError);
      return;
    }

    // Get updated balance for logging
    const { data: updatedCredits } = await supabaseAdmin
      .from('user_credits')
      .select('current_balance, purchased_credits_balance')
      .eq('user_id', userId)
      .single();

    console.log('✅ Lootbox credits added successfully:', {
      creditsAdded: parseInt(credits),
      newTotalBalance: updatedCredits?.current_balance || 0,
      newPurchasedBalance: updatedCredits?.purchased_credits_balance || 0
    });

    // Determine current event period for uniqueness constraint
    const now = new Date();
    const dayOfWeek = now.getDay();
    const dayOfMonth = now.getDate();
    
    let eventName = 'Unknown Event';
    let eventPeriod = '';
    
    // Weekend Flash Sale (unique per weekend)
    if ((dayOfWeek === 5 && now.getHours() >= 18) || dayOfWeek === 6 || (dayOfWeek === 0)) {
      eventName = '🎉 Weekend Flash Sale';
      const year = now.getFullYear();
      const weekNum = Math.ceil((now.getDate() + new Date(year, now.getMonth(), 1).getDay()) / 7);
      eventPeriod = `${year}-W${weekNum}`; // e.g., "2025-W40"
    }
    // Mid-Month Special (unique per month)
    else if (dayOfMonth >= 15 && dayOfMonth <= 17) {
      eventName = '💎 Mid-Month Mega Deal';
      eventPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-15`; // e.g., "2025-10-15"
    }
    
    // Record the lootbox event with uniqueness constraint
    const { error: eventError } = await supabaseAdmin
      .from('lootbox_events')
      .insert({
        event_type: 'purchased',
        event_name: eventName,
        event_period: eventPeriod,
        package_id: packageId,
        user_credits_offered: parseInt(credits),
        price_usd: parseFloat(priceUsd),
        margin_percentage: 35.0,
        purchased_at: new Date().toISOString(),
        purchased_by: userId
      });

    if (eventError) {
      console.error('⚠️ Error recording lootbox event:', eventError);
    }

    // Log the purchase transaction
    const { error: transactionError } = await supabaseAdmin
      .from('user_credit_purchases')
      .insert({
        user_id: userId,
        package_id: packageId,
        credits_purchased: parseInt(credits),
        amount_paid_usd: parseFloat(priceUsd),
        payment_provider: 'stripe',
        payment_method: 'lootbox',
        stripe_payment_intent: session.payment_intent,
        status: 'completed',
        created_at: new Date().toISOString()
      });

    if (transactionError) {
      console.error('⚠️ Error logging lootbox purchase:', transactionError);
    }

    console.log(`✅ Successfully processed lootbox purchase for user ${userId}: ${credits} credits for $${priceUsd}`);
  } catch (error: any) {
    console.error('Error handling lootbox purchase:', error);
  }
}
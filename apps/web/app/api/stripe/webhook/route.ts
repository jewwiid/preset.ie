import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const stripeSecretKey = process.env.STRIPE_SECRET_KEY!;
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-08-27.basil',
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature || !stripeWebhookSecret) {
      console.error('❌ Missing Stripe signature or webhook secret');
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, stripeWebhookSecret);
    } catch (err) {
      console.error('❌ Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    console.log('✅ Webhook received:', event.type);

    // Handle successful payment
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      
      console.log('💰 Payment completed for session:', session.id);
      console.log('📦 Metadata:', session.metadata);

      const { userId, packageId, credits } = session.metadata || {};

      if (!userId || !packageId || !credits) {
        console.error('❌ Missing metadata in session');
        return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
      }

      const creditsAmount = parseInt(credits);
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Start a transaction to add credits
      const { data: userCredits, error: creditsError } = await supabase
        .from('user_credits')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (creditsError) {
        console.error('❌ Error fetching user credits:', creditsError);
        return NextResponse.json({ error: 'User credits not found' }, { status: 404 });
      }

      const newBalance = (userCredits.balance || 0) + creditsAmount;

      // Update user credits
      const { error: updateError } = await supabase
        .from('user_credits')
        .update({
          balance: newBalance,
          last_purchase_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (updateError) {
        console.error('❌ Error updating user credits:', updateError);
        return NextResponse.json({ error: 'Failed to update credits' }, { status: 500 });
      }

      // Record the transaction
      const { error: transactionError } = await supabase
        .from('credit_transactions')
        .insert({
          user_id: userId,
          type: 'purchase',
          amount: creditsAmount,
          balance_before: userCredits.balance || 0,
          balance_after: newBalance,
          description: `Purchased ${creditsAmount} credits via ${packageId} package`,
          reference_id: session.id,
          cost_usd: session.amount_total ? session.amount_total / 100 : 0,
          status: 'completed',
        });

      if (transactionError) {
        console.error('❌ Error recording transaction:', transactionError);
      }

      // Record the purchase
      const { error: purchaseError } = await supabase
        .from('user_credit_purchases')
        .insert({
          user_id: userId,
          package_id: packageId,
          credits_purchased: creditsAmount,
          amount_paid_usd: session.amount_total ? session.amount_total / 100 : 0,
          payment_method: 'stripe',
          status: 'completed',
          stripe_session_id: session.id,
          completed_at: new Date().toISOString(),
        });

      if (purchaseError) {
        console.error('❌ Error recording purchase:', purchaseError);
      }

      console.log('✅ Credits added successfully:', {
        userId,
        creditsAdded: creditsAmount,
        newBalance,
      });
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('❌ Webhook error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
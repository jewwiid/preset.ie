import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, {
  apiVersion: '2025-08-27.basil',
}) : null;

export async function POST(request: NextRequest) {
  try {
    if (!stripe || !stripeWebhookSecret) {
      return NextResponse.json(
        { error: 'Stripe is not configured' },
        { status: 500 }
      );
    }
    
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      console.error('❌ Missing Stripe signature');
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

      // Use the database function to safely update credits
      const { data: updatedCredits, error: updateError } = await supabase
        .rpc('update_user_credits_from_purchase', {
          p_user_id: userId,
          p_amount: creditsAmount,
          p_description: `Purchased ${creditsAmount} credits via ${packageId} package`,
          p_reference_id: session.id
        });

      if (updateError) {
        console.error('❌ Error updating user credits:', updateError);
        return NextResponse.json({ error: 'Failed to update credits' }, { status: 500 });
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
        newBalance: updatedCredits?.current_balance || 'unknown',
      });
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('❌ Webhook error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
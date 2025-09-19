import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUserFromRequest } from '../../../../lib/auth-utils';
import Stripe from 'stripe';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
  throw new Error('Supabase environment variables are not set.');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
});

export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getUserFromRequest(request);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { packageId, successUrl, cancelUrl } = await request.json();

    if (!packageId || !successUrl || !cancelUrl) {
      return NextResponse.json({ 
        error: 'Missing required parameters: packageId, successUrl, cancelUrl' 
      }, { status: 400 });
    }

    // Get user's profile to get the correct user ID for subscriptions table
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('users_profile')
      .select('id, subscription_tier')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ 
        error: 'User profile not found' 
      }, { status: 404 });
    }

    // Define subscription plans
    const subscriptionPlans = {
      'plus': {
        name: 'Plus',
        price: 9.99,
        credits: 50,
        monthlyBumps: 3,
        prioritySupport: true,
        analytics: false
      },
      'pro': {
        name: 'Pro',
        price: 29.99,
        credits: 200,
        monthlyBumps: 10,
        prioritySupport: true,
        analytics: true
      }
    };

    const plan = subscriptionPlans[packageId as keyof typeof subscriptionPlans];
    if (!plan) {
      return NextResponse.json({ 
        error: 'Invalid subscription plan' 
      }, { status: 400 });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${plan.name} Subscription`,
              description: `${plan.credits} credits per month, ${plan.monthlyBumps} monthly bumps, Priority support${plan.analytics ? ', Analytics dashboard' : ''}`,
            },
            unit_amount: Math.round(plan.price * 100), // Convert to cents
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: user.email,
      metadata: {
        userId: user.id,
        profileId: profile.id,
        planId: packageId,
        planName: plan.name,
        credits: plan.credits.toString(),
        monthlyBumps: plan.monthlyBumps.toString(),
        prioritySupport: plan.prioritySupport.toString(),
        analytics: plan.analytics.toString(),
      },
    });

    return NextResponse.json({ 
      sessionId: session.id,
      url: session.url 
    });

  } catch (error: any) {
    console.error('Error creating Stripe checkout session:', error);
    return NextResponse.json({ 
      error: 'Failed to create checkout session',
      details: error.message 
    }, { status: 500 });
  }
}
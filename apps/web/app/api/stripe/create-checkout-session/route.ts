import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUserFromRequest } from '../../../../lib/auth-utils';
import Stripe from 'stripe';

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
    console.log('🔍 Stripe checkout session creation started')
    
    // Initialize Stripe with proper error handling
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    
    console.log('🔍 Stripe secret key check:', { 
      hasKey: !!stripeSecretKey, 
      keyLength: stripeSecretKey?.length,
      keyPrefix: stripeSecretKey?.substring(0, 20) + '...',
      envKeys: Object.keys(process.env).filter(k => k.includes('STRIPE'))
    });
    
    if (!stripeSecretKey) {
      console.log('❌ STRIPE_SECRET_KEY environment variable not set');
      return NextResponse.json({ error: 'Stripe configuration error' }, { status: 500 });
    }
    
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-08-27.basil',
    });
    
    const { user, error: authError } = await getUserFromRequest(request);
    console.log('🔍 Auth check result:', { 
      hasUser: !!user, 
      userId: user?.id, 
      userEmail: user?.email,
      authError: authError 
    })

    if (authError || !user) {
      console.log('❌ Authentication failed:', authError)
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
        credits: 150,
        monthlyBumps: 5,
        prioritySupport: true,
        analytics: false
      },
      'pro': {
        name: 'Pro',
        price: 24.99,
        credits: 500,
        monthlyBumps: 15,
        prioritySupport: true,
        analytics: true
      },
      'creator': {
        name: 'Creator',
        price: 49.99,
        credits: 1500,
        monthlyBumps: 25,
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
import { NextRequest, NextResponse } from 'next/server';
import { stripe, CREDIT_PACKAGES } from '../../../../lib/stripe';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  // Temporary disabled - Stripe package not installed
  return NextResponse.json(
    { error: 'Stripe integration temporarily disabled' },
    { status: 503 }
  );

  /* Original code (commented out until Stripe is installed)
  try {
    // Get user from auth
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { packageId, successUrl, cancelUrl } = await request.json();
    
    // Find the selected package
    const selectedPackage = CREDIT_PACKAGES.find(pkg => pkg.id === packageId);
    if (!selectedPackage) {
      return NextResponse.json(
        { error: 'Invalid package selected' },
        { status: 400 }
      );
    }
    
    // CRITICAL: Check platform capacity before creating checkout session
    const requiredNanoBananaCredits = selectedPackage.credits * 4; // 1:4 ratio
    
    const { data: platformCredit } = await supabase
      .from('platform_credits')
      .select('current_balance, low_balance_threshold')
      .eq('provider', 'nanobanana')
      .single();
    
    if (!platformCredit) {
      return NextResponse.json(
        { error: 'Platform configuration error' },
        { status: 500 }
      );
    }
    
    const availableUserCredits = Math.floor(platformCredit.current_balance / 4);
    
    if (availableUserCredits < selectedPackage.credits) {
      return NextResponse.json(
        { 
          error: 'Service temporarily unavailable',
          message: 'The platform cannot fulfill this credit purchase at the moment. Please try a smaller package or contact support.',
          availableCredits: availableUserCredits,
          requestedCredits: selectedPackage.credits
        },
        { status: 503 }
      );
    }

    // Get or create Stripe customer
    let stripeCustomerId: string;
    
    // Check if user already has a Stripe customer ID
    const { data: userData } = await supabase
      .from('users')
      .select('stripe_customer_id, email')
      .eq('id', user.id)
      .single();
    
    if (userData?.stripe_customer_id) {
      stripeCustomerId = userData.stripe_customer_id;
    } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email || userData?.email,
        metadata: {
          user_id: user.id,
          source: 'preset_app'
        }
      });
      
      stripeCustomerId = customer.id;
      
      // Save customer ID to database
      await supabase
        .from('users')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', user.id);
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: selectedPackage.name,
              description: selectedPackage.description,
              metadata: {
                credits: selectedPackage.credits.toString(),
                package_id: selectedPackage.id,
              }
            },
            unit_amount: Math.round(selectedPackage.priceUsd * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl || `${process.env.NEXT_PUBLIC_APP_URL}/credits/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/credits/cancelled`,
      metadata: {
        type: 'credit_purchase',
        user_id: user.id,
        package_id: selectedPackage.id,
        credits: selectedPackage.credits.toString(),
      },
      // Enable automatic tax calculation if configured
      automatic_tax: { enabled: false },
      // Collect billing address for tax purposes
      billing_address_collection: 'auto',
      // Set session expiration
      expires_at: Math.floor(Date.now() / 1000) + (30 * 60), // 30 minutes
    });

    // Log the checkout session creation
    await supabase
      .from('checkout_sessions')
      .insert({
        user_id: user.id,
        stripe_session_id: session.id,
        package_id: selectedPackage.id,
        credits: selectedPackage.credits,
        amount_usd: selectedPackage.priceUsd,
        status: 'created',
        expires_at: new Date(session.expires_at! * 1000).toISOString()
      });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
      packageInfo: {
        name: selectedPackage.name,
        credits: selectedPackage.credits,
        price: selectedPackage.priceUsd
      }
    });
    
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    
    // Handle specific Stripe errors
    if (error.type === 'StripeCardError') {
      return NextResponse.json(
        { error: 'Your card was declined.' },
        { status: 400 }
      );
    }
    
    if (error.type === 'StripeRateLimitError') {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }
    
    if (error.type === 'StripeInvalidRequestError') {
      return NextResponse.json(
        { error: 'Invalid request parameters.' },
        { status: 400 }
      );
    }
    
    if (error.type === 'StripeAPIError') {
      return NextResponse.json(
        { error: 'An error occurred with our payment processor.' },
        { status: 500 }
      );
    }
    
    if (error.type === 'StripeConnectionError') {
      return NextResponse.json(
        { error: 'A network error occurred. Please try again.' },
        { status: 500 }
      );
    }
    
    if (error.type === 'StripeAuthenticationError') {
      return NextResponse.json(
        { error: 'Authentication with payment processor failed.' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
  */
}

// GET endpoint to retrieve checkout session details
export async function GET(request: NextRequest) {
  // Temporary disabled - Stripe package not installed
  return NextResponse.json(
    { error: 'Stripe integration temporarily disabled' },
    { status: 503 }
  );

  /* Original code (commented out until Stripe is installed)
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }
    
    // Get user from auth
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Retrieve session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    // Verify session belongs to user
    if (session.metadata?.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }
    
    // Get purchase details from database
    const { data: purchase } = await supabase
      .from('user_credit_purchases')
      .select('*')
      .eq('stripe_session_id', sessionId)
      .eq('user_id', user.id)
      .single();
    
    return NextResponse.json({
      session: {
        id: session.id,
        payment_status: session.payment_status,
        amount_total: session.amount_total,
        currency: session.currency,
        metadata: session.metadata,
        created: session.created,
      },
      purchase: purchase || null
    });
    
  } catch (error: any) {
    console.error('Error retrieving checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve checkout session' },
      { status: 500 }
    );
  }
  */
}
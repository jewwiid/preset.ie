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
    console.log('🔍 Credit package checkout session creation started')
    
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

    // Get user's profile to get the correct user ID for credits table
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('users_profile')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ 
        error: 'User profile not found' 
      }, { status: 404 });
    }

    // Check if this is a lootbox package or regular credit package
    let creditPackage: any;
    let isLootbox = false;

    // Try lootbox first
    const { data: lootboxPackage } = await supabaseAdmin
      .from('lootbox_packages')
      .select('*')
      .eq('id', packageId)
      .eq('is_active', true)
      .single();

    if (lootboxPackage) {
      creditPackage = lootboxPackage;
      isLootbox = true;
      
      // Check if user already purchased a lootbox this event period
      const now = new Date();
      const dayOfWeek = now.getDay();
      const dayOfMonth = now.getDate();
      
      let eventPeriod = '';
      
      // Weekend Flash Sale
      if ((dayOfWeek === 5 && now.getHours() >= 18) || dayOfWeek === 6 || (dayOfWeek === 0)) {
        const year = now.getFullYear();
        const weekNum = Math.ceil((now.getDate() + new Date(year, now.getMonth(), 1).getDay()) / 7);
        eventPeriod = `${year}-W${weekNum}`;
      }
      // Mid-Month Special
      else if (dayOfMonth >= 15 && dayOfMonth <= 17) {
        eventPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-15`;
      }
      
      // Check for existing purchase in this event period
      const { data: existingPurchase } = await supabaseAdmin
        .from('lootbox_events')
        .select('id, event_name, purchased_at')
        .eq('purchased_by', user.id)
        .eq('event_period', eventPeriod)
        .single();
      
      if (existingPurchase) {
        console.log('❌ User already purchased lootbox this period:', {
          userId: user.id,
          eventPeriod,
          previousPurchase: existingPurchase
        });
        return NextResponse.json({ 
          error: 'You have already purchased a lootbox during this event period. Only one per event allowed!' 
        }, { status: 400 });
      }
    } else {
      // Try regular credit package
      const { data: regularPackage, error: packageError } = await supabaseAdmin
        .from('credit_packages')
        .select('*')
        .eq('id', packageId)
        .eq('is_active', true)
        .single();

      if (packageError || !regularPackage) {
        return NextResponse.json({ 
          error: 'Invalid credit package' 
        }, { status: 400 });
      }

      creditPackage = regularPackage;
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: creditPackage.name,
              description: `${creditPackage.credits} credits for your account`,
            },
            unit_amount: Math.round(Number(creditPackage.price_usd) * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment', // One-time payment, not subscription
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: user.email,
      metadata: {
        userId: user.id,
        profileId: profile.id,
        packageId: creditPackage.id,
        packageName: creditPackage.name,
        credits: (creditPackage.user_credits || creditPackage.credits).toString(),
        priceUsd: creditPackage.price_usd.toString(),
        type: isLootbox ? 'lootbox_purchase' : 'credit_purchase', // Identify type
        isLootbox: isLootbox.toString(),
      },
    });

    console.log('✅ Credit package checkout session created:', {
      sessionId: session.id,
      packageId: creditPackage.id,
      credits: creditPackage.credits
    });

    return NextResponse.json({ 
      sessionId: session.id,
      url: session.url 
    });

  } catch (error: any) {
    console.error('Error creating credit package checkout session:', error);
    return NextResponse.json({ 
      error: 'Failed to create checkout session',
      details: error.message 
    }, { status: 500 });
  }
}


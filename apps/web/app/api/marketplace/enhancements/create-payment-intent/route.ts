import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { stripe } from '@/lib/stripe';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ENHANCEMENT_PRICING = {
  basic_bump: { amount: 100, duration_days: 1 }, // €1
  priority_bump: { amount: 500, duration_days: 3 }, // €5
  premium_bump: { amount: 700, duration_days: 7 } // €7
};

export async function POST(request: NextRequest) {
  try {
    const { listingId, enhancementType, userId } = await request.json();
    
    if (!listingId || !enhancementType || !userId) {
      return NextResponse.json({ 
        error: 'Missing required fields: listingId, enhancementType, userId' 
      }, { status: 400 });
    }

    // Verify user owns the listing
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('id, owner_id')
      .eq('id', listingId)
      .eq('owner_id', userId)
      .single();
    
    if (listingError || !listing) {
      return NextResponse.json({ 
        error: 'Listing not found or you do not own this listing' 
      }, { status: 404 });
    }
    
    const pricing = ENHANCEMENT_PRICING[enhancementType as keyof typeof ENHANCEMENT_PRICING];
    
    if (!pricing) {
      return NextResponse.json({ 
        error: 'Invalid enhancement type' 
      }, { status: 400 });
    }
    
    // Create real Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: pricing.amount,
      currency: 'eur',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        listing_id: listingId,
        enhancement_type: enhancementType,
        user_id: userId,
        type: 'listing_enhancement'
      },
      description: `Boost listing - ${enhancementType.replace('_', ' ')} (${pricing.duration_days} days)`,
    });
    
    return NextResponse.json({
      client_secret: paymentIntent.client_secret,
      amount: pricing.amount,
      duration_days: pricing.duration_days,
      enhancement_type: enhancementType,
      payment_intent_id: paymentIntent.id
    });
    
  } catch (error) {
    console.error('Payment intent creation error:', error);
    return NextResponse.json({ 
      error: 'Payment intent creation failed' 
    }, { status: 500 });
  }
}

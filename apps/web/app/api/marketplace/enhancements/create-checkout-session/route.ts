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
      .select('id, owner_id, title')
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

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `${enhancementType.replace('_', ' ').toUpperCase()} Boost`,
              description: `Boost your listing "${listing.title}" for ${pricing.duration_days} day${pricing.duration_days > 1 ? 's' : ''}`,
            },
            unit_amount: pricing.amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/gear/boost/success?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/gear/boost/success?canceled=true`,
      metadata: {
        listing_id: listingId,
        enhancement_type: enhancementType,
        user_id: userId,
        type: 'listing_enhancement'
      },
    });

    return NextResponse.json({
      session_id: session.id,
      url: session.url,
      amount: pricing.amount,
      duration_days: pricing.duration_days,
      enhancement_type: enhancementType
    });
    
  } catch (error) {
    console.error('Checkout session creation error:', error);
    return NextResponse.json({ 
      error: 'Checkout session creation failed' 
    }, { status: 500 });
  }
}

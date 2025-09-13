import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const purchaseSchema = z.object({
  packageId: z.string().uuid(),
  userCredits: z.number().positive(),
  priceUsd: z.number().positive()
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { packageId, userCredits, priceUsd } = purchaseSchema.parse(body);

    // Initialize Supabase clients
    const supabaseAnon = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get user session
    const { data: { user }, error: authError } = await supabaseAnon.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify lootbox package exists and is available
    const { data: lootboxPackage } = await supabaseAdmin
      .from('lootbox_packages')
      .select('*')
      .eq('id', packageId)
      .eq('is_active', true)
      .single();

    if (!lootboxPackage) {
      return NextResponse.json(
        { error: 'Lootbox package not found or inactive' },
        { status: 404 }
      );
    }

    // Check current NanoBanana credits
    const apiKey = process.env.NANOBANANA_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'NanoBanana API key not configured' },
        { status: 500 }
      );
    }

    const response = await fetch('https://api.nanobananaapi.ai/api/v1/common/credit', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to verify NanoBanana credits' },
        { status: 500 }
      );
    }

    const nanoBananaData = await response.json();
    const currentNanoBananaCredits = nanoBananaData.data || 0;

    // Verify availability
    const creditRatio = 4;
    const requiredNanoBananaCredits = userCredits * creditRatio;
    
    if (currentNanoBananaCredits < lootboxPackage.nano_banana_threshold || 
        currentNanoBananaCredits < requiredNanoBananaCredits) {
      return NextResponse.json(
        { 
          error: 'Lootbox no longer available',
          details: `Required ${requiredNanoBananaCredits} NanoBanana credits, but only ${currentNanoBananaCredits} available`
        },
        { status: 400 }
      );
    }

    // Check if user already purchased this lootbox event
    const { data: existingPurchase } = await supabaseAdmin
      .from('lootbox_events')
      .select('*')
      .eq('purchased_by', user.id)
      .eq('event_type', 'purchased')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
      .single();

    if (existingPurchase) {
      return NextResponse.json(
        { error: 'You have already purchased a lootbox in the last 24 hours' },
        { status: 400 }
      );
    }

    // Get user's current credit balance
    const { data: userCreditsData } = await supabaseAdmin
      .from('user_credits')
      .select('current_balance')
      .eq('user_id', user.id)
      .single();

    const currentBalance = userCreditsData?.current_balance || 0;

    // Update user credits
    const { error: updateError } = await supabaseAdmin
      .from('user_credits')
      .upsert({
        user_id: user.id,
        current_balance: currentBalance + userCredits,
        updated_at: new Date().toISOString()
      });

    if (updateError) {
      console.error('Error updating user credits:', updateError);
      return NextResponse.json(
        { error: 'Failed to update user credits' },
        { status: 500 }
      );
    }

    // Update platform credits (credit_pools)
    const { data: platformCredit } = await supabaseAdmin
      .from('credit_pools')
      .select('available_balance, total_consumed')
      .eq('provider', 'nanobanan')
      .single();

    if (!platformCredit) {
      return NextResponse.json(
        { error: 'Platform credit pool not found' },
        { status: 500 }
      );
    }

    const { error: platformUpdateError } = await supabaseAdmin
      .from('credit_pools')
      .update({
        available_balance: platformCredit.available_balance - requiredNanoBananaCredits,
        total_consumed: platformCredit.total_consumed + requiredNanoBananaCredits,
        updated_at: new Date().toISOString()
      })
      .eq('provider', 'nanobanan');

    if (platformUpdateError) {
      console.error('Error updating platform credits:', platformUpdateError);
      return NextResponse.json(
        { error: 'Failed to update platform credits' },
        { status: 500 }
      );
    }

    // Record the lootbox purchase event
    const { error: eventError } = await supabaseAdmin
      .from('lootbox_events')
      .insert({
        event_type: 'purchased',
        nano_banana_threshold: lootboxPackage.nano_banana_threshold,
        nano_banana_credits_at_trigger: currentNanoBananaCredits,
        user_credits_offered: userCredits,
        price_usd: priceUsd,
        margin_percentage: lootboxPackage.margin_percentage,
        purchased_at: new Date().toISOString(),
        purchased_by: user.id
      });

    if (eventError) {
      console.error('Error recording lootbox event:', eventError);
      // Don't fail the purchase for logging errors
    }

    // Record the purchase in user_credit_purchases
    const { error: purchaseError } = await supabaseAdmin
      .from('user_credit_purchases')
      .insert({
        user_id: user.id,
        package_id: packageId,
        credits_purchased: userCredits,
        price_usd: priceUsd,
        payment_method: 'lootbox',
        status: 'completed',
        stripe_session_id: null, // No Stripe session for lootbox
        purchased_at: new Date().toISOString()
      });

    if (purchaseError) {
      console.error('Error recording credit purchase:', purchaseError);
      // Don't fail the purchase for logging errors
    }

    return NextResponse.json({
      success: true,
      message: 'Lootbox purchased successfully!',
      credits_added: userCredits,
      new_balance: currentBalance + userCredits,
      price_paid: priceUsd,
      lootbox_package: {
        name: lootboxPackage.name,
        description: lootboxPackage.description
      }
    });

  } catch (error) {
    console.error('Error purchasing lootbox:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Failed to purchase lootbox',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

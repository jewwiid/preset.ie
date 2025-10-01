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

    // Check if lootbox is currently active (time-based check)
    // This is deprecated - now using Stripe checkout which does the check
    // Keeping for backward compatibility with direct API calls

    // Calculate current event period
    const now = new Date();
    const dayOfWeek = now.getDay();
    const dayOfMonth = now.getDate();
    let eventPeriod = '';
    
    if ((dayOfWeek === 5 && now.getHours() >= 18) || dayOfWeek === 6 || (dayOfWeek === 0)) {
      const year = now.getFullYear();
      const weekNum = Math.ceil((now.getDate() + new Date(year, now.getMonth(), 1).getDay()) / 7);
      eventPeriod = `${year}-W${weekNum}`;
    } else if (dayOfMonth >= 15 && dayOfMonth <= 17) {
      eventPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-15`;
    }

    // Check if user already purchased this event period
    const { data: existingPurchase } = await supabaseAdmin
      .from('lootbox_events')
      .select('*')
      .eq('purchased_by', user.id)
      .eq('event_period', eventPeriod)
      .single();

    if (existingPurchase) {
      return NextResponse.json(
        { error: 'You have already purchased a lootbox during this event period. Only one per event allowed!' },
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

    // Note: No need to update platform credit pools since we're using Wavespeed pay-per-use
    // Credits are charged when actually used, not pre-allocated

    // Determine event name
    let eventName = 'Direct Purchase';
    if ((dayOfWeek === 5 && now.getHours() >= 18) || dayOfWeek === 6 || (dayOfWeek === 0)) {
      eventName = '🎉 Weekend Flash Sale';
    } else if (dayOfMonth >= 15 && dayOfMonth <= 17) {
      eventName = '💎 Mid-Month Mega Deal';
    }

    // Record the lootbox purchase event
    const { error: eventError } = await supabaseAdmin
      .from('lootbox_events')
      .insert({
        event_type: 'purchased',
        event_name: eventName,
        event_period: eventPeriod,
        package_id: packageId,
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

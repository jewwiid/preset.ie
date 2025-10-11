import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
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

    const { packageId, userCredits, priceUsd } = await request.json();
    
    // CRITICAL: Check if platform has enough credits
    const requiredNanoBananaCredits = userCredits * 4; // 1:4 ratio
    
    // Get current platform balance
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
    
    // Check platform capacity
    const availableUserCredits = Math.floor(platformCredit.current_balance / 4);
    
    if (availableUserCredits < userCredits) {
      // PLATFORM DOESN'T HAVE ENOUGH CREDITS!
      console.error(`
        ⚠️ CRITICAL: Platform capacity exceeded!
        User wants: ${userCredits} credits
        Platform can serve: ${availableUserCredits} credits
        NanoBanana balance: ${platformCredit.current_balance}
        Needed: ${requiredNanoBananaCredits} NanoBanana credits
      `);
      
      // Log alert
      await supabase.from('platform_alerts').insert({
        alert_type: 'insufficient_platform_credits',
        provider: 'nanobanana',
        severity: 'critical',
        message: `Cannot sell ${userCredits} credits. Platform only has ${platformCredit.current_balance} NanoBanana credits (can serve ${availableUserCredits} user credits)`,
        metadata: {
          requested_user_credits: userCredits,
          available_user_credits: availableUserCredits,
          platform_balance: platformCredit.current_balance,
          required_provider_credits: requiredNanoBananaCredits
        }
      });
      
      return NextResponse.json(
        { 
          error: 'Service temporarily unavailable',
          message: 'The platform cannot fulfill this credit purchase at the moment. Please try a smaller package or contact support.',
          availableCredits: availableUserCredits,
          requestedCredits: userCredits
        },
        { status: 503 }
      );
    }
    
    // Platform has enough credits, proceed with purchase
    
    // 1. Add credits to user
    const { data: userCreditsData } = await supabase
      .from('user_credits')
      .select('current_balance')
      .eq('user_id', user.id)
      .single();
    
    const newBalance = (userCreditsData?.current_balance || 0) + userCredits;
    
    await supabase
      .from('user_credits')
      .upsert({
        user_id: user.id,
        current_balance: newBalance,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });
    
    // 2. Log the purchase
    await supabase
      .from('user_credit_purchases')
      .insert({
        user_id: user.id,
        package_id: packageId,
        credits_purchased: userCredits,
        amount_paid_usd: priceUsd,
        payment_method: 'stripe', // Would come from Stripe webhook
        status: 'completed',
        completed_at: new Date().toISOString()
      });
    
    // 3. Update platform tracking (reserve these credits)
    await supabase
      .from('platform_credit_consumption')
      .insert({
        provider: 'nanobanana',
        user_id: user.id,
        operation_type: 'credit_purchase_reservation',
        user_credits_charged: userCredits,
        provider_credits_consumed: requiredNanoBananaCredits,
        metadata: {
          package_id: packageId,
          reservation: true,
          note: 'Credits reserved for user purchase'
        }
      });
    
    // 4. Check if platform is running low after this purchase
    const remainingPlatformCredits = platformCredit.current_balance - requiredNanoBananaCredits;
    const remainingUserCapacity = Math.floor(remainingPlatformCredits / 4);
    
    if (remainingPlatformCredits < platformCredit.low_balance_threshold) {
      // Alert admin that platform is running low
      await supabase.from('platform_alerts').insert({
        alert_type: 'low_platform_credits_after_sale',
        provider: 'nanobanana',
        severity: remainingPlatformCredits < 100 ? 'critical' : 'warning',
        message: `Platform credits low after sale. Only ${remainingUserCapacity} user credits can be sold.`,
        metadata: {
          remaining_provider_credits: remainingPlatformCredits,
          remaining_user_capacity: remainingUserCapacity,
          last_sale_credits: userCredits
        }
      });
    }
    
    return NextResponse.json({
      success: true,
      newBalance,
      message: `Successfully purchased ${userCredits} credits`,
      platformStatus: {
        remainingCapacity: remainingUserCapacity,
        isLow: remainingPlatformCredits < platformCredit.low_balance_threshold
      }
    });
    
  } catch (error: any) {
    console.error('Credit purchase error:', error);
    return NextResponse.json(
      { error: 'Failed to process credit purchase' },
      { status: 500 }
    );
  }
}

// GET endpoint to check platform capacity before showing packages
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get platform credits
    const { data: platformCredit } = await supabase
      .from('platform_credits')
      .select('current_balance')
      .eq('provider', 'nanobanana')
      .single();
    
    // Get credit packages
    const { data: packages } = await supabase
      .from('credit_packages')
      .select('*')
      .eq('is_active', true)
      .order('credits');
    
    if (!platformCredit || !packages) {
      return NextResponse.json({ error: 'Configuration error' }, { status: 500 });
    }
    
    // Calculate which packages can be fulfilled
    const availableUserCredits = Math.floor(platformCredit.current_balance / 4);
    
    const packagesWithAvailability = packages.map(pkg => ({
      ...pkg,
      available: pkg.user_credits <= availableUserCredits,
      warning: pkg.user_credits > availableUserCredits * 0.5, // Warn if package uses >50% of capacity
      message: pkg.user_credits > availableUserCredits 
        ? `Temporarily unavailable (platform capacity: ${availableUserCredits} credits)`
        : null
    }));
    
    return NextResponse.json({
      packages: packagesWithAvailability,
      platformCapacity: {
        totalUserCredits: availableUserCredits,
        nanoBananaCredits: platformCredit.current_balance,
        canSellStarter: availableUserCredits >= 10,
        canSellCreative: availableUserCredits >= 50,
        canSellPro: availableUserCredits >= 100,
        canSellStudio: availableUserCredits >= 500
      }
    });
  } catch (error: any) {
    console.error('Error checking package availability:', error);
    return NextResponse.json(
      { error: 'Failed to check availability' },
      { status: 500 }
    );
  }
}
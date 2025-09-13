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
    const { data: platformCredit } = await supabase
      .from('credit_pools')
      .select('available_balance, auto_refill_threshold, total_consumed')
      .eq('provider', 'nanobanan')
      .single();
    
    if (!platformCredit) {
      return NextResponse.json(
        { error: 'Platform configuration error' },
        { status: 500 }
      );
    }
    
    const creditRatio = 4; // Default 1:4 ratio (1 user credit = 4 nanobanan credits)
    const requiredNanoBananaCredits = userCredits * creditRatio;
    
    // Check platform capacity
    const availableUserCredits = Math.floor(platformCredit.available_balance / creditRatio);
    
    if (availableUserCredits < userCredits) {
      // PLATFORM DOESN'T HAVE ENOUGH CREDITS!
      console.error(`
        ⚠️ CRITICAL: Platform capacity exceeded!
        User wants: ${userCredits} credits
        Platform can serve: ${availableUserCredits} credits
        NanoBanana balance: ${platformCredit.available_balance}
        Needed: ${requiredNanoBananaCredits} NanoBanana credits
      `);
      
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
        payment_provider: 'stripe', // Would come from Stripe webhook
        status: 'completed'
      });
    
    // 3. Update platform tracking (reserve these credits)
    await supabase
      .from('credit_pools')
      .update({
        available_balance: platformCredit.available_balance - requiredNanoBananaCredits,
        total_consumed: platformCredit.total_consumed + requiredNanoBananaCredits,
        updated_at: new Date().toISOString()
      })
      .eq('provider', 'nanobanan');
    
    // 4. Check if platform is running low after this purchase
    const remainingPlatformCredits = platformCredit.available_balance - requiredNanoBananaCredits;
    const remainingUserCapacity = Math.floor(remainingPlatformCredits / creditRatio);
    
    return NextResponse.json({
      success: true,
      newBalance,
      message: `Successfully purchased ${userCredits} credits`,
      platformStatus: {
        remainingCapacity: remainingUserCapacity,
        isLow: remainingPlatformCredits < platformCredit.auto_refill_threshold
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
      .from('credit_pools')
      .select('available_balance')
      .eq('provider', 'nanobanan')
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
    const creditRatio = 4; // Default 1:4 ratio (1 user credit = 4 nanobanan credits)
    const availableUserCredits = Math.floor(platformCredit.available_balance / creditRatio);
    
    const packagesWithAvailability = packages.map(pkg => ({
      ...pkg,
      available: pkg.credits <= availableUserCredits,
      warning: pkg.credits > availableUserCredits * 0.5, // Warn if package uses >50% of capacity
      message: pkg.credits > availableUserCredits 
        ? `Temporarily unavailable (platform capacity: ${availableUserCredits} credits)`
        : null
    }));

    // Check for lootbox availability only if requested
    const { searchParams } = new URL(request.url);
    const includeLootbox = searchParams.get('include_lootbox') === 'true';
    let lootboxPackages = [];
    
    if (includeLootbox) {
      try {
        const lootboxResponse = await fetch(`${request.nextUrl.origin}/api/lootbox/availability`);
        if (lootboxResponse.ok) {
          const lootboxData = await lootboxResponse.json();
          if (lootboxData.success && lootboxData.lootbox.is_available) {
            lootboxPackages = lootboxData.lootbox.available_packages;
          }
        }
      } catch (error) {
        console.error('Error checking lootbox availability:', error);
        // Continue without lootbox packages
      }
    }
    
    return NextResponse.json({
      packages: packagesWithAvailability,
      lootboxPackages: lootboxPackages,
      platformCapacity: {
        totalUserCredits: availableUserCredits,
        nanoBananaCredits: platformCredit.available_balance,
        canSellStarter: availableUserCredits >= 10,
        canSellCreative: availableUserCredits >= 50,
        canSellPro: availableUserCredits >= 100,
        canSellStudio: availableUserCredits >= 500,
        lootboxAvailable: lootboxPackages.length > 0
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
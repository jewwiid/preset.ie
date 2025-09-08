import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Credit packages available for purchase
const CREDIT_PACKAGES = {
  small: {
    credits: 10,
    price: 2.50,  // $0.25 per credit
    name: 'Small Pack'
  },
  medium: {
    credits: 25,
    price: 5.00,  // $0.20 per credit (discount)
    name: 'Medium Pack'
  },
  large: {
    credits: 60,
    price: 10.00, // $0.167 per credit (bigger discount)
    name: 'Large Pack'
  }
};

export async function POST(request: NextRequest) {
  try {
    // Get auth token from header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    // Initialize Supabase with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verify the user's token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Parse request body
    const { packageType } = await request.json();

    // Validate package type
    if (!packageType || !CREDIT_PACKAGES[packageType as keyof typeof CREDIT_PACKAGES]) {
      return NextResponse.json(
        { success: false, error: 'Invalid package type' },
        { status: 400 }
      );
    }

    const selectedPackage = CREDIT_PACKAGES[packageType as keyof typeof CREDIT_PACKAGES];

    // Check user's subscription tier (only Plus and Pro can purchase)
    const { data: profile } = await supabase
      .from('users_profile')
      .select('subscription_tier')
      .eq('user_id', user.id)
      .single();

    if (!profile || profile.subscription_tier === 'FREE' || profile.subscription_tier === 'free') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Credit purchases are only available for Plus and Pro subscribers',
          upgradeRequired: true
        },
        { status: 403 }
      );
    }

    // Get or create user credits record
    const { data: existingCredits } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (existingCredits) {
      // Update existing credits
      const { data: updatedCredits, error: updateError } = await supabase
        .from('user_credits')
        .update({
          current_balance: existingCredits.current_balance + selectedPackage.credits,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      // Record the transaction
      await supabase
        .from('credit_transactions')
        .insert({
          user_id: user.id,
          transaction_type: 'purchase',
          credits_used: selectedPackage.credits,
          cost_usd: selectedPackage.price,
          description: `Purchased ${selectedPackage.name}: ${selectedPackage.credits} credits`,
          status: 'completed',
          metadata: {
            package: packageType,
            price: selectedPackage.price,
            credits: selectedPackage.credits
          }
        });

      return NextResponse.json({
        success: true,
        credits: {
          purchased: selectedPackage.credits,
          newBalance: updatedCredits.current_balance,
          price: selectedPackage.price
        },
        message: `Successfully purchased ${selectedPackage.credits} credits`
      });
      
    } else {
      // Create new credits record
      const { data: newCredits, error: createError } = await supabase
        .from('user_credits')
        .insert({
          user_id: user.id,
          subscription_tier: profile.subscription_tier,
          monthly_allowance: profile.subscription_tier === 'PRO' || profile.subscription_tier === 'pro' ? 25 : 10,
          current_balance: selectedPackage.credits,
          consumed_this_month: 0,
          lifetime_consumed: 0
        })
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      // Record the transaction
      await supabase
        .from('credit_transactions')
        .insert({
          user_id: user.id,
          transaction_type: 'purchase',
          credits_used: selectedPackage.credits,
          cost_usd: selectedPackage.price,
          description: `Purchased ${selectedPackage.name}: ${selectedPackage.credits} credits`,
          status: 'completed'
        });

      return NextResponse.json({
        success: true,
        credits: {
          purchased: selectedPackage.credits,
          newBalance: newCredits.current_balance,
          price: selectedPackage.price
        },
        message: `Successfully purchased ${selectedPackage.credits} credits`
      });
    }

  } catch (error: any) {
    console.error('Credit purchase error:', error);
    
    return NextResponse.json(
      { success: false, error: 'Failed to purchase credits' },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch credit packages and user balance
export async function GET(request: NextRequest) {
  try {
    // Get auth token from header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    // Initialize Supabase
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verify the user's token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Get user's current credits
    const { data: credits } = await supabase
      .from('user_credits')
      .select('current_balance, monthly_allowance, consumed_this_month')
      .eq('user_id', user.id)
      .single();

    // Get user's subscription tier
    const { data: profile } = await supabase
      .from('users_profile')
      .select('subscription_tier')
      .eq('user_id', user.id)
      .single();

    const canPurchase = profile && 
      profile.subscription_tier !== 'FREE' && 
      profile.subscription_tier !== 'free';

    return NextResponse.json({
      success: true,
      packages: CREDIT_PACKAGES,
      currentBalance: credits?.current_balance || 0,
      monthlyAllowance: credits?.monthly_allowance || 0,
      consumedThisMonth: credits?.consumed_this_month || 0,
      canPurchase,
      subscriptionTier: profile?.subscription_tier || 'FREE'
    });

  } catch (error: any) {
    console.error('Credit info error:', error);
    
    return NextResponse.json(
      { success: false, error: 'Failed to fetch credit information' },
      { status: 500 }
    );
  }
}
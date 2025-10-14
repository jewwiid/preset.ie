import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(request: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }
    
    // Get user from auth
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { packageId, userCredits, priceUsd } = await request.json();
    
    // NOTE: With Wavespeed pay-per-use, no platform capacity checks needed
    // Credits are billed when actually used, not pre-allocated
    
    // Proceed with purchase
    
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
    
    // NOTE: No need to update credit_pools with pay-per-use model
    // Credits are charged from Wavespeed when actually consumed
    
    return NextResponse.json({
      success: true,
      newBalance,
      message: `Successfully purchased ${userCredits} credits`,
      billingModel: 'pay_per_use'
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
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Get platform credits
    const { data: platformCredit, error: platformError } = await supabase
      .from('credit_pools')
      .select('available_balance')
      .eq('provider', 'nanobanan')
      .single();
    
    // Get credit packages from database
    const { data: packagesData, error: packagesError } = await supabase
      .from('credit_packages')
      .select('*')
      .eq('is_active', true)
      .order('credits');
    
    if (packagesError) {
      console.error('Failed to fetch credit packages:', packagesError);
      return NextResponse.json({ 
        error: 'Failed to fetch credit packages',
        details: packagesError.message
      }, { status: 500 });
    }
    
    if (!packagesData || packagesData.length === 0) {
      return NextResponse.json({ 
        error: 'No credit packages found' 
      }, { status: 500 });
    }
    
    if (!platformCredit) {
      console.error('Configuration error:', { platformCredit, platformError });
      return NextResponse.json({ 
        error: 'Configuration error',
        details: { platformCredit, platformError }
      }, { status: 500 });
    }
    
    // With Wavespeed pay-per-use, all packages are always available
    // No need to check platform capacity since we're billed per actual use
    const packagesWithAvailability = packagesData.map(pkg => ({
      ...pkg,
      available: true, // Always available with pay-per-use
      warning: false,
      message: null
    }));

    return NextResponse.json({
      packages: packagesWithAvailability,
      platformCapacity: {
        model: 'wavespeed_pay_per_use',
        allPackagesAvailable: true,
        note: 'All credit packages always available (pay-per-use billing)'
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
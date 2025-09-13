import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    // Initialize Supabase with service role for admin operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get current NanoBanana credits from their API
    let nanoBananaCredits = 0;
    let nanoBananaError = null;
    
    try {
      const apiKey = process.env.NANOBANANA_API_KEY;
      if (apiKey) {
        const response = await fetch('https://api.nanobananaapi.ai/api/v1/common/credit', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          nanoBananaCredits = data.data || 0;
        } else {
          nanoBananaError = `HTTP ${response.status}`;
        }
      } else {
        nanoBananaError = 'NanoBanana API key not configured';
      }
    } catch (error) {
      nanoBananaError = error instanceof Error ? error.message : 'Unknown error';
    }

    // Get active lootbox packages
    const { data: lootboxPackages } = await supabase
      .from('lootbox_packages')
      .select('*')
      .eq('is_active', true)
      .order('nano_banana_threshold', { ascending: true });

    const availablePackages = [];
    const creditRatio = 4; // 1 user credit = 4 NanoBanana credits

    for (const pkg of lootboxPackages || []) {
      const requiredNanoBananaCredits = pkg.user_credits * creditRatio;
      const isAvailable = nanoBananaCredits >= pkg.nano_banana_threshold && 
                         nanoBananaCredits >= requiredNanoBananaCredits;

      // Calculate competitive lootbox pricing
      // Regular credit packages: Starter ($0.50), Creative ($0.40), Pro ($0.35), Studio ($0.30)
      // Lootbox should be significantly better value
      const baseCostPerCredit = 0.20; // Lower base cost for lootbox (better than Studio tier)
      const marginMultiplier = 1 + (pkg.margin_percentage / 100);
      const dynamicPrice = pkg.user_credits * baseCostPerCredit * marginMultiplier;
      
      // Apply lootbox discount (make it a great deal)
      const lootboxDiscount = 0.40; // 40% discount for lootbox (better than 25%)
      const discountedPrice = dynamicPrice * (1 - lootboxDiscount);

      availablePackages.push({
        id: pkg.id,
        name: pkg.name,
        description: pkg.description,
        user_credits: pkg.user_credits,
        price_usd: Math.round(discountedPrice * 100) / 100,
        price_per_credit: Math.round((discountedPrice / pkg.user_credits) * 100) / 100,
        nano_banana_threshold: pkg.nano_banana_threshold,
        margin_percentage: pkg.margin_percentage,
        is_lootbox: true,
        available: isAvailable, // Show availability status
        savings_percentage: Math.round(lootboxDiscount * 100), // 40% savings
        current_nano_banana_credits: nanoBananaCredits,
        threshold_met: nanoBananaCredits >= 10000
      });
    }

    return NextResponse.json({
      success: true,
      lootbox: {
        is_available: availablePackages.length > 0,
        is_active: false,
        current_event: null,
        available_packages: availablePackages,
        nano_banana_status: {
          current_credits: nanoBananaCredits,
          error: nanoBananaError,
          threshold_met: nanoBananaCredits >= 10000
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error checking lootbox availability:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check lootbox availability',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

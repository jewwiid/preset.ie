import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    // Initialize Supabase with service role for admin operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get our internal platform credit tracking
    const { data: creditPools } = await supabase
      .from('credit_pools')
      .select('*')
      .eq('provider', 'nanobanan')
      .single();

    // Get real-time NanoBanana API credits
    let nanoBananaCredits = null;
    let nanoBananaError = null;
    
    try {
      const apiKey = process.env.NANOBANANA_API_KEY;
      if (apiKey) {
        const response = await fetch('https://api.nanobananaapi.ai/api/v1/common/credit', {
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
        nanoBananaError = 'API key not configured';
      }
    } catch (error: any) {
      nanoBananaError = error.message;
    }

    // Calculate user credits available (1:4 ratio)
    const creditRatio = 4;
    const availableUserCredits = Math.floor((nanoBananaCredits || creditPools?.available_balance || 0) / creditRatio);

    // Get credit packages to show availability
    const { data: packages } = await supabase
      .from('credit_packages')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');

    const packageAvailability = packages?.map(pkg => ({
      id: pkg.id,
      name: pkg.name,
      credits: pkg.credits,
      available: pkg.credits <= availableUserCredits,
      price_usd: pkg.price_usd
    })) || [];

    return NextResponse.json({
      success: true,
      platform: {
        // Our internal tracking
        internal: {
          available_balance: creditPools?.available_balance || 0,
          total_purchased: creditPools?.total_purchased || 0,
          total_consumed: creditPools?.total_consumed || 0,
          cost_per_credit: creditPools?.cost_per_credit || 0.025,
          auto_refill_threshold: creditPools?.auto_refill_threshold || 100,
          status: creditPools?.status || 'unknown'
        },
        // Real-time NanoBanana API
        nanoBanana: {
          credits_remaining: nanoBananaCredits,
          error: nanoBananaError,
          last_checked: new Date().toISOString()
        },
        // Calculated availability
        calculated: {
          available_user_credits: availableUserCredits,
          credit_ratio: creditRatio,
          package_availability: packageAvailability
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Platform status API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch platform status',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

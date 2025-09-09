import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isAdmin } from '../../../../middleware/adminAuth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// GET /api/admin/platform-credits - Get all platform credit balances
export async function GET(request: NextRequest) {
  const { isValid, user } = await isAdmin(request);
  
  if (!isValid) {
    return NextResponse.json(
      { error: 'Unauthorized - Admin access required' },
      { status: 401 }
    );
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data, error } = await supabase
      .from('platform_credits')
      .select('*')
      .order('provider');
    
    if (error) throw error;
    
    // Calculate health status for each provider
    const creditsWithStatus = data?.map(credit => ({
      ...credit,
      health_status: getHealthStatus(credit.current_balance, credit.low_balance_threshold),
      days_remaining: estimateDaysRemaining(credit)
    })) || [];
    
    return NextResponse.json({
      success: true,
      data: creditsWithStatus
    });
  } catch (error: any) {
    console.error('Error fetching platform credits:', error);
    return NextResponse.json(
      { error: 'Failed to fetch platform credits' },
      { status: 500 }
    );
  }
}

// POST /api/admin/platform-credits - Refill credits for a provider
export async function POST(request: NextRequest) {
  const { isValid, user } = await isAdmin(request);
  
  if (!isValid) {
    return NextResponse.json(
      { error: 'Unauthorized - Admin access required' },
      { status: 401 }
    );
  }

  try {
    const { provider, amount, notes } = await request.json();
    
    if (!provider || !amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid provider or amount' },
        { status: 400 }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get current values first
    const { data: current } = await supabase
      .from('platform_credits')
      .select('current_balance, total_purchased')
      .eq('provider', provider)
      .single();
    
    if (!current) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      );
    }
    
    // Update platform credits with new values
    const { data: updatedCredits, error: updateError } = await supabase
      .from('platform_credits')
      .update({
        current_balance: current.current_balance + amount,
        total_purchased: current.total_purchased + amount,
        last_purchase_at: new Date().toISOString()
      })
      .eq('provider', provider)
      .select()
      .single();
    
    if (updateError) throw updateError;
    
    // Log the purchase
    const { error: logError } = await supabase
      .from('platform_credit_purchases')
      .insert({
        provider,
        amount_purchased: amount,
        cost_usd: calculateCost(provider, amount),
        payment_method: 'admin_manual',
        purchased_by: user.id,
        notes: notes || `Manual refill by admin`
      });
    
    if (logError) {
      console.error('Error logging purchase:', logError);
    }
    
    return NextResponse.json({
      success: true,
      data: updatedCredits,
      message: `Successfully added ${amount} credits to ${provider}`
    });
  } catch (error: any) {
    console.error('Error refilling credits:', error);
    return NextResponse.json(
      { error: 'Failed to refill credits' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/platform-credits - Update provider settings
export async function PATCH(request: NextRequest) {
  const { isValid } = await isAdmin(request);
  
  if (!isValid) {
    return NextResponse.json(
      { error: 'Unauthorized - Admin access required' },
      { status: 401 }
    );
  }

  try {
    const { 
      provider, 
      credit_ratio, 
      low_balance_threshold,
      auto_refill_enabled,
      auto_refill_amount 
    } = await request.json();
    
    if (!provider) {
      return NextResponse.json(
        { error: 'Provider is required' },
        { status: 400 }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const updateData: any = {};
    if (credit_ratio !== undefined) updateData.credit_ratio = credit_ratio;
    if (low_balance_threshold !== undefined) updateData.low_balance_threshold = low_balance_threshold;
    if (auto_refill_enabled !== undefined) updateData.auto_refill_enabled = auto_refill_enabled;
    if (auto_refill_amount !== undefined) updateData.auto_refill_amount = auto_refill_amount;
    
    const { data, error } = await supabase
      .from('platform_credits')
      .update(updateData)
      .eq('provider', provider)
      .select()
      .single();
    
    if (error) throw error;
    
    return NextResponse.json({
      success: true,
      data,
      message: `Successfully updated ${provider} settings`
    });
  } catch (error: any) {
    console.error('Error updating provider settings:', error);
    return NextResponse.json(
      { error: 'Failed to update provider settings' },
      { status: 500 }
    );
  }
}

// Helper functions
function getHealthStatus(currentBalance: number, threshold: number): string {
  const ratio = currentBalance / threshold;
  if (ratio > 5) return 'excellent';
  if (ratio > 2) return 'good';
  if (ratio > 1) return 'warning';
  return 'critical';
}

function estimateDaysRemaining(credit: any): number {
  // Simple estimation based on consumption rate
  if (!credit.total_consumed || !credit.last_consumption_at) return 999;
  
  const daysSinceFirstUse = Math.max(1, 
    (Date.now() - new Date(credit.created_at).getTime()) / (1000 * 60 * 60 * 24)
  );
  const dailyRate = credit.total_consumed / daysSinceFirstUse;
  
  if (dailyRate === 0) return 999;
  return Math.floor(credit.current_balance / dailyRate);
}

function calculateCost(provider: string, amount: number): number {
  // Estimated costs per provider (would be configured in env or DB)
  const costs: Record<string, number> = {
    nanobanana: 0.001, // $0.001 per credit
    openai: 0.01,      // $0.01 per credit
    pexels: 0.0001     // $0.0001 per API call
  };
  
  return amount * (costs[provider] || 0.001);
}
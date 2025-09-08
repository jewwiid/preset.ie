import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const { provider, amount } = await request.json();

    if (!provider || !amount) {
      return NextResponse.json(
        { error: 'Provider and amount are required' },
        { status: 400 }
      );
    }

    // Initialize Supabase with service role for admin operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get current pool
    const { data: pool } = await supabase
      .from('credit_pools')
      .select('*')
      .eq('provider', provider)
      .single();

    if (!pool) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      );
    }

    // Update pool with new credits
    const { error: updateError } = await supabase
      .from('credit_pools')
      .update({
        total_purchased: pool.total_purchased + amount,
        available_balance: pool.available_balance + amount,
        last_refill_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', pool.id);

    if (updateError) {
      throw new Error(`Failed to update credit pool: ${updateError.message}`);
    }

    // Log the manual refill
    await supabase
      .from('system_alerts')
      .insert({
        type: 'manual_credit_refill',
        level: 'info',
        message: `Manually refilled ${amount} credits for ${provider}`,
        metadata: { provider, amount, refilled_by: 'admin' }
      });

    return NextResponse.json({
      success: true,
      message: `Successfully refilled ${amount} credits for ${provider}`,
      newBalance: pool.available_balance + amount
    });

  } catch (error: any) {
    console.error('Refill credits API error:', error);
    
    return NextResponse.json(
      { error: 'Failed to refill credits' },
      { status: 500 }
    );
  }
}

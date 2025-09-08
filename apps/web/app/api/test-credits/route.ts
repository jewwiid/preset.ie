import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get all user credits
    const { data: credits, error } = await supabaseAdmin
      .from('user_credits')
      .select('*');
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Get auth users
    const { data: authData } = await supabaseAdmin.auth.admin.listUsers();
    
    // Map credits to users
    const userCredits = credits?.map(credit => {
      const user = authData?.users?.find(u => u.id === credit.user_id);
      return {
        email: user?.email || 'Unknown',
        user_id: credit.user_id,
        current_balance: credit.current_balance,
        monthly_allowance: credit.monthly_allowance,
        subscription_tier: credit.subscription_tier,
        consumed_this_month: credit.consumed_this_month
      };
    });
    
    return NextResponse.json({
      success: true,
      credits: userCredits,
      totalUsers: userCredits?.length || 0
    });
    
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
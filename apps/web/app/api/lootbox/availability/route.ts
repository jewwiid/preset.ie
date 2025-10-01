import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Check if lootbox should be available based on time-based triggers
function isLootboxActiveNow(): { active: boolean; eventType: string; expiresAt: Date | null } {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
  const hour = now.getHours();
  const dayOfMonth = now.getDate();
  
  // Weekend Flash Sale (Friday 6pm - Sunday 11:59pm)
  if ((dayOfWeek === 5 && hour >= 18) || dayOfWeek === 6 || (dayOfWeek === 0 && hour <= 23)) {
    const expires = new Date(now);
    // Set expiry to end of Sunday
    expires.setDate(expires.getDate() + (7 - dayOfWeek));
    expires.setHours(23, 59, 59, 999);
    
    return {
      active: true,
      eventType: '🎉 Weekend Flash Sale',
      expiresAt: expires
    };
  }
  
  // Mid-Month Special (15th-17th)
  if (dayOfMonth >= 15 && dayOfMonth <= 17) {
    const expires = new Date(now);
    expires.setDate(17);
    expires.setHours(23, 59, 59, 999);
    
    return {
      active: true,
      eventType: '💎 Mid-Month Mega Deal',
      expiresAt: expires
    };
  }
  
  // Check for manual override from database (for special events)
  // This will be checked in the main function
  
  return {
    active: false,
    eventType: 'No active event',
    expiresAt: null
  };
}

export async function GET(request: NextRequest) {
  try {
    // Initialize Supabase with service role for admin operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if lootbox is active based on time triggers
    const { active: isTimeBasedActive, eventType, expiresAt } = isLootboxActiveNow();

    // Get user ID from auth header (optional - if not logged in, don't check purchases)
    let userId: string | null = null;
    try {
      const authHeader = request.headers.get('authorization');
      if (authHeader) {
        const supabaseClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
        const { data: { user } } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''));
        userId = user?.id || null;
      }
    } catch (e) {
      // Not logged in, that's ok
    }

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

    // Check if user already purchased in this period
    let alreadyPurchased = false;
    if (userId && eventPeriod) {
      const { data: existingPurchase } = await supabase
        .from('lootbox_events')
        .select('id')
        .eq('purchased_by', userId)
        .eq('event_period', eventPeriod)
        .single();
      
      alreadyPurchased = !!existingPurchase;
    }

    // Get active lootbox packages
    const { data: lootboxPackages } = await supabase
      .from('lootbox_packages')
      .select('*')
      .eq('is_active', true)
      .order('user_credits', { ascending: true });

    const availablePackages = [];

    for (const pkg of lootboxPackages || []) {
      // Calculate lootbox pricing (35% discount from Pro tier pricing)
      const regularPricePerCredit = 0.35; // Pro tier pricing
      const regularPrice = pkg.user_credits * regularPricePerCredit;
      const lootboxDiscount = 0.35; // 35% off
      const discountedPrice = regularPrice * (1 - lootboxDiscount);

      availablePackages.push({
        id: pkg.id,
        name: pkg.name,
        description: pkg.description,
        user_credits: pkg.user_credits,
        price_usd: Math.round(discountedPrice * 100) / 100,
        price_per_credit: Math.round((discountedPrice / pkg.user_credits) * 100) / 100,
        regular_price: Math.round(regularPrice * 100) / 100,
        is_lootbox: true,
        available: isTimeBasedActive && !alreadyPurchased, // Only available if active AND not purchased
        already_purchased: alreadyPurchased,
        savings_percentage: Math.round(lootboxDiscount * 100),
        savings_amount: Math.round((regularPrice - discountedPrice) * 100) / 100
      });
    }

    return NextResponse.json({
      success: true,
      lootbox: {
        is_available: isTimeBasedActive && availablePackages.length > 0,
        is_active: isTimeBasedActive,
        current_event: eventType,
        expires_at: expiresAt?.toISOString() || null,
        available_packages: availablePackages,
        trigger_info: {
          type: 'time_based',
          weekend_sale: 'Friday 6pm - Sunday 11pm',
          mid_month_sale: '15th-17th of each month',
          next_event: isTimeBasedActive ? 'Current event active' : 'Check back during sale periods'
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

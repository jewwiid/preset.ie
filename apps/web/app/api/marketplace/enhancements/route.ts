import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const listingId = searchParams.get('listing_id');
    
    if (!listingId) {
      return NextResponse.json({ 
        error: 'Listing ID required' 
      }, { status: 400 });
    }

    // Get active enhancements for the listing
    const { data: enhancements, error } = await supabase
      .from('listing_enhancements')
      .select('*')
      .eq('listing_id', listingId)
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString())
      .order('expires_at', { ascending: false });

    if (error) {
      console.error('Error fetching enhancements:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch enhancements' 
      }, { status: 500 });
    }

    return NextResponse.json({ enhancements });
    
  } catch (error) {
    console.error('Enhancements API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { listingId, enhancementType, userId } = await request.json();
    
    if (!listingId || !enhancementType || !userId) {
      return NextResponse.json({ 
        error: 'Missing required fields: listingId, enhancementType, userId' 
      }, { status: 400 });
    }

    // Get user's subscription tier
    const { data: profile, error: profileError } = await supabase
      .from('users_profile')
      .select('subscription_tier')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ 
        error: 'User profile not found' 
      }, { status: 404 });
    }

    // Check if user has subscription benefits
    if (profile.subscription_tier !== 'FREE') {
      const { data: canUse, error: bumpError } = await supabase
        .rpc('can_use_monthly_bump', { p_user_id: userId });
      
      if (bumpError) {
        console.error('Error checking monthly bump eligibility:', bumpError);
        return NextResponse.json({ 
          error: 'Failed to check subscription benefits' 
        }, { status: 500 });
      }

      if (canUse) {
        // Use subscription benefit
        const enhancementType = profile.subscription_tier === 'PLUS' ? 'priority_bump' : 'premium_bump';
        const durationDays = profile.subscription_tier === 'PLUS' ? 3 : 7;
        
        const startsAt = new Date();
        const expiresAt = new Date(startsAt.getTime() + durationDays * 24 * 60 * 60 * 1000);

        // Create enhancement record
        const { data: enhancement, error: enhancementError } = await supabase
          .from('listing_enhancements')
          .insert({
            listing_id: listingId,
            user_id: userId,
            enhancement_type: enhancementType,
            payment_intent_id: `subscription_${userId}_${Date.now()}`,
            amount_cents: 0, // Free for subscribers
            duration_days: durationDays,
            starts_at: startsAt.toISOString(),
            expires_at: expiresAt.toISOString()
          })
          .select()
          .single();

        if (enhancementError) {
          console.error('Error creating enhancement:', enhancementError);
          return NextResponse.json({ 
            error: 'Failed to create enhancement' 
          }, { status: 500 });
        }

        // Update subscription benefit usage
        const { error: updateError } = await supabase
          .from('subscription_benefits')
          .update({
            used_this_month: supabase.sql`used_this_month + 1`
          })
          .eq('user_id', userId)
          .eq('benefit_type', 'monthly_bump');

        if (updateError) {
          console.error('Error updating subscription benefit usage:', updateError);
        }

        return NextResponse.json({ 
          success: true, 
          message: 'Enhancement applied using subscription benefit',
          enhancement: enhancement
        });
      }
    }

    // Fall back to paid enhancement
    return NextResponse.json({ 
      error: 'Payment required for enhancement',
      requiresPayment: true
    }, { status: 402 });
    
  } catch (error) {
    console.error('Enhancement API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { EnhancementService } from '@/lib/services/enhancement.service';
import { SubscriptionBenefitsService } from '@/lib/services/subscription-benefits.service';

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Initialize Supabase client inside functions to avoid build-time issues
const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing required Supabase environment variables')
  }

  return createClient(supabaseUrl, supabaseServiceKey)
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient()
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

    // Try to apply enhancement using subscription benefits first
    const result = await EnhancementService.applyEnhancementWithSubscription(
      listingId, 
      userId, 
      enhancementType
    );

    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        message: result.message 
      });
    }

    // Fall back to requiring payment
    return NextResponse.json({ 
      error: result.message,
      requiresPayment: result.requiresPayment || false
    }, { status: result.requiresPayment ? 402 : 400 });
    
  } catch (error) {
    console.error('Enhancement API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

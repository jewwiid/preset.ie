import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient()
    const body = await request.json();
    const {
      listing_id,
      owner_id,
      offer_amount_cents,
      message,
      contact_preference
    } = body;

    // Get user from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 });
    }

    // Get user profile
    const { data: userProfile, error: profileError } = await supabase
      .from('users_profile')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Anti-spam checks
    console.log('Running anti-spam checks for user:', userProfile.id);

    // Check for duplicate pending offers
    const { data: duplicateCheck, error: duplicateError } = await supabase.rpc('check_duplicate_request', {
      p_user_id: userProfile.id,
      p_listing_id: listing_id,
      p_table_name: 'offers'
    });

    if (duplicateError) {
      console.error('Duplicate check error:', duplicateError);
      return NextResponse.json({ error: 'Failed to check for duplicate offers' }, { status: 500 });
    }

    if (!duplicateCheck) {
      return NextResponse.json({ 
        error: 'You already have a pending offer for this listing' 
      }, { status: 400 });
    }

    // Check rate limit (max 10 offers per 24 hours)
    const { data: rateLimitCheck, error: rateLimitError } = await supabase.rpc('check_rate_limit', {
      p_user_id: userProfile.id,
      p_table_name: 'offers',
      p_limit_count: 10,
      p_limit_hours: 24
    });

    if (rateLimitError) {
      console.error('Rate limit check error:', rateLimitError);
      return NextResponse.json({ error: 'Failed to check rate limit' }, { status: 500 });
    }

    if (!rateLimitCheck) {
      return NextResponse.json({ 
        error: 'You have reached the maximum number of offers (10) in the last 24 hours. Please try again later.' 
      }, { status: 429 });
    }

    console.log('Anti-spam checks passed');

    // Validate offer amount
    if (offer_amount_cents <= 0) {
      return NextResponse.json({ error: 'Offer amount must be greater than 0' }, { status: 400 });
    }

    // Create offer
    const { data: offer, error } = await supabase
      .from('offers')
      .insert({
        listing_id,
        offerer_id: userProfile.id,
        owner_id,
        offer_amount_cents,
        message,
        contact_preference,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating offer:', error);
      return NextResponse.json({ error: 'Failed to create offer' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      offer,
      message: 'Offer sent successfully'
    }, { status: 201 });

  } catch (error: any) {
    console.error('Offer API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
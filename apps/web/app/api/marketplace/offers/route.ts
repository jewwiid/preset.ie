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

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient()
    
    // Get query parameters
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'all'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

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

    // Build query based on type
    let query = supabase
      .from('offers')
      .select(`
        id,
        listing_id,
        offerer_id,
        owner_id,
        offer_amount_cents,
        message,
        contact_preference,
        status,
        created_at,
        updated_at,
        listings!offers_listing_id_fkey(
          id,
          title,
          category,
          mode,
          status,
          owner_id
        ),
        offerer:users_profile!offers_offerer_id_fkey(
          id,
          display_name,
          handle,
          avatar_url,
          verified_id
        ),
        owner:users_profile!offers_owner_id_fkey(
          id,
          display_name,
          handle,
          avatar_url,
          verified_id
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Filter based on type
    if (type === 'sent') {
      query = query.eq('offerer_id', userProfile.id)
    } else if (type === 'received') {
      query = query.eq('owner_id', userProfile.id)
    }
    // 'all' type shows both sent and received offers

    const { data: offers, error: offersError } = await query

    if (offersError) {
      console.error('Error fetching offers:', offersError);
      return NextResponse.json({ error: 'Failed to fetch offers' }, { status: 500 });
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('offers')
      .select('id', { count: 'exact', head: true })

    if (type === 'sent') {
      countQuery = countQuery.eq('offerer_id', userProfile.id)
    } else if (type === 'received') {
      countQuery = countQuery.eq('owner_id', userProfile.id)
    }

    const { count, error: countError } = await countQuery

    if (countError) {
      console.error('Error fetching offers count:', countError);
      return NextResponse.json({ error: 'Failed to fetch offers count' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      offers: offers || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error: any) {
    console.error('Get offers API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
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

    // Check for ANY existing offers (not just pending)
    const { data: existingOffers, error: existingOffersError } = await supabase
      .from('offers')
      .select('id, status')
      .eq('offerer_id', userProfile.id)
      .eq('listing_id', listing_id);

    if (existingOffersError) {
      console.error('Existing offers check error:', existingOffersError);
      return NextResponse.json({ error: 'Failed to check for existing offers' }, { status: 500 });
    }

    if (existingOffers && existingOffers.length > 0) {
      const statuses = existingOffers.map(offer => offer.status).join(', ');
      return NextResponse.json({ 
        error: `You already have an offer for this listing (status: ${statuses}). You cannot make multiple offers for the same item.` 
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

    // Validate that user is not making an offer on their own listing
    if (userProfile.id === owner_id) {
      return NextResponse.json({ 
        error: 'You cannot make an offer on your own listing' 
      }, { status: 400 });
    }

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
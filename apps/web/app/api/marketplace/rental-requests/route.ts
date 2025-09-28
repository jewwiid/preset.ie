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
    const supabase = getSupabaseClient();
    
    const body = await request.json();
    console.log('Rental request API received:', body);
    
    const {
      listing_id,
      owner_id,
      start_date,
      end_date,
      quantity,
      message,
      total_amount_cents
    } = body;

    // Validate required fields
    if (!listing_id || !owner_id || !start_date || !end_date || !quantity || total_amount_cents === undefined) {
      return NextResponse.json({ 
        error: 'Missing required fields: listing_id, owner_id, start_date, end_date, quantity, total_amount_cents' 
      }, { status: 400 });
    }

    // Get user from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 });
    }

    // Get user profile
    const { data: userProfile, error: profileError } = await supabase
      .from('users_profile')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !userProfile) {
      console.error('Profile error:', profileError);
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Anti-spam checks
    console.log('Running anti-spam checks for user:', userProfile.id);

    // Check for duplicate pending requests
    const { data: duplicateCheck, error: duplicateError } = await supabase.rpc('check_duplicate_request', {
      p_user_id: userProfile.id,
      p_listing_id: listing_id,
      p_table_name: 'rental_requests'
    });

    if (duplicateError) {
      console.error('Duplicate check error:', duplicateError);
      return NextResponse.json({ error: 'Failed to check for duplicate requests' }, { status: 500 });
    }

    if (!duplicateCheck) {
      return NextResponse.json({ 
        error: 'You already have a pending rental request for this listing' 
      }, { status: 400 });
    }

    // Check rate limit (max 5 requests per 24 hours)
    const { data: rateLimitCheck, error: rateLimitError } = await supabase.rpc('check_rate_limit', {
      p_user_id: userProfile.id,
      p_table_name: 'rental_requests',
      p_limit_count: 5,
      p_limit_hours: 24
    });

    if (rateLimitError) {
      console.error('Rate limit check error:', rateLimitError);
      return NextResponse.json({ error: 'Failed to check rate limit' }, { status: 500 });
    }

    if (!rateLimitCheck) {
      return NextResponse.json({ 
        error: 'You have reached the maximum number of rental requests (5) in the last 24 hours. Please try again later.' 
      }, { status: 429 });
    }

    console.log('Anti-spam checks passed');

    // Validate dates
    const startDate = new Date(start_date + 'T00:00:00.000Z'); // Ensure UTC midnight
    const endDate = new Date(end_date + 'T00:00:00.000Z'); // Ensure UTC midnight
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0); // Reset time to start of day in UTC
    
    console.log('Date validation:', { 
      start_date, 
      end_date, 
      startDate: startDate.toISOString(), 
      endDate: endDate.toISOString(), 
      today: today.toISOString(),
      startDateMs: startDate.getTime(),
      todayMs: today.getTime(),
      isStartAfterToday: startDate >= today,
      isEndAfterStart: endDate > startDate
    });
    
    if (startDate >= endDate) {
      return NextResponse.json({ error: 'End date must be after start date' }, { status: 400 });
    }

    if (startDate < today) {
      return NextResponse.json({ error: 'Start date cannot be in the past' }, { status: 400 });
    }

    // Create rental request
    const insertData = {
      listing_id,
      requester_id: userProfile.id,
      owner_id,
      start_date,
      end_date,
      quantity,
      message,
      total_amount_cents,
      status: 'pending'
    };

    console.log('Inserting rental request with data:', insertData);

    const { data: rentalRequest, error } = await supabase
      .from('rental_requests')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error creating rental request:', error);
      return NextResponse.json({ 
        error: 'Failed to create rental request', 
        details: error.message,
        code: error.code 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      rental_request: rentalRequest,
      message: 'Rental request sent successfully'
    }, { status: 201 });

  } catch (error: any) {
    console.error('Rental request API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

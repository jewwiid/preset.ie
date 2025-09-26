import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/marketplace/requests - Browse equipment requests
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const category = searchParams.get('category');
    const city = searchParams.get('city');
    const urgent = searchParams.get('urgent') === 'true';
    const minRating = searchParams.get('min_rating');
    const purpose = searchParams.get('purpose');
    const purposeCategory = searchParams.get('purpose_category');
    const offset = (page - 1) * limit;

    let query = supabase
      .from('equipment_requests_with_ratings')
      .select(`
        *,
        responses:request_responses!request_responses_request_id_fkey(
          id,
          responder_id,
          status,
          created_at
        )
      `)
      .eq('status', 'active')
      .order('urgent', { ascending: false }) // Urgent requests first
      .order('created_at', { ascending: false });

    // Apply filters
    if (category) {
      query = query.eq('category', category);
    }
    
    if (city) {
      query = query.ilike('location_city', `%${city}%`);
    }
    
    if (urgent) {
      query = query.eq('urgent', true);
    }

    // Apply minimum rating filter
    if (minRating) {
      const ratingValue = parseFloat(minRating);
      if (ratingValue > 0) {
        query = query.gte('requester_average_rating', ratingValue);
      }
    }

    // Apply purpose filters
    if (purpose) {
      query = query.eq('purpose_name', purpose);
    }
    
    if (purposeCategory) {
      query = query.eq('purpose_category', purposeCategory);
    }

    // Pagination
    query = query.range(offset, offset + limit - 1);

    const { data: requests, error } = await query;

    if (error) {
      console.error('Error fetching equipment requests:', error);
      
      // Check if it's a table not found error (multiple possible error formats)
      if (error.code === 'PGRST116' || 
          error.message.includes('relation "equipment_requests" does not exist') ||
          error.message.includes("Could not find the table 'public.equipment_requests' in the schema cache")) {
        return NextResponse.json({ 
          error: 'Equipment requests feature not yet available. Please apply database migration first.',
          requests: [],
          pagination: {
            page,
            limit,
            total: 0,
            has_more: false
          }
        }, { status: 503 });
      }
      
      return NextResponse.json({ 
        error: 'Failed to fetch equipment requests',
        details: error.message
      }, { status: 500 });
    }

    // Add response count and format requester data to each request
    const requestsWithCounts = requests?.map(request => ({
      ...request,
      response_count: request.responses?.length || 0,
      responses: undefined, // Remove full response data from public view
      requester: {
        id: request.requester_profile_id,
        display_name: request.requester_display_name,
        handle: request.requester_handle,
        avatar_url: request.requester_avatar_url,
        verified_id: request.requester_verified_id,
        average_rating: request.requester_average_rating,
        review_count: request.requester_review_count
      },
      // Remove individual requester fields from root level
      requester_profile_id: undefined,
      requester_display_name: undefined,
      requester_handle: undefined,
      requester_avatar_url: undefined,
      requester_verified_id: undefined,
      requester_average_rating: undefined,
      requester_review_count: undefined
    }));

    return NextResponse.json({ 
      requests: requestsWithCounts,
      pagination: {
        page,
        limit,
        total: requests?.length || 0,
        has_more: requests?.length === limit
      }
    });

  } catch (error) {
    console.error('Equipment requests API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// POST /api/marketplace/requests - Create equipment request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      category,
      equipment_type,
      condition_preference,
      request_type,
      rental_start_date,
      rental_end_date,
      max_daily_rate_cents,
      max_total_cents,
      max_purchase_price_cents,
      location_city,
      location_country,
      latitude,
      longitude,
      pickup_preferred,
      delivery_acceptable,
      max_distance_km,
      verified_users_only,
      min_rating,
      urgent,
      expires_at,
      purpose_id,
      reference_type,
      reference_title,
      reference_url,
      reference_description,
      reference_thumbnail_url
    } = body;

    // Get user from session
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 });
    }

    // Validate required fields
    if (!title || !request_type) {
      return NextResponse.json({ 
        error: 'Title and request type are required' 
      }, { status: 400 });
    }

    // Validate rental dates if request_type includes 'rent'
    if (request_type === 'rent' || request_type === 'both') {
      if (!rental_start_date || !rental_end_date) {
        return NextResponse.json({ 
          error: 'Rental start and end dates are required for rental requests' 
        }, { status: 400 });
      }
      
      if (new Date(rental_start_date) >= new Date(rental_end_date)) {
        return NextResponse.json({ 
          error: 'Rental end date must be after start date' 
        }, { status: 400 });
      }
    }

    // Validate reference data if provided
    if (reference_type && reference_url) {
      // Validate reference data format
      const { data: validationResult, error: validationError } = await supabase.rpc('validate_reference_data', {
        p_reference_type: reference_type,
        p_reference_title: reference_title,
        p_reference_url: reference_url,
        p_reference_description: reference_description
      });

      if (validationError) {
        console.error('Reference validation error:', validationError);
        return NextResponse.json({ 
          error: 'Failed to validate reference data' 
        }, { status: 500 });
      }

      const validation = validationResult as any;
      if (!validation.success) {
        return NextResponse.json({ 
          error: validation.error 
        }, { status: 400 });
      }
    }

    // Get user profile
    const { data: userProfile, error: profileError } = await supabase
      .from('users_profile')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json({ 
        error: 'User profile not found' 
      }, { status: 404 });
    }

    // Validate ownership for moodboards, treatments, and showcases
    if (reference_type && reference_url && ['moodboard', 'treatment', 'showcase'].includes(reference_type)) {
      const { data: ownershipResult, error: ownershipError } = await supabase.rpc('validate_reference_ownership', {
        p_user_id: userProfile.id,
        p_reference_type: reference_type,
        p_reference_url: reference_url
      });

      if (ownershipError) {
        console.error('Ownership validation error:', ownershipError);
        return NextResponse.json({ 
          error: 'Failed to validate reference ownership' 
        }, { status: 500 });
      }

      const ownership = ownershipResult as any;
      if (!ownership.success) {
        return NextResponse.json({ 
          error: ownership.error 
        }, { status: 400 });
      }
    }

    // Create the request
    const { data: newRequest, error } = await supabase
      .from('equipment_requests')
      .insert({
        requester_id: userProfile.id,
        title,
        description,
        category,
        equipment_type,
        condition_preference: condition_preference || 'any',
        request_type,
        rental_start_date,
        rental_end_date,
        max_daily_rate_cents,
        max_total_cents,
        max_purchase_price_cents,
        location_city,
        location_country,
        latitude,
        longitude,
        pickup_preferred: pickup_preferred ?? true,
        delivery_acceptable: delivery_acceptable ?? false,
        max_distance_km: max_distance_km || 50,
        verified_users_only: verified_users_only ?? false,
        min_rating: min_rating || 0.0,
        urgent: urgent ?? false,
        expires_at: expires_at || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        purpose_id,
        reference_type,
        reference_title,
        reference_url,
        reference_description,
        reference_thumbnail_url
      })
      .select(`
        *,
        requester:users_profile!equipment_requests_requester_id_fkey(
          id,
          display_name,
          handle,
          avatar_url,
          verified_id
        )
      `)
      .single();

    if (error) {
      console.error('Error creating equipment request:', error);
      return NextResponse.json({ 
        error: 'Failed to create equipment request' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      request: newRequest,
      message: 'Equipment request created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Create request API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/marketplace/requests/[id]/responses - Get responses to a request
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const requestId = (await params).id;

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

    // Verify user has access to this request (either requester or responder)
    const { data: equipmentRequest, error: requestError } = await supabase
      .from('equipment_requests')
      .select('requester_id')
      .eq('id', requestId)
      .single();

    if (requestError || !equipmentRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    const isRequester = equipmentRequest.requester_id === user.id;

    // Get responses with responder details
    const { data: responses, error } = await supabase
      .from('request_responses')
      .select(`
        *,
        responder:users_profile!request_responses_responder_id_fkey(
          id,
          display_name,
          handle,
          avatar_url,
          verified_id,
          rating,
          city,
          country
        ),
        listing:listings(
          id,
          title,
          description,
          images:listing_images(path)
        )
      `)
      .eq('request_id', requestId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching responses:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch responses' 
      }, { status: 500 });
    }

    // Filter responses based on user role
    const filteredResponses = responses?.map(response => {
      // If user is the requester, show all response details
      if (isRequester) {
        return response;
      }
      
      // If user is a responder, only show their own response
      if (response.responder_id === user.id) {
        return response;
      }
      
      // Otherwise, hide sensitive information
      return {
        ...response,
        offered_price_cents: null,
        offered_daily_rate_cents: null,
        offered_total_cents: null,
        message: response.status === 'accepted' ? response.message : null
      };
    });

    return NextResponse.json({ 
      responses: filteredResponses,
      is_requester: isRequester
    });

  } catch (error) {
    console.error('Get responses API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// POST /api/marketplace/requests/[id]/responses - Respond to a request
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const requestId = (await params).id;
    const body = await request.json();
    const {
      response_type,
      message,
      offered_price_cents,
      offered_daily_rate_cents,
      offered_total_cents,
      available_start_date,
      available_end_date,
      condition,
      listing_id
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

    // Verify request exists and user is not the requester
    const { data: equipmentRequest, error: requestError } = await supabase
      .from('equipment_requests')
      .select('requester_id, status')
      .eq('id', requestId)
      .single();

    if (requestError || !equipmentRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    if (equipmentRequest.requester_id === user.id) {
      return NextResponse.json({ 
        error: 'Cannot respond to your own request' 
      }, { status: 400 });
    }

    if (equipmentRequest.status !== 'active') {
      return NextResponse.json({ 
        error: 'Cannot respond to inactive request' 
      }, { status: 400 });
    }

    // Check if user already responded
    const { data: existingResponse, error: existingError } = await supabase
      .from('request_responses')
      .select('id')
      .eq('request_id', requestId)
      .eq('responder_id', user.id)
      .single();

    if (existingResponse) {
      return NextResponse.json({ 
        error: 'You have already responded to this request' 
      }, { status: 400 });
    }

    // Create the response
    const { data: newResponse, error } = await supabase
      .from('request_responses')
      .insert({
        request_id: requestId,
        responder_id: user.id,
        listing_id,
        response_type: response_type || 'offer',
        message,
        offered_price_cents,
        offered_daily_rate_cents,
        offered_total_cents,
        available_start_date,
        available_end_date,
        condition
      })
      .select(`
        *,
        responder:users_profile!request_responses_responder_id_fkey(
          id,
          display_name,
          handle,
          avatar_url,
          verified_id,
          rating
        ),
        listing:listings(
          id,
          title,
          images:listing_images(path)
        )
      `)
      .single();

    if (error) {
      console.error('Error creating response:', error);
      return NextResponse.json({ 
        error: 'Failed to create response' 
      }, { status: 500 });
    }

    // Create conversation between requester and responder
    await supabase
      .from('request_conversations')
      .insert({
        request_id: requestId,
        requester_id: equipmentRequest.requester_id,
        responder_id: user.id,
        response_id: newResponse.id
      });

    // Send notification to requester
    await supabase.functions.invoke('create-notification', {
      body: {
        user_id: equipmentRequest.requester_id,
        type: 'request_response',
        title: 'New Response to Your Request',
        message: `${newResponse.responder.display_name} responded to your equipment request`,
        metadata: {
          request_id: requestId,
          response_id: newResponse.id,
          responder_id: user.id
        }
      }
    });

    return NextResponse.json({ 
      response: newResponse,
      message: 'Response created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Create response API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

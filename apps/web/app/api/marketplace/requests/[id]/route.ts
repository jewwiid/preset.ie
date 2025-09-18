import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/marketplace/requests/[id] - Get specific equipment request
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const requestId = params.id;

    const { data: equipmentRequest, error } = await supabase
      .from('equipment_requests')
      .select(`
        *,
        requester:users_profile!equipment_requests_requester_id_fkey(
          id,
          display_name,
          handle,
          avatar_url,
          verified_id,
          rating,
          city,
          country
        ),
        responses:request_responses(
          id,
          responder_id,
          listing_id,
          response_type,
          message,
          offered_price_cents,
          offered_daily_rate_cents,
          offered_total_cents,
          available_start_date,
          available_end_date,
          condition,
          status,
          created_at,
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
        )
      `)
      .eq('id', requestId)
      .single();

    if (error) {
      console.error('Error fetching equipment request:', error);
      return NextResponse.json({ 
        error: 'Equipment request not found' 
      }, { status: 404 });
    }

    return NextResponse.json({ request: equipmentRequest });

  } catch (error) {
    console.error('Get request API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// PUT /api/marketplace/requests/[id] - Update equipment request
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const requestId = params.id;
    const body = await request.json();

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

    // Verify user owns the request
    const { data: existingRequest, error: fetchError } = await supabase
      .from('equipment_requests')
      .select('requester_id')
      .eq('id', requestId)
      .single();

    if (fetchError || !existingRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    if (existingRequest.requester_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Update the request
    const { data: updatedRequest, error } = await supabase
      .from('equipment_requests')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId)
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
      console.error('Error updating equipment request:', error);
      return NextResponse.json({ 
        error: 'Failed to update equipment request' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      request: updatedRequest,
      message: 'Equipment request updated successfully'
    });

  } catch (error) {
    console.error('Update request API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// DELETE /api/marketplace/requests/[id] - Delete equipment request
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const requestId = params.id;

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

    // Verify user owns the request
    const { data: existingRequest, error: fetchError } = await supabase
      .from('equipment_requests')
      .select('requester_id')
      .eq('id', requestId)
      .single();

    if (fetchError || !existingRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    if (existingRequest.requester_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Delete the request (cascade will handle related records)
    const { error } = await supabase
      .from('equipment_requests')
      .delete()
      .eq('id', requestId);

    if (error) {
      console.error('Error deleting equipment request:', error);
      return NextResponse.json({ 
        error: 'Failed to delete equipment request' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Equipment request deleted successfully'
    });

  } catch (error) {
    console.error('Delete request API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/marketplace/requests/[id]/conversation - Get conversation for a request
export async function GET(
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

    // Get conversation for this request and user
    const { data: conversation, error } = await supabase
      .from('request_conversations')
      .select(`
        *,
        requester:users_profile!request_conversations_requester_id_fkey(
          id,
          display_name,
          handle,
          avatar_url
        ),
        responder:users_profile!request_conversations_responder_id_fkey(
          id,
          display_name,
          handle,
          avatar_url
        ),
        request:equipment_requests(
          id,
          title,
          status
        )
      `)
      .eq('request_id', requestId)
      .or(`requester_id.eq.${user.id},responder_id.eq.${user.id}`)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ 
          error: 'Conversation not found or access denied' 
        }, { status: 404 });
      }
      console.error('Error fetching conversation:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch conversation' 
      }, { status: 500 });
    }

    return NextResponse.json({ conversation });

  } catch (error) {
    console.error('Conversation API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// POST /api/marketplace/requests/[id]/conversation - Create conversation
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const requestId = params.id;
    const body = await request.json();
    const { responder_id } = body;
    
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
    const { data: requestData, error: requestError } = await supabase
      .from('equipment_requests')
      .select('id, requester_id, title')
      .eq('id', requestId)
      .eq('requester_id', user.id)
      .single();

    if (requestError || !requestData) {
      return NextResponse.json({ 
        error: 'Request not found or access denied' 
      }, { status: 404 });
    }

    // Check if conversation already exists
    const { data: existingConversation } = await supabase
      .from('request_conversations')
      .select('id')
      .eq('request_id', requestId)
      .eq('responder_id', responder_id)
      .single();

    if (existingConversation) {
      return NextResponse.json({ 
        conversation: existingConversation,
        message: 'Conversation already exists'
      });
    }

    // Create new conversation
    const { data: conversation, error } = await supabase
      .from('request_conversations')
      .insert({
        request_id: requestId,
        requester_id: user.id,
        responder_id: responder_id,
        status: 'active'
      })
      .select(`
        *,
        requester:users_profile!request_conversations_requester_id_fkey(
          id,
          display_name,
          handle,
          avatar_url
        ),
        responder:users_profile!request_conversations_responder_id_fkey(
          id,
          display_name,
          handle,
          avatar_url
        )
      `)
      .single();

    if (error) {
      console.error('Error creating conversation:', error);
      return NextResponse.json({ 
        error: 'Failed to create conversation' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      conversation,
      message: 'Conversation created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Create conversation API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
